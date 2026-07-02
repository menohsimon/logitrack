import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import {
	assertUserNotBanned,
	getDriverByUserId,
	getOptionalUser,
	requireCompanyOperator,
	requireDriver,
	requireUser,
} from "./lib/auth";

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
		const drivers = await ctx.db
			.query("drivers")
			.withIndex("by_company_id", (q) => q.eq("companyId", args.companyId))
			.collect();

		return await Promise.all(
			drivers.map(async (driver) => {
				const user = await ctx.db.get(driver.userId);
				return { driver, user };
			}),
		);
	},
});

export const getCurrentDriver = query({
	args: {},
	handler: async (ctx) => {
		const user = await getOptionalUser(ctx);
		if (!user) return null;
		assertUserNotBanned(user);
		const driver = await getDriverByUserId(ctx, user._id);
		if (driver?.status !== "active") return null;
		const company = await ctx.db.get(driver.companyId);
		return { driver, company, user };
	},
});

export const updateCurrentDriverInfo = mutation({
	args: {
		vehicleId: v.optional(v.id("vehicles")),
		phone: v.optional(v.string()),
		licenseNumber: v.optional(v.string()),
		vehicleType: v.optional(v.string()),
		vehicleClass: v.optional(v.string()),
		vehicleModel: v.optional(v.string()),
		vehiclePlate: v.optional(v.string()),
		vehicleCapacityKg: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { driver } = await requireDriver(ctx);
		positiveOptional(args.vehicleCapacityKg, "Load support");

		let vehiclePatch: {
			vehicleId?: typeof args.vehicleId;
			vehicleType?: string;
			vehicleClass?: string;
			vehicleModel?: string;
			vehiclePlate?: string;
			vehicleCapacityKg?: number;
		} = {};

		if (args.vehicleId) {
			const vehicle = await ctx.db.get(args.vehicleId);
			if (
				!vehicle ||
				vehicle.companyId !== driver.companyId ||
				vehicle.status !== "active"
			) {
				throw new Error("Invalid company vehicle");
			}
			vehiclePatch = {
				vehicleId: vehicle._id,
				vehicleType: vehicle.vehicleType,
				vehicleClass: vehicle.vehicleClass,
				vehicleModel: vehicle.vehicleModel,
				vehiclePlate: vehicle.immatriculation,
				vehicleCapacityKg: vehicle.loadSupportKg,
			};
		} else {
			vehiclePatch = {
				vehicleId: undefined,
				vehicleType: optionalTrimmed(args.vehicleType),
				vehicleClass: optionalTrimmed(args.vehicleClass),
				vehicleModel: optionalTrimmed(args.vehicleModel),
				vehiclePlate: optionalTrimmed(args.vehiclePlate)?.toUpperCase(),
				vehicleCapacityKg: args.vehicleCapacityKg,
			};
		}

		await ctx.db.patch(driver._id, {
			phone: optionalTrimmed(args.phone),
			licenseNumber: optionalTrimmed(args.licenseNumber),
			...vehiclePatch,
			updatedAt: Date.now(),
		});
	},
});

export const updateStatus = mutation({
	args: {
		driverId: v.id("drivers"),
		status: v.union(
			v.literal("active"),
			v.literal("inactive"),
			v.literal("suspended"),
			v.literal("removed"),
		),
	},
	handler: async (ctx, args) => {
		const driver = await ctx.db.get(args.driverId);
		if (!driver) throw new Error("Driver not found");
		await requireCompanyOperator(ctx, driver.companyId);
		if (args.status !== "active") {
			const assigned = await ctx.db
				.query("shipments")
				.withIndex("by_driver_id", (q) => q.eq("driverId", driver._id))
				.collect();
			const activeAssignment = assigned.find(
				(shipment) =>
					!["delivery_confirmed", "cancelled"].includes(shipment.status),
			);
			if (activeAssignment) {
				throw new Error(
					`Reassign active shipment ${activeAssignment.shipmentNumber} first`,
				);
			}
		}
		await ctx.db.patch(args.driverId, {
			status: args.status,
			updatedAt: Date.now(),
		});
	},
});

export const listAssignedShipments = query({
	args: {},
	handler: async (ctx) => {
		const user = await getOptionalUser(ctx);
		if (!user) return [];
		assertUserNotBanned(user);
		const driver = await getDriverByUserId(ctx, user._id);
		if (driver?.status !== "active") return [];
		const shipments = await ctx.db
			.query("shipments")
			.withIndex("by_driver_id", (q) => q.eq("driverId", driver._id))
			.order("desc")
			.collect();
		return shipments.filter(
			(s) => s.status !== "delivery_confirmed" && s.status !== "cancelled",
		);
	},
});

export const listShipmentHistory = query({
	args: {},
	handler: async (ctx) => {
		const user = await getOptionalUser(ctx);
		if (!user) return [];
		assertUserNotBanned(user);
		const driver = await getDriverByUserId(ctx, user._id);
		if (driver?.status !== "active") return [];
		const shipments = await ctx.db
			.query("shipments")
			.withIndex("by_driver_id", (q) => q.eq("driverId", driver._id))
			.order("desc")
			.collect();
		return shipments.filter((shipment) =>
			["delivery_confirmed", "cancelled"].includes(shipment.status),
		);
	},
});
