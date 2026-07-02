import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import {
	assertUserNotBanned,
	canAccessShipment,
	getCompanyMember,
	getDriverByUserId,
	requireAdmin,
	requireUser,
} from "./lib/auth";
import { generateTicketNumber } from "./lib/helpers";
import { ticketCategory, ticketPriority } from "./lib/validators";

type Ctx = MutationCtx | QueryCtx;

async function generateUniqueTicketNumber(ctx: MutationCtx) {
	for (let attempt = 0; attempt < 10; attempt += 1) {
		const ticketNumber = generateTicketNumber();
		const existing = await ctx.db
			.query("supportTickets")
			.withIndex("by_ticket_number", (q) => q.eq("ticketNumber", ticketNumber))
			.unique();
		if (!existing) return ticketNumber;
	}

	throw new Error("Could not allocate ticket number");
}

async function notifyAdmins(
	ctx: MutationCtx,
	input: {
		type: string;
		title: string;
		body?: string;
		ticketId: Id<"supportTickets">;
		excludeUserId?: Id<"users">;
	},
) {
	const admins = await ctx.db.query("users").collect();
	for (const admin of admins) {
		if (!admin.isAdmin || admin._id === input.excludeUserId) continue;
		await ctx.db.insert("notifications", {
			recipientUserId: admin._id,
			type: input.type,
			title: input.title,
			body: input.body,
			relatedTicketId: input.ticketId,
			createdAt: Date.now(),
		});
	}
}

async function canAccessBooking(
	ctx: Ctx,
	user: Doc<"users">,
	booking: Doc<"bookings">,
) {
	if (user.isAdmin || booking.userId === user._id) return true;
	const member = await getCompanyMember(ctx, booking.companyId, user._id);
	return member?.status === "active" && member.role !== "driver";
}

async function canAccessTicket(
	ctx: Ctx,
	user: Doc<"users">,
	ticket: Doc<"supportTickets">,
) {
	if (user.isAdmin || ticket.createdByUserId === user._id) return true;

	if (ticket.companyId) {
		const member = await getCompanyMember(ctx, ticket.companyId, user._id);
		if (member?.status === "active" && member.role !== "driver") return true;
	}

	if (ticket.driverId) {
		const driver = await ctx.db.get(ticket.driverId);
		if (driver?.userId === user._id && driver.status === "active") return true;
	}

	return false;
}

async function getSenderRole(
	ctx: Ctx,
	user: Doc<"users">,
	ticket: Doc<"supportTickets">,
): Promise<"user" | "company" | "driver" | "admin"> {
	if (user.isAdmin) return "admin";

	if (ticket.companyId) {
		const member = await getCompanyMember(ctx, ticket.companyId, user._id);
		if (member?.status === "active" && member.role !== "driver") {
			return "company";
		}
	}

	if (ticket.driverId) {
		const driver = await ctx.db.get(ticket.driverId);
		if (driver?.userId === user._id) return "driver";
	}

	return "user";
}

export const create = mutation({
	args: {
		subject: v.string(),
		message: v.string(),
		category: ticketCategory,
		priority: v.optional(ticketPriority),
		bookingId: v.optional(v.id("bookings")),
		shipmentId: v.optional(v.id("shipments")),
		companyId: v.optional(v.id("companies")),
	},
	handler: async (ctx, args) => {
		const user = await requireUser(ctx);
		assertUserNotBanned(user);

		let createdByRole: "user" | "company" | "driver" | "admin" = "user";
		let driverId: Id<"drivers"> | undefined;
		let companyId = args.companyId;
		if (user.isAdmin) createdByRole = "admin";
		else if (args.companyId) {
			const member = await getCompanyMember(ctx, args.companyId, user._id);
			if (member?.status !== "active" || member.role === "driver") {
				throw new Error("Company support access denied");
			}
			createdByRole = "company";
		} else {
			const driver = await getDriverByUserId(ctx, user._id);
			if (driver?.status === "active") {
				createdByRole = "driver";
				driverId = driver._id;
			}
		}

		if (args.bookingId) {
			const booking = await ctx.db.get(args.bookingId);
			if (!booking || !(await canAccessBooking(ctx, user, booking))) {
				throw new Error("Booking access denied");
			}
			if (args.companyId && booking.companyId !== args.companyId) {
				throw new Error("Booking does not belong to company");
			}
			companyId ??= booking.companyId;
		}

		if (args.shipmentId) {
			const shipment = await ctx.db.get(args.shipmentId);
			if (!shipment || !(await canAccessShipment(ctx, shipment, user))) {
				throw new Error("Shipment access denied");
			}
			if (args.companyId && shipment.companyId !== args.companyId) {
				throw new Error("Shipment does not belong to company");
			}
			companyId ??= shipment.companyId;
		}

		const now = Date.now();
		const ticketId = await ctx.db.insert("supportTickets", {
			ticketNumber: await generateUniqueTicketNumber(ctx),
			createdByUserId: user._id,
			createdByRole,
			companyId,
			driverId,
			bookingId: args.bookingId,
			shipmentId: args.shipmentId,
			subject: args.subject,
			category: args.category,
			priority: args.priority ?? "medium",
			status: "open",
			lastMessageAt: now,
			createdAt: now,
			updatedAt: now,
		});

		await ctx.db.insert("supportMessages", {
			ticketId,
			senderUserId: user._id,
			senderRole: createdByRole,
			message: args.message,
			internalOnly: false,
			createdAt: now,
		});

		await notifyAdmins(ctx, {
			type: "ticket_created",
			title: "New Support Ticket",
			body: args.subject,
			ticketId,
			excludeUserId: user._id,
		});

		return ticketId;
	},
});

export const listForCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		const user = await requireUser(ctx);
		return await ctx.db
			.query("supportTickets")
			.withIndex("by_created_by_user_id", (q) =>
				q.eq("createdByUserId", user._id),
			)
			.order("desc")
			.collect();
	},
});

export const listForCompany = query({
	args: { companyId: v.id("companies") },
	handler: async (ctx, args) => {
		const user = await requireUser(ctx);
		const member = await getCompanyMember(ctx, args.companyId, user._id);
		if (member?.status !== "active" || member.role === "driver") {
			throw new Error("Company support access denied");
		}

		return await ctx.db
			.query("supportTickets")
			.withIndex("by_company_id", (q) => q.eq("companyId", args.companyId))
			.order("desc")
			.collect();
	},
});

export const listForAdmin = query({
	args: {},
	handler: async (ctx) => {
		await requireAdmin(ctx);
		return await ctx.db
			.query("supportTickets")
			.withIndex("by_status", (q) => q.eq("status", "open"))
			.order("desc")
			.collect();
	},
});

export const listAllForAdmin = query({
	args: {},
	handler: async (ctx) => {
		await requireAdmin(ctx);
		return await ctx.db.query("supportTickets").order("desc").take(50);
	},
});

export const getById = query({
	args: { ticketId: v.id("supportTickets") },
	handler: async (ctx, args) => {
		const user = await requireUser(ctx);
		const ticket = await ctx.db.get(args.ticketId);
		if (!ticket) return null;

		if (!(await canAccessTicket(ctx, user, ticket))) return null;

		const messages = await ctx.db
			.query("supportMessages")
			.withIndex("by_ticket_id", (q) => q.eq("ticketId", args.ticketId))
			.order("asc")
			.collect();

		const visibleMessages = user.isAdmin
			? messages
			: messages.filter((m) => !m.internalOnly);

		return { ticket, messages: visibleMessages };
	},
});

export const addMessage = mutation({
	args: {
		ticketId: v.id("supportTickets"),
		message: v.string(),
		internalOnly: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const user = await requireUser(ctx);
		const ticket = await ctx.db.get(args.ticketId);
		if (!ticket) throw new Error("Ticket not found");

		if (!(await canAccessTicket(ctx, user, ticket)))
			throw new Error("Access denied");
		if (args.internalOnly && !user.isAdmin) {
			throw new Error("Only admins can add internal notes");
		}

		const now = Date.now();
		const senderRole = await getSenderRole(ctx, user, ticket);

		await ctx.db.insert("supportMessages", {
			ticketId: args.ticketId,
			senderUserId: user._id,
			senderRole,
			message: args.message,
			internalOnly: args.internalOnly ?? false,
			createdAt: now,
		});

		await ctx.db.patch(args.ticketId, {
			lastMessageAt: now,
			updatedAt: now,
			status: user.isAdmin ? "waiting_for_user" : "waiting_for_admin",
		});

		if (user.isAdmin) {
			await ctx.db.insert("notifications", {
				recipientUserId: ticket.createdByUserId,
				type: "ticket_updated",
				title: "Support Ticket Updated",
				body: ticket.subject,
				relatedTicketId: args.ticketId,
				createdAt: now,
			});
			return;
		}

		await notifyAdmins(ctx, {
			type: "ticket_updated",
			title: "Support Ticket Updated",
			body: ticket.subject,
			ticketId: args.ticketId,
			excludeUserId: user._id,
		});
	},
});

export const updateStatus = mutation({
	args: {
		ticketId: v.id("supportTickets"),
		status: v.union(
			v.literal("resolved"),
			v.literal("closed"),
			v.literal("under_review"),
		),
	},
	handler: async (ctx, args) => {
		await requireAdmin(ctx);
		const now = Date.now();
		const updates: Record<string, unknown> = {
			status: args.status,
			updatedAt: now,
		};
		if (args.status === "resolved") updates.resolvedAt = now;
		if (args.status === "closed") updates.closedAt = now;
		await ctx.db.patch(args.ticketId, updates);
	},
});
