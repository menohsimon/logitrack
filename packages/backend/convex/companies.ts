import { v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import {
	assertUserNotBanned,
	getActiveCompanyOperators,
	getCompanyMember,
	getDriverByUserId,
	getOptionalUser,
	requireAdmin,
	requireCompanyOperator,
	requireCompanyProfileManager,
	requireUser,
} from "./lib/auth";
import { sanitizeGeoPoint } from "./lib/geo";
import { slugify } from "./lib/helpers";
import {
	ensureCompanyInviteNotification,
	normalizeInviteEmail,
} from "./lib/invites";
import { cargoCategory, companyInviteRole, geoPoint } from "./lib/validators";
import { ensureCompanyWallet, ensureDriverWallet } from "./wallets";

const DEFAULT_DRIVER_COMPENSATION_RATE_BPS = 6000;

type Ctx = QueryCtx | MutationCtx;
type CompanyMember = Doc<"companyMembers">;

const companyManagementRoles: readonly CompanyMember["role"][] = [
	"owner",
	"manager",
];

function isCompanyManagementRole(role: CompanyMember["role"]) {
	return companyManagementRoles.includes(role);
}

function normalizeCompensationRateBps(value: number | undefined) {
	const rate = value ?? DEFAULT_DRIVER_COMPENSATION_RATE_BPS;
	if (!Number.isFinite(rate) || rate < 0 || rate > 10_000) {
		throw new Error("Driver compensation must be between 0% and 100%");
	}
	return Math.round(rate);
}

async function getManageableCompanies(ctx: Ctx, userId: Id<"users">) {
	const memberships = await ctx.db
		.query("companyMembers")
		.withIndex("by_user_id", (q) => q.eq("userId", userId))
		.collect();

	const activeManagementMemberships = memberships.filter(
		(member) =>
			member.status === "active" && isCompanyManagementRole(member.role),
	);

	const results: Array<{
		company: Doc<"companies">;
		member: Doc<"companyMembers">;
	}> = [];
	for (const member of activeManagementMemberships) {
		const company = await ctx.db.get(member.companyId);
		if (company) {
			results.push({ company, member });
		}
	}
	return results;
}

async function markInviteNotificationsRead(
	ctx: MutationCtx,
	userId: Id<"users">,
	inviteId: Id<"companyInvites">,
) {
	const notifications = await ctx.db
		.query("notifications")
		.withIndex("by_related_company_invite_id", (q) =>
			q.eq("relatedCompanyInviteId", inviteId),
		)
		.collect();
	const now = Date.now();
	for (const notification of notifications) {
		if (notification.recipientUserId === userId) {
			await ctx.db.patch(notification._id, {
				readAt: notification.readAt ?? now,
				relatedCompanyInviteId: undefined,
			});
		}
	}
}

export const listApproved = query({
	args: {
		search: v.optional(v.string()),
		region: v.optional(v.string()),
		category: v.optional(v.string()),
		minRating: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		let companies = await ctx.db
			.query("companies")
			.withIndex("by_status", (q) => q.eq("status", "approved"))
			.collect();

		if (args.search) {
			const search = args.search.toLowerCase();
			companies = companies.filter(
				(c) =>
					c.name.toLowerCase().includes(search) ||
					c.description?.toLowerCase().includes(search),
			);
		}
		if (args.region) {
			const region = args.region;
			companies = companies.filter((c) => c.operatingRegions.includes(region));
		}
		if (args.category) {
			const category = args.category;
			companies = companies.filter((c) => c.cargoCategories.includes(category));
		}
		if (args.minRating) {
			const minRating = args.minRating;
			companies = companies.filter((c) => c.averageRating >= minRating);
		}

		return companies.sort((a, b) => b.averageRating - a.averageRating);
	},
});

export const getBySlug = query({
	args: { slug: v.string() },
	handler: async (ctx, args) => {
		const company = await ctx.db
			.query("companies")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.unique();
		if (company?.status !== "approved") return null;
		return company;
	},
});

export const getPublicProfileBySlug = query({
	args: { slug: v.string() },
	handler: async (ctx, args) => {
		const company = await ctx.db
			.query("companies")
			.withIndex("by_slug", (q) => q.eq("slug", args.slug))
			.unique();
		if (company?.status !== "approved") return null;

		return {
			company,
			logoUrl: company.logoStorageId
				? await ctx.storage.getUrl(company.logoStorageId)
				: null,
			coverImageUrl: company.coverImageStorageId
				? await ctx.storage.getUrl(company.coverImageStorageId)
				: null,
		};
	},
});

export const getById = query({
	args: { companyId: v.id("companies") },
	handler: async (ctx, args) => {
		const company = await ctx.db.get(args.companyId);
		if (!company) return null;
		if (company.status === "approved") return company;

		const user = await getOptionalUser(ctx);
		if (!user) return null;
		if (user.isAdmin) return company;

		const member = await getCompanyMember(ctx, company._id, user._id);
		if (member?.status === "active") return company;

		return null;
	},
});

export const getCurrentCompany = query({
	args: {},
	handler: async (ctx) => {
		const user = await getOptionalUser(ctx);
		if (!user) return null;

		const memberships = await getManageableCompanies(ctx, user._id);
		if (memberships.length === 0) {
			return {
				company: null,
				member: null,
				memberships,
				activeCompanyId: user.activeCompanyId,
			};
		}

		const selected =
			memberships.find(({ company }) => user.activeCompanyId === company._id) ??
			memberships[0];

		return {
			company: selected.company,
			member: selected.member,
			memberships,
			activeCompanyId: selected.company._id,
		};
	},
});

export const listCurrentUserCompanies = query({
	args: {},
	handler: async (ctx) => {
		const user = await getOptionalUser(ctx);
		if (!user) return { activeCompanyId: null, memberships: [] };

		return {
			activeCompanyId: user.activeCompanyId ?? null,
			memberships: await getManageableCompanies(ctx, user._id),
		};
	},
});

export const setActiveCompany = mutation({
	args: { companyId: v.id("companies") },
	handler: async (ctx, args) => {
		const user = await requireUser(ctx);
		assertUserNotBanned(user);
		const member = await getCompanyMember(ctx, args.companyId, user._id);
		if (member?.status !== "active" || !isCompanyManagementRole(member.role)) {
			throw new Error("Company management access required");
		}
		await ctx.db.patch(user._id, {
			activeCompanyId: args.companyId,
			defaultRole: "company",
			updatedAt: Date.now(),
		});
		return { success: true };
	},
});

export const createCompany = mutation({
	args: {
		name: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await requireUser(ctx);
		assertUserNotBanned(user);

		const name = args.name.trim();
		if (!name) {
			throw new Error("Company name is required");
		}

		const now = Date.now();
		let slug = slugify(name);
		const slugExists = await ctx.db
			.query("companies")
			.withIndex("by_slug", (q) => q.eq("slug", slug))
			.unique();
		if (slugExists) slug = `${slug}-${Date.now().toString(36)}`;

		const companyId = await ctx.db.insert("companies", {
			ownerUserId: user._id,
			name,
			slug,
			operatingRegions: [],
			serviceCategories: [],
			cargoCategories: ["general_package"],
			status: "draft",
			verificationStatus: "not_submitted",
			averageRating: 0,
			reviewCount: 0,
			completedShipmentCount: 0,
			createdAt: now,
			updatedAt: now,
		});

		await ctx.db.insert("companyMembers", {
			companyId,
			userId: user._id,
			role: "owner",
			status: "active",
			createdAt: now,
			updatedAt: now,
		});

		await ensureCompanyWallet(ctx, companyId);

		await ctx.db.patch(user._id, {
			activeCompanyId: companyId,
			defaultRole: "company",
			updatedAt: now,
		});

		return companyId;
	},
});

export const listPendingInvitesForCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		const user = await getOptionalUser(ctx);
		if (!user) return [];

		const email = normalizeInviteEmail(user.email);
		if (!email) return [];

		const invites = await ctx.db
			.query("companyInvites")
			.withIndex("by_email", (q) => q.eq("email", email))
			.collect();

		const results: Array<{
			invite: Doc<"companyInvites">;
			company: Doc<"companies"> | null;
			inviter: Doc<"users"> | null;
		}> = [];
		for (const invite of invites) {
			if (invite.status !== "pending") continue;
			results.push({
				invite,
				company: await ctx.db.get(invite.companyId),
				inviter: await ctx.db.get(invite.invitedByUserId),
			});
		}
		return results;
	},
});

export const listTeamMembers = query({
	args: { companyId: v.id("companies") },
	handler: async (ctx, args) => {
		await requireCompanyOperator(ctx, args.companyId);
		const members = await ctx.db
			.query("companyMembers")
			.withIndex("by_company_id", (q) => q.eq("companyId", args.companyId))
			.collect();

		return await Promise.all(
			members.map(async (member) => ({
				member,
				user: await ctx.db.get(member.userId),
			})),
		);
	},
});

export const listCompanyInvites = query({
	args: { companyId: v.id("companies") },
	handler: async (ctx, args) => {
		await requireCompanyOperator(ctx, args.companyId);
		const invites = await ctx.db
			.query("companyInvites")
			.withIndex("by_company_id", (q) => q.eq("companyId", args.companyId))
			.order("desc")
			.take(50);

		return await Promise.all(
			invites.map(async (invite) => ({
				invite,
				inviter: await ctx.db.get(invite.invitedByUserId),
			})),
		);
	},
});

export const inviteMember = mutation({
	args: {
		companyId: v.id("companies"),
		email: v.string(),
		role: v.optional(companyInviteRole),
		driverCompensationRateBps: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { user: inviter } = await requireCompanyOperator(ctx, args.companyId);
		const email = normalizeInviteEmail(args.email);
		if (!email?.includes("@")) {
			throw new Error("Enter a valid email address");
		}

		const role = args.role ?? "driver";
		const driverCompensationRateBps =
			role === "driver"
				? normalizeCompensationRateBps(args.driverCompensationRateBps)
				: undefined;
		const company = await ctx.db.get(args.companyId);
		if (!company) throw new Error("Company not found");

		const usersWithEmail = await ctx.db
			.query("users")
			.withIndex("by_email", (q) => q.eq("email", email))
			.collect();
		const invitedUser = usersWithEmail[0] ?? null;

		if (invitedUser) {
			const member = await getCompanyMember(
				ctx,
				args.companyId,
				invitedUser._id,
			);
			if (member?.status === "active") {
				throw new Error("This user is already a company member");
			}

			if (role === "driver") {
				const existingDriver = await getDriverByUserId(ctx, invitedUser._id);
				if (
					existingDriver &&
					existingDriver.status === "active" &&
					existingDriver.companyId !== args.companyId
				) {
					throw new Error("Driver already belongs to another company");
				}
			}
		}

		const existingInvites = await ctx.db
			.query("companyInvites")
			.withIndex("by_company_and_email", (q) =>
				q.eq("companyId", args.companyId).eq("email", email),
			)
			.collect();
		const pendingInvite = existingInvites.find(
			(invite) => invite.status === "pending",
		);
		const now = Date.now();

		if (pendingInvite) {
			await ctx.db.patch(pendingInvite._id, {
				role,
				driverCompensationRateBps,
				invitedByUserId: inviter._id,
				updatedAt: now,
			});
			if (invitedUser) {
				await ensureCompanyInviteNotification(
					ctx,
					invitedUser._id,
					pendingInvite._id,
				);
			}
			return pendingInvite._id;
		}

		const inviteId = await ctx.db.insert("companyInvites", {
			companyId: args.companyId,
			email,
			invitedByUserId: inviter._id,
			role,
			driverCompensationRateBps,
			status: "pending",
			createdAt: now,
			updatedAt: now,
		});

		if (invitedUser) {
			await ensureCompanyInviteNotification(ctx, invitedUser._id, inviteId);
		}

		return inviteId;
	},
});

export const acceptInvite = mutation({
	args: { inviteId: v.id("companyInvites") },
	handler: async (ctx, args) => {
		const user = await requireUser(ctx);
		assertUserNotBanned(user);

		const invite = await ctx.db.get(args.inviteId);
		if (invite?.status !== "pending") {
			throw new Error("Invite is no longer available");
		}
		if (normalizeInviteEmail(user.email) !== invite.email) {
			throw new Error("Invite email does not match your account");
		}

		const company = await ctx.db.get(invite.companyId);
		if (!company) throw new Error("Company not found");

		if (invite.role === "driver") {
			const existingDriver = await getDriverByUserId(ctx, user._id);
			if (
				existingDriver &&
				existingDriver.status === "active" &&
				existingDriver.companyId !== invite.companyId
			) {
				throw new Error("Driver already belongs to another company");
			}
		}

		const now = Date.now();
		const existingMember = await getCompanyMember(
			ctx,
			invite.companyId,
			user._id,
		);

		if (!existingMember) {
			await ctx.db.insert("companyMembers", {
				companyId: invite.companyId,
				userId: user._id,
				role: invite.role,
				status: "active",
				createdAt: now,
				updatedAt: now,
			});
		} else {
			await ctx.db.patch(existingMember._id, {
				role: invite.role,
				status: "active",
				updatedAt: now,
			});
		}

		if (invite.role === "driver") {
			const existingDriver = await getDriverByUserId(ctx, user._id);
			if (!existingDriver) {
				const driverId = await ctx.db.insert("drivers", {
					userId: user._id,
					companyId: invite.companyId,
					status: "active",
					compensationRateBps:
						invite.driverCompensationRateBps ??
						DEFAULT_DRIVER_COMPENSATION_RATE_BPS,
					averageRating: 0,
					reviewCount: 0,
					completedShipmentCount: 0,
					createdAt: now,
					updatedAt: now,
				});
				await ensureDriverWallet(ctx, driverId);
			} else {
				await ctx.db.patch(existingDriver._id, {
					companyId: invite.companyId,
					status: "active",
					compensationRateBps:
						invite.driverCompensationRateBps ??
						existingDriver.compensationRateBps ??
						DEFAULT_DRIVER_COMPENSATION_RATE_BPS,
					updatedAt: now,
				});
				await ensureDriverWallet(ctx, existingDriver._id);
			}
		}

		await ctx.db.patch(invite._id, {
			status: "accepted",
			acceptedByUserId: user._id,
			acceptedAt: now,
			updatedAt: now,
		});

		await ctx.db.patch(user._id, {
			activeCompanyId:
				invite.role === "manager" ? invite.companyId : user.activeCompanyId,
			defaultRole: invite.role === "driver" ? "driver" : "company",
			updatedAt: now,
		});

		await markInviteNotificationsRead(ctx, user._id, invite._id);

		return {
			success: true,
			companyId: company._id,
			role: invite.role,
			redirectTo: invite.role === "driver" ? "/driver" : "/company",
		};
	},
});

export const declineInvite = mutation({
	args: { inviteId: v.id("companyInvites") },
	handler: async (ctx, args) => {
		const user = await requireUser(ctx);
		const invite = await ctx.db.get(args.inviteId);
		if (invite?.status !== "pending") {
			throw new Error("Invite is no longer available");
		}
		if (normalizeInviteEmail(user.email) !== invite.email) {
			throw new Error("Invite email does not match your account");
		}

		const now = Date.now();
		await ctx.db.patch(invite._id, {
			status: "declined",
			declinedAt: now,
			updatedAt: now,
		});
		await markInviteNotificationsRead(ctx, user._id, invite._id);
		return { success: true };
	},
});

export const revokeInvite = mutation({
	args: { inviteId: v.id("companyInvites") },
	handler: async (ctx, args) => {
		const invite = await ctx.db.get(args.inviteId);
		if (invite?.status !== "pending") {
			throw new Error("Invite is no longer pending");
		}
		await requireCompanyOperator(ctx, invite.companyId);
		const now = Date.now();
		await ctx.db.patch(invite._id, {
			status: "revoked",
			revokedAt: now,
			updatedAt: now,
		});
		const notifications = await ctx.db
			.query("notifications")
			.withIndex("by_related_company_invite_id", (q) =>
				q.eq("relatedCompanyInviteId", invite._id),
			)
			.collect();
		for (const notification of notifications) {
			await ctx.db.patch(notification._id, {
				body: "This invite was revoked.",
				readAt: notification.readAt ?? now,
				relatedCompanyInviteId: undefined,
			});
		}
		return { success: true };
	},
});

export const updateProfile = mutation({
	args: {
		companyId: v.id("companies"),
		name: v.optional(v.string()),
		legalName: v.optional(v.string()),
		description: v.optional(v.string()),
		contactEmail: v.optional(v.string()),
		phone: v.optional(v.string()),
		address: v.optional(v.string()),
		operatingRegions: v.optional(v.array(v.string())),
		serviceCategories: v.optional(v.array(v.string())),
		cargoCategories: v.optional(v.array(cargoCategory)),
	},
	handler: async (ctx, args) => {
		await requireCompanyProfileManager(ctx, args.companyId);
		const { companyId, ...updates } = args;
		await ctx.db.patch(companyId, { ...updates, updatedAt: Date.now() });
	},
});

export const updateLocation = mutation({
	args: {
		companyId: v.id("companies"),
		location: geoPoint,
	},
	handler: async (ctx, args) => {
		await requireCompanyProfileManager(ctx, args.companyId);
		await ctx.db.patch(args.companyId, {
			location: sanitizeGeoPoint(args.location),
			updatedAt: Date.now(),
		});
	},
});

export const submitForVerification = mutation({
	args: { companyId: v.id("companies") },
	handler: async (ctx, args) => {
		await requireCompanyProfileManager(ctx, args.companyId);
		const company = await ctx.db.get(args.companyId);
		if (!company) throw new Error("Company not found");
		if (
			!company.name.trim() ||
			!company.contactEmail?.trim() ||
			company.operatingRegions.length === 0 ||
			company.cargoCategories.length === 0
		) {
			throw new Error("Complete company profile before submitting");
		}

		const now = Date.now();
		await ctx.db.patch(args.companyId, {
			status: "pending_verification",
			verificationStatus: "pending",
			updatedAt: now,
		});

		const admins = await ctx.db.query("users").collect();
		for (const admin of admins) {
			if (!admin.isAdmin) continue;
			await ctx.db.insert("notifications", {
				recipientUserId: admin._id,
				type: "company_submitted",
				title: "Company Submitted for Review",
				body: `${company.name} is ready for verification.`,
				createdAt: now,
			});
		}
	},
});

export const listPendingForAdmin = query({
	args: {},
	handler: async (ctx) => {
		await requireAdmin(ctx);
		return await ctx.db
			.query("companies")
			.withIndex("by_verification_status", (q) =>
				q.eq("verificationStatus", "pending"),
			)
			.collect();
	},
});

export const listAllForAdmin = query({
	args: {},
	handler: async (ctx) => {
		await requireAdmin(ctx);
		return await ctx.db.query("companies").order("desc").take(100);
	},
});

export const approveCompany = mutation({
	args: { companyId: v.id("companies"), notes: v.optional(v.string()) },
	handler: async (ctx, args) => {
		const admin = await requireAdmin(ctx);
		const now = Date.now();
		await ctx.db.patch(args.companyId, {
			status: "approved",
			verificationStatus: "approved",
			verificationNotes: args.notes,
			updatedAt: now,
		});
		const company = await ctx.db.get(args.companyId);
		if (company) {
			await ctx.db.insert("adminActions", {
				adminUserId: admin._id,
				actionType: "approve_company",
				targetType: "company",
				targetId: args.companyId,
				createdAt: now,
			});
			await ctx.db.insert("notifications", {
				recipientUserId: company.ownerUserId,
				type: "company_approved",
				title: "Company Approved",
				body: `${company.name} has been approved for the marketplace.`,
				createdAt: now,
			});
		}
	},
});

export const rejectCompany = mutation({
	args: { companyId: v.id("companies"), reason: v.string() },
	handler: async (ctx, args) => {
		const admin = await requireAdmin(ctx);
		const now = Date.now();
		await ctx.db.patch(args.companyId, {
			status: "rejected",
			verificationStatus: "rejected",
			verificationNotes: args.reason,
			updatedAt: now,
		});
		const company = await ctx.db.get(args.companyId);
		if (company) {
			await ctx.db.insert("adminActions", {
				adminUserId: admin._id,
				actionType: "reject_company",
				targetType: "company",
				targetId: args.companyId,
				reason: args.reason,
				createdAt: now,
			});
			await ctx.db.insert("notifications", {
				recipientUserId: company.ownerUserId,
				type: "company_rejected",
				title: "Company Verification Rejected",
				body: args.reason,
				createdAt: now,
			});
		}
	},
});

export const banCompany = mutation({
	args: { companyId: v.id("companies"), reason: v.string() },
	handler: async (ctx, args) => {
		const admin = await requireAdmin(ctx);
		const now = Date.now();
		await ctx.db.patch(args.companyId, {
			status: "banned",
			updatedAt: now,
		});
		await ctx.db.insert("adminActions", {
			adminUserId: admin._id,
			actionType: "ban_company",
			targetType: "company",
			targetId: args.companyId,
			reason: args.reason,
			createdAt: now,
		});

		const company = await ctx.db.get(args.companyId);
		if (!company) return;
		const operators = await getActiveCompanyOperators(ctx, args.companyId);
		for (const operator of operators) {
			await ctx.db.insert("notifications", {
				recipientUserId: operator.userId,
				type: "company_banned",
				title: "Company Banned",
				body: args.reason,
				createdAt: now,
			});
		}
	},
});

export const suspendCompany = mutation({
	args: { companyId: v.id("companies"), reason: v.string() },
	handler: async (ctx, args) => {
		const admin = await requireAdmin(ctx);
		const now = Date.now();
		await ctx.db.patch(args.companyId, {
			status: "suspended",
			updatedAt: now,
		});
		await ctx.db.insert("adminActions", {
			adminUserId: admin._id,
			actionType: "suspend_company",
			targetType: "company",
			targetId: args.companyId,
			reason: args.reason,
			createdAt: now,
		});
	},
});

export const restoreCompany = mutation({
	args: { companyId: v.id("companies"), notes: v.optional(v.string()) },
	handler: async (ctx, args) => {
		const admin = await requireAdmin(ctx);
		const company = await ctx.db.get(args.companyId);
		if (!company) throw new Error("Company not found");

		const now = Date.now();
		await ctx.db.patch(args.companyId, {
			status:
				company.verificationStatus === "approved"
					? "approved"
					: "pending_verification",
			updatedAt: now,
		});
		await ctx.db.insert("adminActions", {
			adminUserId: admin._id,
			actionType: "restore_company",
			targetType: "company",
			targetId: args.companyId,
			reason: args.notes,
			createdAt: now,
		});
	},
});
