import { v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireUser } from "./lib/auth";

async function recalculateCompanyRating(
	ctx: MutationCtx,
	companyId: Id<"companies">,
) {
	const reviews = await ctx.db
		.query("reviews")
		.withIndex("by_company_id", (q) => q.eq("companyId", companyId))
		.collect();
	const published = reviews.filter((review) => review.status === "published");
	const average =
		published.reduce((total, review) => total + review.rating, 0) /
		(published.length || 1);

	await ctx.db.patch(companyId, {
		reviewCount: published.length,
		averageRating: published.length ? Math.round(average * 10) / 10 : 0,
		updatedAt: Date.now(),
	});
}

async function recalculateDriverRating(
	ctx: MutationCtx,
	driverId: Id<"drivers">,
) {
	const reviews = await ctx.db
		.query("reviews")
		.withIndex("by_driver_id", (q) => q.eq("driverId", driverId))
		.collect();
	const published = reviews.filter((review) => review.status === "published");
	const average =
		published.reduce((total, review) => total + review.rating, 0) /
		(published.length || 1);

	await ctx.db.patch(driverId, {
		reviewCount: published.length,
		averageRating: published.length ? Math.round(average * 10) / 10 : 0,
		updatedAt: Date.now(),
	});
}

export const create = mutation({
	args: {
		shipmentId: v.id("shipments"),
		rating: v.number(),
		comment: v.optional(v.string()),
		tags: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		const user = await requireUser(ctx);
		const shipment = await ctx.db.get(args.shipmentId);
		if (!shipment || shipment.userId !== user._id) {
			throw new Error("Shipment not found");
		}
		if (shipment.status !== "delivery_confirmed") {
			throw new Error("Can only review completed shipments");
		}
		if (args.rating < 1 || args.rating > 5) {
			throw new Error("Rating must be between 1 and 5");
		}

		const existing = await ctx.db
			.query("reviews")
			.withIndex("by_shipment_id", (q) => q.eq("shipmentId", args.shipmentId))
			.unique();
		if (existing) throw new Error("Review already exists for this shipment");

		const now = Date.now();
		const reviewId = await ctx.db.insert("reviews", {
			shipmentId: args.shipmentId,
			bookingId: shipment.bookingId,
			userId: user._id,
			companyId: shipment.companyId,
			driverId: shipment.driverId,
			rating: args.rating,
			comment: args.comment,
			tags: args.tags,
			status: "published",
			createdAt: now,
			updatedAt: now,
		});

		await recalculateCompanyRating(ctx, shipment.companyId);
		if (shipment.driverId) {
			await recalculateDriverRating(ctx, shipment.driverId);
		}

		return reviewId;
	},
});

export const listForCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		const user = await requireUser(ctx);
		const reviews = await ctx.db
			.query("reviews")
			.withIndex("by_user_id", (q) => q.eq("userId", user._id))
			.order("desc")
			.collect();

		return await Promise.all(
			reviews.map(async (review) => {
				const company = await ctx.db.get(review.companyId);
				const shipment = await ctx.db.get(review.shipmentId);
				return { review, company, shipment };
			}),
		);
	},
});

export const listByCompany = query({
	args: { companyId: v.id("companies") },
	handler: async (ctx, args) => {
		const reviews = await ctx.db
			.query("reviews")
			.withIndex("by_company_id", (q) => q.eq("companyId", args.companyId))
			.order("desc")
			.collect();

		const published = reviews.filter((r) => r.status === "published");
		return await Promise.all(
			published.map(async (review) => {
				const user = await ctx.db.get(review.userId);
				return { review, user };
			}),
		);
	},
});

export const listForAdmin = query({
	args: {},
	handler: async (ctx) => {
		await requireAdmin(ctx);
		return await ctx.db.query("reviews").order("desc").take(50);
	},
});

export const moderate = mutation({
	args: {
		reviewId: v.id("reviews"),
		status: v.union(
			v.literal("published"),
			v.literal("hidden"),
			v.literal("removed"),
		),
	},
	handler: async (ctx, args) => {
		const admin = await requireAdmin(ctx);
		const review = await ctx.db.get(args.reviewId);
		if (!review) throw new Error("Review not found");

		await ctx.db.patch(args.reviewId, {
			status: args.status,
			updatedAt: Date.now(),
		});
		await recalculateCompanyRating(ctx, review.companyId);
		if (review.driverId) {
			await recalculateDriverRating(ctx, review.driverId);
		}

		await ctx.db.insert("adminActions", {
			adminUserId: admin._id,
			actionType: "moderate_review",
			targetType: "review",
			targetId: args.reviewId,
			metadata: { status: args.status },
			createdAt: Date.now(),
		});
	},
});
