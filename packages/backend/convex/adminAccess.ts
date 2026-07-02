import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import {
	getIdentity,
	requireAdmin,
	requireIdentity,
	requireUser,
} from "./lib/auth";

export const getAccessStatus = query({
	args: {},
	handler: async (ctx) => {
		const identity = await getIdentity(ctx);
		if (!identity) {
			return {
				isAuthenticated: false,
				isAdmin: false,
				request: null,
				hasUserProfile: false,
			};
		}

		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
			.unique();

		if (!user) {
			return {
				isAuthenticated: true,
				isAdmin: false,
				request: null,
				hasUserProfile: false,
			};
		}

		const request = await ctx.db
			.query("adminAccessRequests")
			.withIndex("by_user_id", (q) => q.eq("userId", user._id))
			.order("desc")
			.first();

		return {
			isAuthenticated: true,
			isAdmin: user.isAdmin,
			request,
			hasUserProfile: true,
		};
	},
});

export const requestAccess = mutation({
	args: {},
	handler: async (ctx) => {
		const identity = await requireIdentity(ctx);
		const user = await requireUser(ctx);
		const now = Date.now();

		if (user.isAdmin) {
			throw new Error("You already have admin access");
		}

		const existing = await ctx.db
			.query("adminAccessRequests")
			.withIndex("by_user_id", (q) => q.eq("userId", user._id))
			.order("desc")
			.first();

		if (existing?.status === "pending") {
			await ctx.db.patch(existing._id, {
				email: user.email,
				name: user.name,
				avatarUrl: user.avatarUrl,
				clerkUserId: identity.subject,
			});
			return existing._id;
		}

		if (existing?.status === "approved") {
			throw new Error("Your admin access request was already approved");
		}

		return await ctx.db.insert("adminAccessRequests", {
			userId: user._id,
			clerkUserId: identity.subject,
			email: user.email,
			name: user.name,
			avatarUrl: user.avatarUrl,
			approved: false,
			status: "pending",
			requestedAt: now,
		});
	},
});

export const listPendingRequests = query({
	args: {},
	handler: async (ctx) => {
		await requireAdmin(ctx);
		const requests = await ctx.db
			.query("adminAccessRequests")
			.withIndex("by_status", (q) => q.eq("status", "pending"))
			.collect();

		return requests.sort((a, b) => b.requestedAt - a.requestedAt);
	},
});

export const listAllRequests = query({
	args: {},
	handler: async (ctx) => {
		await requireAdmin(ctx);
		const requests = await ctx.db.query("adminAccessRequests").collect();
		return requests.sort((a, b) => b.requestedAt - a.requestedAt);
	},
});

export const approveRequest = mutation({
	args: { requestId: v.id("adminAccessRequests") },
	handler: async (ctx, args) => {
		const admin = await requireAdmin(ctx);
		const request = await ctx.db.get(args.requestId);
		if (!request) throw new Error("Request not found");
		if (request.status !== "pending") {
			throw new Error("Only pending requests can be approved");
		}

		const now = Date.now();
		const user = await ctx.db.get(request.userId);
		if (!user) throw new Error("User not found");

		await ctx.db.patch(args.requestId, {
			approved: true,
			status: "approved",
			reviewedByUserId: admin._id,
			reviewedAt: now,
		});

		await ctx.db.patch(request.userId, {
			isAdmin: true,
			defaultRole: "admin",
			updatedAt: now,
		});

		await ctx.db.insert("adminActions", {
			adminUserId: admin._id,
			actionType: "approve_admin_access",
			targetType: "admin_access_request",
			targetId: args.requestId,
			createdAt: now,
		});
	},
});

export const rejectRequest = mutation({
	args: {
		requestId: v.id("adminAccessRequests"),
		reason: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const admin = await requireAdmin(ctx);
		const request = await ctx.db.get(args.requestId);
		if (!request) throw new Error("Request not found");
		if (request.status !== "pending") {
			throw new Error("Only pending requests can be rejected");
		}

		const now = Date.now();
		await ctx.db.patch(args.requestId, {
			approved: false,
			status: "rejected",
			reviewedByUserId: admin._id,
			reviewedAt: now,
			rejectionReason: args.reason,
		});

		await ctx.db.insert("adminActions", {
			adminUserId: admin._id,
			actionType: "reject_admin_access",
			targetType: "admin_access_request",
			targetId: args.requestId,
			reason: args.reason,
			createdAt: now,
		});
	},
});