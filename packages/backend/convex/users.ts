import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import {
	assertUserNotBanned,
	getUserByClerkId,
	requireAdmin,
	requireIdentity,
	requireUser,
} from "./lib/auth";
import { notifyPendingCompanyInvitesForUser } from "./lib/invites";
import { ensureUserWallet } from "./wallets";

export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		const identity = await requireIdentity(ctx);
		return await getUserByClerkId(ctx, identity.subject);
	},
});

export const syncCurrentUserFromClerk = mutation({
	args: {
		name: v.optional(v.string()),
		email: v.optional(v.string()),
		avatarUrl: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await requireIdentity(ctx);
		const now = Date.now();
		const existing = await getUserByClerkId(ctx, identity.subject);

		if (existing) {
			await ctx.db.patch(existing._id, {
				name: args.name ?? existing.name,
				email: args.email ?? existing.email,
				avatarUrl: args.avatarUrl ?? existing.avatarUrl,
				updatedAt: now,
			});
			const updated = await ctx.db.get(existing._id);
			if (updated) {
				await notifyPendingCompanyInvitesForUser(ctx, updated);
			}
			return existing._id;
		}

		const userId = await ctx.db.insert("users", {
			clerkUserId: identity.subject,
			email: args.email ?? identity.email ?? "",
			name: args.name ?? identity.name ?? "User",
			avatarUrl: args.avatarUrl ?? identity.pictureUrl,
			status: "active",
			isAdmin: false,
			defaultRole: "user",
			createdAt: now,
			updatedAt: now,
		});

		await ensureUserWallet(ctx, userId);

		const user = await ctx.db.get(userId);
		if (user) {
			await notifyPendingCompanyInvitesForUser(ctx, user);
		}

		return userId;
	},
});

export const updateProfile = mutation({
	args: {
		name: v.optional(v.string()),
		phone: v.optional(v.string()),
		address: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const user = await requireUser(ctx);
		assertUserNotBanned(user);
		await ctx.db.patch(user._id, {
			...args,
			updatedAt: Date.now(),
		});
	},
});

export const listForAdmin = query({
	args: {},
	handler: async (ctx) => {
		await requireAdmin(ctx);
		return await ctx.db.query("users").order("desc").take(100);
	},
});

export const getById = query({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		await requireAdmin(ctx);
		return await ctx.db.get(args.userId);
	},
});

export const banUser = mutation({
	args: { userId: v.id("users"), reason: v.string() },
	handler: async (ctx, args) => {
		const admin = await requireAdmin(ctx);
		const user = await ctx.db.get(args.userId);
		if (!user) throw new Error("User not found");
		if (user.isAdmin) throw new Error("Admin users cannot be banned");

		await ctx.db.patch(args.userId, {
			status: "banned",
			updatedAt: Date.now(),
		});
		await ctx.db.insert("adminActions", {
			adminUserId: admin._id,
			actionType: "ban_user",
			targetType: "user",
			targetId: args.userId,
			reason: args.reason,
			createdAt: Date.now(),
		});
	},
});

export const unbanUser = mutation({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		const admin = await requireAdmin(ctx);
		await ctx.db.patch(args.userId, {
			status: "active",
			updatedAt: Date.now(),
		});
		await ctx.db.insert("adminActions", {
			adminUserId: admin._id,
			actionType: "unban_user",
			targetType: "user",
			targetId: args.userId,
			createdAt: Date.now(),
		});
	},
});
