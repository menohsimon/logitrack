import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { query } from "./_generated/server";
import { getCompanyMember, requireShipmentAccess } from "./lib/auth";

export async function createTrackingEvent(
	ctx: MutationCtx,
	args: {
		shipmentId: Id<"shipments">;
		bookingId: Id<"bookings">;
		companyId: Id<"companies">;
		driverId?: Id<"drivers">;
		actorUserId: Id<"users">;
		actorRole: "admin" | "user" | "company" | "driver" | "system";
		eventType: string;
		previousStatus?: string;
		newStatus?: string;
		title: string;
		description?: string;
		visibility?: "public" | "company" | "admin";
		proofIds?: Id<"proofs">[];
	},
) {
	return await ctx.db.insert("trackingEvents", {
		shipmentId: args.shipmentId,
		bookingId: args.bookingId,
		companyId: args.companyId,
		driverId: args.driverId,
		actorUserId: args.actorUserId,
		actorRole: args.actorRole,
		eventType: args.eventType,
		previousStatus: args.previousStatus,
		newStatus: args.newStatus,
		title: args.title,
		description: args.description,
		visibility: args.visibility ?? "public",
		proofIds: args.proofIds,
		createdAt: Date.now(),
	});
}

export async function filterVisibleTrackingEvents(
	ctx: QueryCtx,
	user: Doc<"users">,
	shipment: Doc<"shipments">,
	events: Doc<"trackingEvents">[],
) {
	if (user.isAdmin) return events;

	if (shipment.userId === user._id) {
		return events.filter((event) => event.visibility === "public");
	}

	const member = await getCompanyMember(ctx, shipment.companyId, user._id);
	if (member?.status === "active") {
		return events.filter((event) => event.visibility !== "admin");
	}

	if (shipment.driverId) {
		const driver = await ctx.db.get(shipment.driverId);
		if (driver?.userId === user._id && driver.status === "active") {
			return events.filter((event) => event.visibility !== "admin");
		}
	}

	return [];
}

export const listByShipment = query({
	args: { shipmentId: v.id("shipments") },
	handler: async (ctx, args) => {
		const { user, shipment } = await requireShipmentAccess(
			ctx,
			args.shipmentId,
		);
		const events = await ctx.db
			.query("trackingEvents")
			.withIndex("by_shipment_id", (q) => q.eq("shipmentId", args.shipmentId))
			.order("desc")
			.collect();

		return await filterVisibleTrackingEvents(ctx, user, shipment, events);
	},
});
