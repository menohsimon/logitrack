import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireDriver, requireShipmentAccess } from "./lib/auth";
import { assertCoordinate, haversineMeters } from "./lib/geo";

const MIN_UPDATE_INTERVAL_MS = 60_000;
const MIN_UPDATE_DISTANCE_METERS = 100;
const TERMINAL_STATUSES = new Set([
	"delivered",
	"delivery_confirmed",
	"cancelled",
	"failed_delivery",
	"disputed",
]);

function optionalNonNegative(value: number | undefined, label: string) {
	if (value === undefined) return undefined;
	if (!Number.isFinite(value) || value < 0) {
		throw new Error(`${label} must be a positive number`);
	}
	return value;
}

function optionalHeading(value: number | undefined) {
	if (value === undefined) return undefined;
	if (!Number.isFinite(value) || value < 0 || value > 360) {
		throw new Error("Heading must be between 0 and 360");
	}
	return value;
}

export const getByShipment = query({
	args: { shipmentId: v.id("shipments") },
	handler: async (ctx, args) => {
		await requireShipmentAccess(ctx, args.shipmentId);
		return await ctx.db
			.query("shipmentLocations")
			.withIndex("by_shipment_id", (q) => q.eq("shipmentId", args.shipmentId))
			.first();
	},
});

export const upsertCurrent = mutation({
	args: {
		shipmentId: v.id("shipments"),
		lat: v.number(),
		lng: v.number(),
		accuracyMeters: v.optional(v.number()),
		heading: v.optional(v.number()),
		speedMps: v.optional(v.number()),
		capturedAt: v.optional(v.number()),
		etaSeconds: v.optional(v.number()),
		estimatedArrivalAt: v.optional(v.number()),
		routeProvider: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { driver } = await requireDriver(ctx);
		const shipment = await ctx.db.get(args.shipmentId);
		if (
			!shipment ||
			shipment.driverId !== driver._id ||
			shipment.companyId !== driver.companyId
		) {
			throw new Error("Shipment is not assigned to this driver");
		}
		if (TERMINAL_STATUSES.has(shipment.status)) {
			throw new Error("Location sharing is closed for this shipment");
		}

		assertCoordinate(args.lat, args.lng);
		const accuracyMeters = optionalNonNegative(
			args.accuracyMeters,
			"Location accuracy",
		);
		const speedMps = optionalNonNegative(args.speedMps, "Speed");
		const etaSeconds = optionalNonNegative(args.etaSeconds, "ETA");
		const heading = optionalHeading(args.heading);
		const now = Date.now();
		const capturedAt =
			args.capturedAt !== undefined && Number.isFinite(args.capturedAt)
				? Math.min(args.capturedAt, now)
				: now;
		const estimatedArrivalAt =
			args.estimatedArrivalAt !== undefined &&
			Number.isFinite(args.estimatedArrivalAt)
				? args.estimatedArrivalAt
				: undefined;
		const routeProvider = args.routeProvider?.trim() || undefined;

		const existing = await ctx.db
			.query("shipmentLocations")
			.withIndex("by_shipment_id", (q) => q.eq("shipmentId", args.shipmentId))
			.first();
		if (existing) {
			const distanceMeters = haversineMeters(existing, {
				lat: args.lat,
				lng: args.lng,
			});
			const nextAllowedAt = existing.updatedAt + MIN_UPDATE_INTERVAL_MS;
			if (now < nextAllowedAt && distanceMeters < MIN_UPDATE_DISTANCE_METERS) {
				return {
					updated: false,
					nextAllowedAt,
					distanceMeters: Math.round(distanceMeters),
				};
			}

			await ctx.db.patch(existing._id, {
				lat: args.lat,
				lng: args.lng,
				accuracyMeters,
				heading,
				speedMps,
				capturedAt,
				updatedAt: now,
				etaSeconds,
				estimatedArrivalAt,
				routeProvider,
			});
			return {
				updated: true,
				nextAllowedAt: now + MIN_UPDATE_INTERVAL_MS,
				distanceMeters: Math.round(distanceMeters),
			};
		}

		await ctx.db.insert("shipmentLocations", {
			shipmentId: shipment._id,
			companyId: shipment.companyId,
			driverId: driver._id,
			lat: args.lat,
			lng: args.lng,
			accuracyMeters,
			heading,
			speedMps,
			capturedAt,
			updatedAt: now,
			etaSeconds,
			estimatedArrivalAt,
			routeProvider,
		});

		return {
			updated: true,
			nextAllowedAt: now + MIN_UPDATE_INTERVAL_MS,
			distanceMeters: null,
		};
	},
});
