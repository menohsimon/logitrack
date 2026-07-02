import { v } from "convex/values";

import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import {
	assertCompanyApproved,
	assertCompanyCanReceiveBookings,
	assertUserNotBanned,
	getActiveCompanyOperators,
	getCompanyMember,
	requireAdmin,
	requireCompanyOperator,
	requireUser,
} from "./lib/auth";
import { sanitizeGeoPoint, sanitizeRouteSnapshot } from "./lib/geo";
import { generateBookingNumber, generateShipmentNumber } from "./lib/helpers";
import { PRE_PICKUP_SHIPMENT_STATUSES } from "./lib/statusTransitions";
import { cargoCategory, geoPoint, routeSnapshot } from "./lib/validators";
import { createTrackingEvent } from "./trackingEvents";
import { refundBookingFunds, simulateBookingPayment } from "./wallets";

function optionalTrimmed(value: string | undefined) {
	const trimmed = value?.trim();
	return trimmed || undefined;
}

function assertPositiveOptionalNumber(
	value: number | undefined,
	label: string,
) {
	if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
		throw new Error(`${label} must be a positive number`);
	}
}

function assertBookingDates(
	requestedPickupDate: number | undefined,
	requestedDeliveryDate: number | undefined,
) {
	if (
		requestedPickupDate !== undefined &&
		(!Number.isFinite(requestedPickupDate) ||
			requestedPickupDate < Date.now() - 5 * 60 * 1000)
	) {
		throw new Error("Pickup date must be in the future");
	}
	if (
		requestedDeliveryDate !== undefined &&
		(!Number.isFinite(requestedDeliveryDate) ||
			requestedDeliveryDate < Date.now() - 5 * 60 * 1000)
	) {
		throw new Error("Delivery date must be in the future");
	}
	if (
		requestedPickupDate !== undefined &&
		requestedDeliveryDate !== undefined &&
		requestedDeliveryDate < requestedPickupDate
	) {
		throw new Error("Delivery date must be after the pickup date");
	}
}

function estimateFareFromDeclaredValueCents(declaredValue: number) {
	return Math.round(declaredValue * 0.1 * 100);
}

async function generateUniqueBookingNumber(ctx: MutationCtx) {
	for (let attempt = 0; attempt < 10; attempt += 1) {
		const bookingNumber = generateBookingNumber();
		const existing = await ctx.db
			.query("bookings")
			.withIndex("by_booking_number", (q) =>
				q.eq("bookingNumber", bookingNumber),
			)
			.unique();
		if (!existing) return bookingNumber;
	}

	throw new Error("Could not allocate booking number");
}

async function generateUniqueShipmentNumber(ctx: MutationCtx) {
	for (let attempt = 0; attempt < 10; attempt += 1) {
		const shipmentNumber = generateShipmentNumber();
		const existing = await ctx.db
			.query("shipments")
			.withIndex("by_shipment_number", (q) =>
				q.eq("shipmentNumber", shipmentNumber),
			)
			.unique();
		if (!existing) return shipmentNumber;
	}

	throw new Error("Could not allocate shipment number");
}

export const create = mutation({
	args: {
		companyId: v.id("companies"),
		pickupAddress: v.string(),
		pickupContactName: v.optional(v.string()),
		pickupContactPhone: v.optional(v.string()),
		pickupInstructions: v.optional(v.string()),
		destinationAddress: v.string(),
		destinationContactName: v.optional(v.string()),
		destinationContactPhone: v.optional(v.string()),
		destinationInstructions: v.optional(v.string()),
		requestedPickupDate: v.optional(v.number()),
		requestedDeliveryDate: v.optional(v.number()),
		specialInstructions: v.optional(v.string()),
		pickupLocation: geoPoint,
		destinationLocation: geoPoint,
		routeSnapshot: v.optional(routeSnapshot),
		cargo: v.object({
			category: cargoCategory,
			title: v.string(),
			description: v.optional(v.string()),
			quantity: v.optional(v.number()),
			unit: v.optional(v.string()),
			weightKg: v.optional(v.number()),
			volumeM3: v.optional(v.number()),
			lengthCm: v.optional(v.number()),
			widthCm: v.optional(v.number()),
			heightCm: v.optional(v.number()),
			declaredValue: v.number(),
			currency: v.string(),
			fragile: v.boolean(),
			hazardous: v.boolean(),
			requiresRefrigeration: v.boolean(),
			requiresSpecialHandling: v.boolean(),
			handlingInstructions: v.optional(v.string()),
		}),
	},
	handler: async (ctx, args) => {
		const user = await requireUser(ctx);
		assertUserNotBanned(user);

		const company = await ctx.db.get(args.companyId);
		if (!company) throw new Error("Company not found");
		assertCompanyCanReceiveBookings(company);
		if (!company.cargoCategories.includes(args.cargo.category)) {
			throw new Error(
				"This company does not support the selected cargo category",
			);
		}

		const pickupAddress = args.pickupAddress.trim();
		const destinationAddress = args.destinationAddress.trim();
		const cargoTitle = args.cargo.title.trim();
		const pickupLocation = sanitizeGeoPoint(args.pickupLocation);
		const destinationLocation = sanitizeGeoPoint(args.destinationLocation);
		const route = sanitizeRouteSnapshot(args.routeSnapshot);
		if (!pickupAddress || !destinationAddress || !cargoTitle) {
			throw new Error("Pickup, destination, and cargo title are required");
		}
		if (pickupAddress.toLowerCase() === destinationAddress.toLowerCase()) {
			throw new Error("Pickup and destination must be different");
		}
		assertBookingDates(args.requestedPickupDate, args.requestedDeliveryDate);
		assertPositiveOptionalNumber(args.cargo.quantity, "Quantity");
		assertPositiveOptionalNumber(args.cargo.weightKg, "Weight");
		assertPositiveOptionalNumber(args.cargo.volumeM3, "Volume");
		assertPositiveOptionalNumber(args.cargo.lengthCm, "Length");
		assertPositiveOptionalNumber(args.cargo.widthCm, "Width");
		assertPositiveOptionalNumber(args.cargo.heightCm, "Height");
		assertPositiveOptionalNumber(args.cargo.declaredValue, "Declared value");
		if (args.cargo.declaredValue <= 0) {
			throw new Error("Declared value is required");
		}

		const currency = optionalTrimmed(args.cargo.currency)?.toUpperCase();
		if (!currency) throw new Error("Cargo currency is required");
		const fareCents = estimateFareFromDeclaredValueCents(
			args.cargo.declaredValue,
		);

		const now = Date.now();
		const bookingId = await ctx.db.insert("bookings", {
			bookingNumber: await generateUniqueBookingNumber(ctx),
			userId: user._id,
			companyId: args.companyId,
			status: "pending_company_response",
			pickupAddress,
			pickupContactName: optionalTrimmed(args.pickupContactName),
			pickupContactPhone: optionalTrimmed(args.pickupContactPhone),
			pickupInstructions: optionalTrimmed(args.pickupInstructions),
			destinationAddress,
			destinationContactName: optionalTrimmed(args.destinationContactName),
			destinationContactPhone: optionalTrimmed(args.destinationContactPhone),
			destinationInstructions: optionalTrimmed(args.destinationInstructions),
			requestedPickupDate: args.requestedPickupDate,
			requestedDeliveryDate: args.requestedDeliveryDate,
			specialInstructions: optionalTrimmed(args.specialInstructions),
			pickupLocation,
			destinationLocation,
			routeSnapshot: route,
			estimatedFareCents: fareCents,
			fareCurrency: currency,
			cargoSnapshot: {
				...args.cargo,
				title: cargoTitle,
				description: optionalTrimmed(args.cargo.description),
				unit: optionalTrimmed(args.cargo.unit),
				currency,
				handlingInstructions: optionalTrimmed(args.cargo.handlingInstructions),
			},
			createdAt: now,
			updatedAt: now,
		});

		await ctx.db.insert("cargoDetails", {
			bookingId,
			category: args.cargo.category,
			title: cargoTitle,
			description: optionalTrimmed(args.cargo.description),
			quantity: args.cargo.quantity,
			unit: optionalTrimmed(args.cargo.unit),
			weightKg: args.cargo.weightKg,
			volumeM3: args.cargo.volumeM3,
			lengthCm: args.cargo.lengthCm,
			widthCm: args.cargo.widthCm,
			heightCm: args.cargo.heightCm,
			declaredValue: args.cargo.declaredValue,
			currency,
			fragile: args.cargo.fragile,
			hazardous: args.cargo.hazardous,
			requiresRefrigeration: args.cargo.requiresRefrigeration,
			requiresSpecialHandling: args.cargo.requiresSpecialHandling,
			handlingInstructions: optionalTrimmed(args.cargo.handlingInstructions),
			createdAt: now,
			updatedAt: now,
		});

		const booking = await ctx.db.get(bookingId);
		const operators = await getActiveCompanyOperators(ctx, args.companyId);
		for (const operator of operators) {
			await ctx.db.insert("notifications", {
				recipientUserId: operator.userId,
				type: "booking_submitted",
				title: "New Booking Request",
				body: `Booking ${booking?.bookingNumber ?? ""} received`,
				relatedBookingId: bookingId,
				createdAt: now,
			});
		}

		return bookingId;
	},
});

export const listForCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		const user = await requireUser(ctx);
		return await ctx.db
			.query("bookings")
			.withIndex("by_user_id", (q) => q.eq("userId", user._id))
			.order("desc")
			.collect();
	},
});

export const listForCompany = query({
	args: { companyId: v.id("companies") },
	handler: async (ctx, args) => {
		await requireCompanyOperator(ctx, args.companyId);
		return await ctx.db
			.query("bookings")
			.withIndex("by_company_id", (q) => q.eq("companyId", args.companyId))
			.order("desc")
			.collect();
	},
});

export const getById = query({
	args: { bookingId: v.id("bookings") },
	handler: async (ctx, args) => {
		const user = await requireUser(ctx);
		const booking = await ctx.db.get(args.bookingId);
		if (!booking) return null;

		const isOwner = booking.userId === user._id;
		const member = await getCompanyMember(ctx, booking.companyId, user._id);

		const canViewCompanyBooking =
			member?.status === "active" && member.role !== "driver";
		if (!isOwner && !canViewCompanyBooking && !user.isAdmin) return null;

		const cargo = await ctx.db
			.query("cargoDetails")
			.withIndex("by_booking_id", (q) => q.eq("bookingId", args.bookingId))
			.unique();
		const company = await ctx.db.get(booking.companyId);
		const shipment = await ctx.db
			.query("shipments")
			.withIndex("by_booking_id", (q) => q.eq("bookingId", args.bookingId))
			.unique();
		return { booking, cargo, company, shipment };
	},
});

export const accept = mutation({
	args: {
		bookingId: v.id("bookings"),
		fareCents: v.number(),
		note: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const booking = await ctx.db.get(args.bookingId);
		if (!booking) throw new Error("Booking not found");
		const actor = await requireUser(ctx);
		const company = await ctx.db.get(booking.companyId);
		if (!company) throw new Error("Company not found");
		assertCompanyApproved(company);
		if (!actor.isAdmin) {
			await requireCompanyOperator(ctx, booking.companyId);
		}

		if (booking.status !== "pending_company_response") {
			throw new Error("Booking cannot be accepted in current status");
		}
		if (!Number.isFinite(args.fareCents) || args.fareCents < 100) {
			throw new Error("Fare must be at least 1.00");
		}

		const now = Date.now();
		await ctx.db.patch(args.bookingId, {
			status: "accepted",
			finalFareCents: Math.round(args.fareCents),
			companyResponseNote: optionalTrimmed(args.note),
			acceptedAt: now,
			updatedAt: now,
		});

		await simulateBookingPayment(
			ctx,
			booking.userId,
			args.bookingId,
			Math.round(args.fareCents),
		);

		const shipmentId = await ctx.db.insert("shipments", {
			shipmentNumber: await generateUniqueShipmentNumber(ctx),
			bookingId: args.bookingId,
			userId: booking.userId,
			companyId: booking.companyId,
			status: "awaiting_driver_assignment",
			pickupAddress: booking.pickupAddress,
			destinationAddress: booking.destinationAddress,
			pickupLocation: booking.pickupLocation,
			destinationLocation: booking.destinationLocation,
			routeSnapshot: booking.routeSnapshot,
			pickupProofRequired: true,
			deliveryProofRequired: true,
			qrConfirmationEnabled: false,
			createdAt: now,
			updatedAt: now,
		});

		const cargo = await ctx.db
			.query("cargoDetails")
			.withIndex("by_booking_id", (q) => q.eq("bookingId", args.bookingId))
			.unique();
		if (cargo) {
			await ctx.db.patch(cargo._id, { shipmentId });
		}

		await ctx.db.insert("transitSteps", {
			shipmentId,
			companyId: booking.companyId,
			title: "In transit",
			description: "Default transit leg to destination",
			sequence: 0,
			status: "pending",
			createdAt: now,
			updatedAt: now,
		});

		await createTrackingEvent(ctx, {
			shipmentId,
			bookingId: args.bookingId,
			companyId: booking.companyId,
			actorUserId: actor._id,
			actorRole: actor.isAdmin ? "admin" : "company",
			eventType: "shipment_created",
			newStatus: "awaiting_driver_assignment",
			title: "Shipment Created",
			description: `${company?.name ?? "Company"} accepted your booking`,
		});

		await ctx.db.insert("notifications", {
			recipientUserId: booking.userId,
			type: "booking_accepted",
			title: "Booking Accepted",
			body: "Your booking has been accepted. A shipment has been created.",
			relatedBookingId: args.bookingId,
			relatedShipmentId: shipmentId,
			createdAt: now,
		});

		if (actor.isAdmin) {
			await ctx.db.insert("adminActions", {
				adminUserId: actor._id,
				actionType: "accept_booking",
				targetType: "booking",
				targetId: booking._id,
				reason: optionalTrimmed(args.note),
				createdAt: now,
			});
		}

		return shipmentId;
	},
});

export const reject = mutation({
	args: { bookingId: v.id("bookings"), reason: v.string() },
	handler: async (ctx, args) => {
		const booking = await ctx.db.get(args.bookingId);
		if (!booking) throw new Error("Booking not found");
		const actor = await requireUser(ctx);
		if (!actor.isAdmin) {
			await requireCompanyOperator(ctx, booking.companyId);
		}

		if (booking.status !== "pending_company_response") {
			throw new Error("Booking cannot be rejected in current status");
		}
		const reason = args.reason.trim();
		if (!reason) throw new Error("Rejection reason is required");

		const now = Date.now();
		await ctx.db.patch(args.bookingId, {
			status: "rejected",
			rejectionReason: reason,
			rejectedAt: now,
			updatedAt: now,
		});

		await refundBookingFunds(ctx, args.bookingId);

		await ctx.db.insert("notifications", {
			recipientUserId: booking.userId,
			type: "booking_rejected",
			title: "Booking Rejected",
			body: reason,
			relatedBookingId: args.bookingId,
			createdAt: now,
		});

		if (actor.isAdmin) {
			await ctx.db.insert("adminActions", {
				adminUserId: actor._id,
				actionType: "reject_booking",
				targetType: "booking",
				targetId: booking._id,
				reason,
				createdAt: now,
			});
		}
	},
});

export const cancelByUser = mutation({
	args: { bookingId: v.id("bookings"), reason: v.optional(v.string()) },
	handler: async (ctx, args) => {
		const user = await requireUser(ctx);
		const booking = await ctx.db.get(args.bookingId);
		if (!booking || booking.userId !== user._id) {
			throw new Error("Booking not found");
		}

		if (!["pending_company_response", "accepted"].includes(booking.status)) {
			throw new Error("Booking cannot be cancelled");
		}

		const now = Date.now();
		await ctx.db.patch(args.bookingId, {
			status: "cancelled_by_user",
			cancellationReason: args.reason,
			cancelledAt: now,
			updatedAt: now,
		});

		const shipment = await ctx.db
			.query("shipments")
			.withIndex("by_booking_id", (q) => q.eq("bookingId", args.bookingId))
			.unique();
		if (shipment && !PRE_PICKUP_SHIPMENT_STATUSES.has(shipment.status)) {
			throw new Error("Booking cannot be cancelled after pickup has started");
		}
		if (shipment) {
			await ctx.db.patch(shipment._id, {
				status: "cancelled",
				currentStatusDescription: args.reason,
				cancelledAt: now,
				updatedAt: now,
			});

			await createTrackingEvent(ctx, {
				shipmentId: shipment._id,
				bookingId: args.bookingId,
				companyId: booking.companyId,
				driverId: shipment.driverId,
				actorUserId: user._id,
				actorRole: "user",
				eventType: "shipment_cancelled",
				previousStatus: shipment.status,
				newStatus: "cancelled",
				title: "Shipment Cancelled",
				description: args.reason ?? "Customer cancelled the booking",
			});

			if (shipment.driverId) {
				const driver = await ctx.db.get(shipment.driverId);
				if (driver) {
					await ctx.db.insert("notifications", {
						recipientUserId: driver.userId,
						type: "shipment_cancelled",
						title: "Shipment Cancelled",
						body: `Shipment ${shipment.shipmentNumber} was cancelled by the customer.`,
						relatedBookingId: args.bookingId,
						relatedShipmentId: shipment._id,
						createdAt: now,
					});
				}
			}
		}

		const operators = await getActiveCompanyOperators(ctx, booking.companyId);
		for (const operator of operators) {
			await ctx.db.insert("notifications", {
				recipientUserId: operator.userId,
				type: "booking_cancelled",
				title: "Booking Cancelled",
				body: `Booking ${booking.bookingNumber} was cancelled by the customer.`,
				relatedBookingId: args.bookingId,
				relatedShipmentId: shipment?._id,
				createdAt: now,
			});
		}

		await refundBookingFunds(ctx, args.bookingId);
	},
});

export const cancelByCompany = mutation({
	args: { bookingId: v.id("bookings"), reason: v.string() },
	handler: async (ctx, args) => {
		const booking = await ctx.db.get(args.bookingId);
		if (!booking) throw new Error("Booking not found");

		const actor = await requireUser(ctx);
		if (!actor.isAdmin) {
			await requireCompanyOperator(ctx, booking.companyId);
		} else {
			await requireAdmin(ctx);
		}

		if (!["pending_company_response", "accepted"].includes(booking.status)) {
			throw new Error("Booking cannot be cancelled in its current status");
		}

		const reason = args.reason.trim();
		if (!reason) throw new Error("Cancellation reason is required");

		const shipment = await ctx.db
			.query("shipments")
			.withIndex("by_booking_id", (q) => q.eq("bookingId", args.bookingId))
			.unique();
		if (shipment && !PRE_PICKUP_SHIPMENT_STATUSES.has(shipment.status)) {
			throw new Error("Shipment cannot be cancelled after pickup has started");
		}

		const now = Date.now();
		await ctx.db.patch(args.bookingId, {
			status: "cancelled_by_company",
			cancellationReason: reason,
			cancelledAt: now,
			updatedAt: now,
		});

		if (shipment) {
			await ctx.db.patch(shipment._id, {
				status: "cancelled",
				currentStatusDescription: reason,
				cancelledAt: now,
				updatedAt: now,
			});
			await createTrackingEvent(ctx, {
				shipmentId: shipment._id,
				bookingId: booking._id,
				companyId: booking.companyId,
				driverId: shipment.driverId,
				actorUserId: actor._id,
				actorRole: actor.isAdmin ? "admin" : "company",
				eventType: "shipment_cancelled",
				previousStatus: shipment.status,
				newStatus: "cancelled",
				title: "Shipment Cancelled",
				description: reason,
			});

			if (shipment.driverId) {
				const driver = await ctx.db.get(shipment.driverId);
				if (driver) {
					await ctx.db.insert("notifications", {
						recipientUserId: driver.userId,
						type: "shipment_cancelled",
						title: "Shipment Cancelled",
						body: reason,
						relatedBookingId: booking._id,
						relatedShipmentId: shipment._id,
						createdAt: now,
					});
				}
			}
		}

		await refundBookingFunds(ctx, booking._id);
		await ctx.db.insert("notifications", {
			recipientUserId: booking.userId,
			type: "booking_cancelled",
			title: "Booking Cancelled by Company",
			body: reason,
			relatedBookingId: booking._id,
			relatedShipmentId: shipment?._id,
			createdAt: now,
		});

		if (actor.isAdmin) {
			await ctx.db.insert("adminActions", {
				adminUserId: actor._id,
				actionType: "cancel_booking",
				targetType: "booking",
				targetId: booking._id,
				reason,
				createdAt: now,
			});
		}
	},
});
