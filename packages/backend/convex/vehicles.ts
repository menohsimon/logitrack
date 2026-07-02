import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireCompanyOperator, requireUser } from "./lib/auth";

function optionalTrimmed(value: string | undefined) {
	const trimmed = value?.trim();
	return trimmed || undefined;
}

function positiveOptional(value: number | undefined, label: string) {
	if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
		throw new Error(`${label} must be a positive number`);
	}
}

export const listByCompany = query({
	args: { companyId: v.id("companies") },
	handler: async (ctx, args) => {
		const user = await requireUser(ctx);
		if (!user.isAdmin) {
			await requireCompanyOperator(ctx, args.companyId);
		}
		return await ctx.db
			.query("vehicles")
			.withIndex("by_company_id", (q) => q.eq("companyId", args.companyId))
			.collect();
	},
});

export const create = mutation({
	args: {
		companyId: v.id("companies"),
		label: v.string(),
		vehicleType: v.string(),
		vehicleClass: v.optional(v.string()),
		vehicleModel: v.optional(v.string()),
		immatriculation: v.string(),
		loadSupportKg: v.optional(v.number()),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		await requireCompanyOperator(ctx, args.companyId);
		const label = args.label.trim();
		const vehicleType = args.vehicleType.trim();
		const immatriculation = args.immatriculation.trim().toUpperCase();
		if (!label || !vehicleType || !immatriculation) {
			throw new Error("Vehicle name, type, and immatriculation are required");
		}
		positiveOptional(args.loadSupportKg, "Load support");

		const now = Date.now();
		return await ctx.db.insert("vehicles", {
			companyId: args.companyId,
			label,
			vehicleType,
			vehicleClass: optionalTrimmed(args.vehicleClass),
			vehicleModel: optionalTrimmed(args.vehicleModel),
			immatriculation,
			loadSupportKg: args.loadSupportKg,
			status: "active",
			notes: optionalTrimmed(args.notes),
			createdAt: now,
			updatedAt: now,
		});
	},
});

export const update = mutation({
	args: {
		vehicleId: v.id("vehicles"),
		label: v.string(),
		vehicleType: v.string(),
		vehicleClass: v.optional(v.string()),
		vehicleModel: v.optional(v.string()),
		immatriculation: v.string(),
		loadSupportKg: v.optional(v.number()),
		status: v.union(
			v.literal("active"),
			v.literal("maintenance"),
			v.literal("inactive"),
		),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const vehicle = await ctx.db.get(args.vehicleId);
		if (!vehicle) throw new Error("Vehicle not found");
		await requireCompanyOperator(ctx, vehicle.companyId);

		const label = args.label.trim();
		const vehicleType = args.vehicleType.trim();
		const immatriculation = args.immatriculation.trim().toUpperCase();
		if (!label || !vehicleType || !immatriculation) {
			throw new Error("Vehicle name, type, and immatriculation are required");
		}
		positiveOptional(args.loadSupportKg, "Load support");

		await ctx.db.patch(args.vehicleId, {
			label,
			vehicleType,
			vehicleClass: optionalTrimmed(args.vehicleClass),
			vehicleModel: optionalTrimmed(args.vehicleModel),
			immatriculation,
			loadSupportKg: args.loadSupportKg,
			status: args.status,
			notes: optionalTrimmed(args.notes),
			updatedAt: Date.now(),
		});
	},
});
