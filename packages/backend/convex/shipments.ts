import { v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import {
	assertCompanyApproved,
	assertUserNotBanned,
	getActiveCompanyOperators,
	getDriverByUserId,
	requireAdmin,
	requireCompanyOperator,
	requireDriver,
	requireShipmentAccess,
	requireUser,
} from "./lib/auth";
import { coarsenLocation, sanitizeGeoPoint } from "./lib/geo";
import {
	canTransitionShipment,
	DESCRIPTION_REQUIRED_STATUSES,
	getNextShipmentStatuses,
	PRE_PICKUP_SHIPMENT_STATUSES,
	PROOF_REQUIRED_STATUSES,
} from "./lib/statusTransitions";
import { geoPoint, shipmentStatus } from "./lib/validators";
import {
	createTrackingEvent,
	filterVisibleTrackingEvents,
} from "./trackingEvents";
import { settleDriverCompensationForShipment } from "./wallets";

type ShipmentActor = {
	user: Doc<"users">;
	role: "driver" | "company" | "admin";
};

const DEFAULT_TRANSIT_STEP_TITLE = "In transit";

const USER_CAN_CONFIRM_RECEIPT_STATUSES = new Set([
	"picked_up",
	"in_transit",
	"at_checkpoint",
	"delayed",
	"out_for_delivery",
	"delivered",
]);

const OPERATOR_CAN_MARK_DELIVERED_STATUSES = new Set([
	"picked_up",
	"in_transit",
	"at_checkpoint",
	"delayed",
	"out_for_delivery",
]);

async function requireShipmentOperator(
	ctx: MutationCtx,
	shipment: Doc<"shipments">,
): Promise<ShipmentActor> {
	const user = await requireUser(ctx);
	assertUserNotBanned(user);

	if (user.isAdmin) {
		return { user, role: "admin" };
	}

	const driver = await getDriverByUserId(ctx, user._id);
	if (
		driver?.status === "active" &&
		shipment.driverId === driver._id &&
		driver.companyId === shipment.companyId
	) {
		return { user, role: "driver" };
	}

	await requireCompanyOperator(ctx, shipment.companyId);
	return { user, role: "company" };
}

async function ensureDefaultTransitStep(
	ctx: MutationCtx,
	shipment: Doc<"shipments">,
) {
	const existing = await ctx.db
		.query("transitSteps")
		.withIndex("by_shipment_id", (q) => q.eq("shipmentId", shipment._id))
		.collect();
	if (existing.length > 0) return;

	const now = Date.now();
	await ctx.db.insert("transitSteps", {
		shipmentId: shipment._id,
		companyId: shipment.companyId,
		driverId: shipment.driverId,
		title: DEFAULT_TRANSIT_STEP_TITLE,
		description: "Default transit leg to destination",
		sequence: 0,
		status: "pending",
		createdAt: now,
		updatedAt: now,
	});
}

async function finalizeDelivery(
	ctx: MutationCtx,
	shipment: Doc<"shipments">,
	actor: { user: Doc<"users">; role: "user" | "company" | "driver" | "admin" },
	description: string,
) {
	const now = Date.now();
	await ctx.db.patch(shipment._id, {
		status: "delivery_confirmed",
		deliveryConfirmedAt: now,
		updatedAt: now,
	});

	await createTrackingEvent(ctx, {
		shipmentId: shipment._id,
		bookingId: shipment.bookingId,
		companyId: shipment.companyId,
		driverId: shipment.driverId,
		actorUserId: actor.user._id,
		actorRole: actor.role,
		eventType: "delivery_confirmed",
		previousStatus: shipment.status,
		newStatus: "delivery_confirmed",
		title: "Delivery Confirmed",
		description,
	});

	const company = await ctx.db.get(shipment.companyId);
	if (company) {
		await ctx.db.patch(company._id, {
			completedShipmentCount: company.completedShipmentCount + 1,
			updatedAt: now,
		});
	}

	if (shipment.driverId) {
		const driver = await ctx.db.get(shipment.driverId);
		if (driver) {
			await ctx.db.patch(driver._id, {
				completedShipmentCount: driver.completedShipmentCount + 1,
				updatedAt: now,
			});
		}
	}

	await settleDriverCompensationForShipment(ctx, shipment);

	const operators = await getActiveCompanyOperators(ctx, shipment.companyId);
	for (const operator of operators) {
		if (operator.userId === actor.user._id) continue;
		await ctx.db.insert("notifications", {
			recipientUserId: operator.userId,
			type: "delivery_confirmed",
			title: "Delivery Confirmed",
			body: `Shipment ${shipment.shipmentNumber} was confirmed delivered.`,
			relatedShipmentId: shipment._id,
			createdAt: now,
		});
	}

	if (actor.role !== "user") {
		await ctx.db.insert("notifications", {
			recipientUserId: shipment.userId,
			type: "delivery_confirmed",
			title: "Delivery Confirmed",
			body: description,
			relatedShipmentId: shipment._id,
			createdAt: now,
		});
	}
}

async function maybeFinalizeDelivery(
	ctx: MutationCtx,
	shipment: Doc<"shipments">,
	actor: { user: Doc<"users">; role: "user" | "company" | "driver" | "admin" },
	description: string,
) {
	if (shipment.status === "delivery_confirmed") {
		throw new Error("Shipment is already completed");
	}
	if (!shipment.deliveredAt || !shipment.userReceiptConfirmedAt) {
		return false;
	}

	await finalizeDelivery(ctx, shipment, actor, description);
	return true;
}

async function recordUserReceiptConfirmation(
	ctx: MutationCtx,
	shipment: Doc<"shipments">,
	user: Doc<"users">,
) {
	if (shipment.userReceiptConfirmedAt) {
		return shipment;
	}

	const now = Date.now();
	await ctx.db.patch(shipment._id, {
		userReceiptConfirmedAt: now,
		updatedAt: now,
	});

	await createTrackingEvent(ctx, {
		shipmentId: shipment._id,
		bookingId: shipment.bookingId,
		companyId: shipment.companyId,
		driverId: shipment.driverId,
		actorUserId: user._id,
		actorRole: "user",
		eventType: "user_receipt_confirmed",
		title: "Receipt Confirmed",
		description: "Customer confirmed receipt of the shipment",
	});

	const operators = await getActiveCompanyOperators(ctx, shipment.companyId);
	for (const operator of operators) {
		await ctx.db.insert("notifications", {
			recipientUserId: operator.userId,
			type: "shipment_status",
			title: "Customer Confirmed Receipt",
			body: `Customer confirmed receipt for shipment ${shipment.shipmentNumber}`,
			relatedShipmentId: shipment._id,
			createdAt: now,
		});
	}

	return (await ctx.db.get(shipment._id)) ?? shipment;
}

async function markDeliveredByOperator(
	ctx: MutationCtx,
	shipment: Doc<"shipments">,
	actor: ShipmentActor,
	description: string,
	proofOverrideReason?: string,
) {
	if (["delivered", "delivery_confirmed"].includes(shipment.status)) {
		throw new Error("Shipment is already delivered");
	}
	if (["cancelled", "disputed", "failed_delivery"].includes(shipment.status)) {
		throw new Error("Shipment cannot be marked delivered from this status");
	}
	if (!OPERATOR_CAN_MARK_DELIVERED_STATUSES.has(shipment.status)) {
		throw new Error("Shipment must be picked up before marking delivered");
	}

	let proofWasOverridden = false;
	if (shipment.deliveryProofRequired) {
		const proof = await ctx.db
			.query("proofs")
			.withIndex("by_shipment_id", (q) => q.eq("shipmentId", shipment._id))
			.filter((q) => q.eq(q.field("type"), "delivery_photo"))
			.first();
		if (!proof) {
			const reason = proofOverrideReason?.trim();
			if (!reason) {
				throw new Error("A proof override reason is required");
			}
			proofWasOverridden = true;
			await createTrackingEvent(ctx, {
				shipmentId: shipment._id,
				bookingId: shipment.bookingId,
				companyId: shipment.companyId,
				driverId: shipment.driverId,
				actorUserId: actor.user._id,
				actorRole: actor.role,
				eventType: "proof_requirement_overridden",
				title: "Proof Requirement Overridden",
				description: reason,
				visibility: actor.role === "admin" ? "admin" : "company",
			});
		}
	}

	const now = Date.now();
	await completeOpenTransitSteps(
		ctx,
		shipment,
		actor,
		"Completed when shipment was marked delivered",
	);
	await ctx.db.patch(shipment._id, {
		status: "delivered",
		deliveredAt: now,
		currentStatusDescription: description,
		updatedAt: now,
	});

	await createTrackingEvent(ctx, {
		shipmentId: shipment._id,
		bookingId: shipment.bookingId,
		companyId: shipment.companyId,
		driverId: shipment.driverId,
		actorUserId: actor.user._id,
		actorRole: actor.role,
		eventType: "status_change",
		previousStatus: shipment.status,
		newStatus: "delivered",
		title: "Delivered",
		description,
	});

	await ctx.db.insert("notifications", {
		recipientUserId: shipment.userId,
		type: "shipment_status",
		title: "Delivered",
		body: description,
		relatedShipmentId: shipment._id,
		createdAt: now,
	});

	const operators = await getActiveCompanyOperators(ctx, shipment.companyId);
	for (const operator of operators) {
		if (operator.userId === actor.user._id) continue;
		await ctx.db.insert("notifications", {
			recipientUserId: operator.userId,
			type: "shipment_status",
			title: "Delivered",
			body: description,
			relatedShipmentId: shipment._id,
			createdAt: now,
		});
	}

	if (shipment.driverId && actor.role !== "driver") {
		const driver = await ctx.db.get(shipment.driverId);
		if (driver && driver.userId !== actor.user._id) {
			await ctx.db.insert("notifications", {
				recipientUserId: driver.userId,
				type: "shipment_status",
				title: "Delivered",
				body: description,
				relatedShipmentId: shipment._id,
				createdAt: now,
			});
		}
	}

	if (actor.role === "admin") {
		await ctx.db.insert("adminActions", {
			adminUserId: actor.user._id,
			actionType: proofWasOverridden
				? "override_shipment_proof"
				: "update_shipment_status",
			targetType: "shipment",
			targetId: shipment._id,
			reason: proofOverrideReason ?? description,
			metadata: {
				previousStatus: shipment.status,
				newStatus: "delivered",
			},
			createdAt: now,
		});
	}

	const updatedShipment = await ctx.db.get(shipment._id);
	if (!updatedShipment) throw new Error("Shipment not found");

	await maybeFinalizeDelivery(
		ctx,
		updatedShipment,
		{ user: actor.user, role: actor.role },
		"Delivery completed after both customer and carrier confirmed",
	);

	return updatedShipment;
}

async function getTransitStepCompletion(
	ctx: MutationCtx,
	shipmentId: Doc<"shipments">["_id"],
) {
	const steps = await ctx.db
		.query("transitSteps")
		.withIndex("by_shipment_id", (q) => q.eq("shipmentId", shipmentId))
		.collect();
	return {
		steps,
		allCompleted:
			steps.length > 0 && steps.every((step) => step.status === "completed"),
	};
}

async function completeOpenTransitSteps(
	ctx: MutationCtx,
	shipment: Doc<"shipments">,
	actor: ShipmentActor,
	description: string,
) {
	const now = Date.now();
	const steps = await ctx.db
		.query("transitSteps")
		.withIndex("by_shipment_id", (q) => q.eq("shipmentId", shipment._id))
		.collect();

	for (const step of steps) {
		if (step.status === "completed") continue;
		await ctx.db.patch(step._id, {
			status: "completed",
			completedAt: now,
			updatedAt: now,
		});

		await createTrackingEvent(ctx, {
			shipmentId: shipment._id,
			bookingId: shipment.bookingId,
			companyId: shipment.companyId,
			driverId: step.driverId ?? shipment.driverId,
			actorUserId: actor.user._id,
			actorRole: actor.role,
			eventType: "transit_step_completed",
			title: step.title,
			description,
		});
	}
}

export const listForCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		const user = await requireUser(ctx);
		return await ctx.db
			.query("shipments")
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
			.query("shipments")
			.withIndex("by_company_id", (q) => q.eq("companyId", args.companyId))
			.order("desc")
			.collect();
	},
});

export const getActiveForCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		const user = await requireUser(ctx);
		const shipments = await ctx.db
			.query("shipments")
			.withIndex("by_user_id", (q) => q.eq("userId", user._id))
			.order("desc")
			.collect();

		const active = shipments.find(
			(s) =>
				!["delivery_confirmed", "cancelled", "disputed"].includes(s.status),
		);
		if (!active) return null;

		const cargo = await ctx.db
			.query("cargoDetails")
			.withIndex("by_shipment_id", (q) => q.eq("shipmentId", active._id))
			.unique();
		const booking = await ctx.db.get(active.bookingId);
		return { shipment: active, cargo, booking };
	},
});

export const getById = query({
	args: { shipmentId: v.id("shipments") },
	handler: async (ctx, args) => {
		const { user, shipment } = await requireShipmentAccess(
			ctx,
			args.shipmentId,
		);
		const booking = await ctx.db.get(shipment.bookingId);
		const cargo = await ctx.db
			.query("cargoDetails")
			.withIndex("by_shipment_id", (q) => q.eq("shipmentId", args.shipmentId))
			.unique();
		const company = await ctx.db.get(shipment.companyId);
		let driver = null;
		let driverUser = null;
		if (shipment.driverId) {
			driver = await ctx.db.get(shipment.driverId);
			if (driver) driverUser = await ctx.db.get(driver.userId);
		}
		const vehicle = shipment.vehicleId
			? await ctx.db.get(shipment.vehicleId)
			: null;
		const transitSteps = await ctx.db
			.query("transitSteps")
			.withIndex("by_shipment_id", (q) => q.eq("shipmentId", args.shipmentId))
			.collect();
		const events = await ctx.db
			.query("trackingEvents")
			.withIndex("by_shipment_id", (q) => q.eq("shipmentId", args.shipmentId))
			.order("desc")
			.collect();
		const review = await ctx.db
			.query("reviews")
			.withIndex("by_shipment_id", (q) => q.eq("shipmentId", args.shipmentId))
			.unique();
		const visibleReview =
			review &&
			(user.isAdmin ||
				review.userId === user._id ||
				review.status === "published")
				? review
				: null;
		const currentLocations = await ctx.db
			.query("shipmentLocations")
			.withIndex("by_shipment_id", (q) => q.eq("shipmentId", args.shipmentId))
			.collect();
		const currentLocation =
			currentLocations.sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;

		return {
			shipment,
			booking,
			cargo,
			company,
			driver,
			driverUser,
			vehicle,
			transitSteps: transitSteps.sort((a, b) => a.sequence - b.sequence),
			review: visibleReview,
			currentLocation,
			events: await filterVisibleTrackingEvents(ctx, user, shipment, events),
		};
	},
});

export const getPublicByNumber = query({
	args: { shipmentNumber: v.string() },
	handler: async (ctx, args) => {
		const shipmentNumber = args.shipmentNumber.trim().toUpperCase();
		if (!shipmentNumber) return null;

		const shipment = await ctx.db
			.query("shipments")
			.withIndex("by_shipment_number", (q) =>
				q.eq("shipmentNumber", shipmentNumber),
			)
			.unique();
		if (!shipment) return null;

		const company = await ctx.db.get(shipment.companyId);
		const events = await ctx.db
			.query("trackingEvents")
			.withIndex("by_shipment_id", (q) => q.eq("shipmentId", shipment._id))
			.order("desc")
			.collect();
		const currentLocations = await ctx.db
			.query("shipmentLocations")
			.withIndex("by_shipment_id", (q) => q.eq("shipmentId", shipment._id))
			.collect();
		const currentLocation =
			currentLocations.sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;

		return {
			shipment: {
				_id: shipment._id,
				shipmentNumber: shipment.shipmentNumber,
				status: shipment.status,
				pickupAddress: shipment.pickupAddress,
				destinationAddress: shipment.destinationAddress,
				pickupLocation: shipment.pickupLocation,
				destinationLocation: shipment.destinationLocation,
				routeSnapshot: shipment.routeSnapshot,
				currentStatusDescription: shipment.currentStatusDescription,
				updatedAt: shipment.updatedAt,
			},
			company: company
				? {
						_id: company._id,
						name: company.name,
						slug: company.slug,
					}
				: null,
			currentLocation: currentLocation
				? coarsenLocation(currentLocation)
				: null,
			events: events
				.filter((event) => event.visibility === "public")
				.map((event) => ({
					_id: event._id,
					title: event.title,
					description: event.description,
					newStatus: event.newStatus,
					createdAt: event.createdAt,
				})),
		};
	},
});

export const assignDriver = mutation({
	args: {
		shipmentId: v.id("shipments"),
		driverId: v.id("drivers"),
		vehicleId: v.optional(v.id("vehicles")),
	},
	handler: async (ctx, args) => {
		const shipment = await ctx.db.get(args.shipmentId);
		if (!shipment) throw new Error("Shipment not found");
		const company = await ctx.db.get(shipment.companyId);
		if (!company) throw new Error("Company not found");
		assertCompanyApproved(company);

		const user = await requireUser(ctx);
		assertUserNotBanned(user);
		if (!user.isAdmin) {
			await requireCompanyOperator(ctx, shipment.companyId);
		}
		if (!PRE_PICKUP_SHIPMENT_STATUSES.has(shipment.status)) {
			throw new Error("Driver cannot be changed after pickup has started");
		}

		const driver = await ctx.db.get(args.driverId);
		if (
			!driver ||
			driver.companyId !== shipment.companyId ||
			driver.status !== "active"
		) {
			throw new Error("Invalid driver");
		}
		if (shipment.driverId === args.driverId) {
			throw new Error("This driver is already assigned");
		}
		let vehicleId = args.vehicleId;
		if (vehicleId) {
			const vehicle = await ctx.db.get(vehicleId);
			if (
				!vehicle ||
				vehicle.companyId !== shipment.companyId ||
				vehicle.status !== "active"
			) {
				throw new Error("Invalid vehicle");
			}
		} else {
			vehicleId = driver.vehicleId;
		}

		const now = Date.now();
		const previousStatus = shipment.status;
		const newStatus =
			previousStatus === "awaiting_driver_assignment"
				? "driver_assigned"
				: previousStatus;

		await ctx.db.patch(args.shipmentId, {
			driverId: args.driverId,
			vehicleId,
			status: newStatus,
			updatedAt: now,
		});

		const driverUser = await ctx.db.get(driver.userId);
		await createTrackingEvent(ctx, {
			shipmentId: args.shipmentId,
			bookingId: shipment.bookingId,
			companyId: shipment.companyId,
			driverId: args.driverId,
			actorUserId: user._id,
			actorRole: user.isAdmin ? "admin" : "company",
			eventType: "driver_assigned",
			previousStatus,
			newStatus,
			title: "Driver Assigned",
			description: `${driverUser?.name ?? "A driver"} has been assigned to your shipment`,
		});

		if (driverUser) {
			await ctx.db.insert("notifications", {
				recipientUserId: driverUser._id,
				type: "driver_assigned",
				title: "New Shipment Assignment",
				body: `Shipment ${shipment.shipmentNumber} assigned to you`,
				relatedShipmentId: args.shipmentId,
				createdAt: now,
			});
		}

		await ctx.db.insert("notifications", {
			recipientUserId: shipment.userId,
			type: "driver_assigned",
			title: "Driver Assigned",
			body: `${driverUser?.name ?? "A driver"} has been assigned to your shipment`,
			relatedShipmentId: args.shipmentId,
			createdAt: now,
		});

		if (shipment.driverId) {
			const previousDriver = await ctx.db.get(shipment.driverId);
			if (previousDriver) {
				await ctx.db.insert("notifications", {
					recipientUserId: previousDriver.userId,
					type: "driver_unassigned",
					title: "Shipment Reassigned",
					body: `Shipment ${shipment.shipmentNumber} is no longer assigned to you`,
					relatedShipmentId: args.shipmentId,
					createdAt: now,
				});
			}
		}

		if (user.isAdmin) {
			await ctx.db.insert("adminActions", {
				adminUserId: user._id,
				actionType: "assign_driver",
				targetType: "shipment",
				targetId: shipment._id,
				metadata: { driverId: args.driverId },
				createdAt: now,
			});
		}
	},
});

export const updateTransitPlan = mutation({
	args: {
		shipmentId: v.id("shipments"),
		steps: v.array(
			v.object({
				title: v.string(),
				description: v.optional(v.string()),
				location: v.optional(v.string()),
				locationPoint: v.optional(geoPoint),
				driverId: v.optional(v.id("drivers")),
			}),
		),
	},
	handler: async (ctx, args) => {
		const shipment = await ctx.db.get(args.shipmentId);
		if (!shipment) throw new Error("Shipment not found");
		const actor = await requireUser(ctx);
		if (!actor.isAdmin) {
			await requireCompanyOperator(ctx, shipment.companyId);
		}
		if (!PRE_PICKUP_SHIPMENT_STATUSES.has(shipment.status)) {
			throw new Error("Transit plan can only be changed before pickup");
		}

		const cleanSteps = args.steps
			.map((step) => ({
				title: step.title.trim(),
				description: step.description?.trim() || undefined,
				location: step.location?.trim() || undefined,
				locationPoint: step.locationPoint
					? sanitizeGeoPoint(step.locationPoint)
					: undefined,
				driverId: step.driverId,
			}))
			.filter((step) => step.title);
		if (cleanSteps.length === 0) {
			throw new Error("Add at least one transit step");
		}

		for (const step of cleanSteps) {
			if (step.driverId) {
				const driver = await ctx.db.get(step.driverId);
				if (!driver || driver.companyId !== shipment.companyId) {
					throw new Error("Invalid driver assigned to transit step");
				}
			}
		}

		const existing = await ctx.db
			.query("transitSteps")
			.withIndex("by_shipment_id", (q) => q.eq("shipmentId", args.shipmentId))
			.collect();
		for (const step of existing) {
			await ctx.db.delete(step._id);
		}

		const now = Date.now();
		for (const [index, step] of cleanSteps.entries()) {
			await ctx.db.insert("transitSteps", {
				shipmentId: shipment._id,
				companyId: shipment.companyId,
				driverId: step.driverId,
				title: step.title,
				description: step.description,
				location: step.location,
				locationPoint: step.locationPoint,
				sequence: index,
				status: "pending",
				createdAt: now,
				updatedAt: now,
			});
		}

		await createTrackingEvent(ctx, {
			shipmentId: shipment._id,
			bookingId: shipment.bookingId,
			companyId: shipment.companyId,
			driverId: shipment.driverId,
			actorUserId: actor._id,
			actorRole: actor.isAdmin ? "admin" : "company",
			eventType: "transit_plan_updated",
			title: "Transit Plan Updated",
			description: `${cleanSteps.length} transit step${cleanSteps.length === 1 ? "" : "s"} planned`,
		});
	},
});

export const completeTransitStep = mutation({
	args: {
		stepId: v.id("transitSteps"),
		description: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const step = await ctx.db.get(args.stepId);
		if (!step) throw new Error("Transit step not found");
		const shipment = await ctx.db.get(step.shipmentId);
		if (!shipment) throw new Error("Shipment not found");
		const actor = await requireUser(ctx);
		const driver = await getDriverByUserId(ctx, actor._id);
		const isAssignedShipmentDriver =
			driver?.status === "active" &&
			driver.companyId === shipment.companyId &&
			shipment.driverId === driver._id;
		const isAssignedStepDriver =
			driver?.status === "active" &&
			driver.companyId === shipment.companyId &&
			step.driverId === driver._id;
		const actorRole = actor.isAdmin
			? "admin"
			: isAssignedShipmentDriver || isAssignedStepDriver
				? "driver"
				: "company";

		if (!actor.isAdmin && !isAssignedShipmentDriver && !isAssignedStepDriver) {
			await requireCompanyOperator(ctx, step.companyId);
		}
		if (step.status === "completed") {
			throw new Error("Transit step already completed");
		}

		const now = Date.now();
		await ctx.db.patch(step._id, {
			status: "completed",
			completedAt: now,
			updatedAt: now,
		});

		await createTrackingEvent(ctx, {
			shipmentId: shipment._id,
			bookingId: shipment.bookingId,
			companyId: shipment.companyId,
			driverId: step.driverId ?? shipment.driverId,
			actorUserId: actor._id,
			actorRole,
			eventType: "transit_step_completed",
			title: step.title,
			description: args.description?.trim() || step.description,
		});

		const steps = await ctx.db
			.query("transitSteps")
			.withIndex("by_shipment_id", (q) => q.eq("shipmentId", shipment._id))
			.collect();
		const allCompleted =
			steps.length > 0 && steps.every((item) => item.status === "completed");
		if (
			allCompleted &&
			![
				"delivered",
				"delivery_confirmed",
				"cancelled",
				"disputed",
				"failed_delivery",
			].includes(shipment.status)
		) {
			await ctx.db.patch(shipment._id, {
				status: "delivered",
				deliveredAt: now,
				currentStatusDescription: "All transit steps completed",
				updatedAt: now,
			});
			await createTrackingEvent(ctx, {
				shipmentId: shipment._id,
				bookingId: shipment.bookingId,
				companyId: shipment.companyId,
				driverId: shipment.driverId,
				actorUserId: actor._id,
				actorRole,
				eventType: "status_change",
				previousStatus: shipment.status,
				newStatus: "delivered",
				title: "Delivered",
				description: "All transit steps completed",
			});

			await ctx.db.insert("notifications", {
				recipientUserId: shipment.userId,
				type: "shipment_status",
				title: "Delivered",
				body: "All transit steps completed",
				relatedShipmentId: shipment._id,
				createdAt: now,
			});

			const updatedShipment = await ctx.db.get(shipment._id);
			if (updatedShipment) {
				await maybeFinalizeDelivery(
					ctx,
					updatedShipment,
					{ user: actor, role: actorRole },
					"Delivery completed after both customer and carrier confirmed",
				);
			}
		}
	},
});

export const transitionStatus = mutation({
	args: {
		shipmentId: v.id("shipments"),
		newStatus: shipmentStatus,
		description: v.optional(v.string()),
		proofOverrideReason: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const shipment = await ctx.db.get(args.shipmentId);
		if (!shipment) throw new Error("Shipment not found");
		const company = await ctx.db.get(shipment.companyId);
		if (!company) throw new Error("Company not found");
		assertCompanyApproved(company);

		const actor = await requireShipmentOperator(ctx, shipment);

		if (!canTransitionShipment(shipment.status, args.newStatus)) {
			throw new Error(
				`Cannot transition from ${shipment.status} to ${args.newStatus}`,
			);
		}
		if (args.newStatus === "driver_assigned") {
			throw new Error(
				"Assign a driver to move the shipment to driver assigned",
			);
		}
		if (args.newStatus === "delivery_confirmed") {
			throw new Error("Use delivery confirmation instead of a status update");
		}
		if (args.newStatus === "in_transit") {
			if (actor.role === "driver") {
				throw new Error("Company confirmation is required to start transit");
			}
			await ensureDefaultTransitStep(ctx, shipment);
		}
		if (args.newStatus === "delivered") {
			const { allCompleted } = await getTransitStepCompletion(
				ctx,
				args.shipmentId,
			);
			if (!allCompleted) {
				throw new Error("Complete all transit steps before marking delivered");
			}
		}
		if (
			actor.role === "driver" &&
			["cancelled", "disputed"].includes(args.newStatus)
		) {
			throw new Error("Only the company or an admin can use this status");
		}

		const description = args.description?.trim() || undefined;
		if (DESCRIPTION_REQUIRED_STATUSES.has(args.newStatus) && !description) {
			throw new Error(
				`A note is required when marking a shipment as ${args.newStatus}`,
			);
		}

		let proofWasOverridden = false;
		let proofOverrideReason: string | undefined;
		if (PROOF_REQUIRED_STATUSES.has(args.newStatus)) {
			const proofIsRequired =
				args.newStatus === "picked_up"
					? shipment.pickupProofRequired
					: shipment.deliveryProofRequired;
			const proofType =
				args.newStatus === "picked_up" ? "pickup_photo" : "delivery_photo";
			const proof = await ctx.db
				.query("proofs")
				.withIndex("by_shipment_id", (q) => q.eq("shipmentId", args.shipmentId))
				.filter((q) => q.eq(q.field("type"), proofType))
				.first();
			if (proofIsRequired && !proof) {
				if (actor.role === "driver") {
					throw new Error(`Proof required before marking as ${args.newStatus}`);
				}
				proofOverrideReason = args.proofOverrideReason?.trim();
				if (!proofOverrideReason) {
					throw new Error("A proof override reason is required");
				}
				proofWasOverridden = true;
			}
		}

		const now = Date.now();
		const updates: Record<string, unknown> = {
			status: args.newStatus,
			currentStatusDescription: description,
			updatedAt: now,
		};
		if (args.newStatus === "picked_up") updates.pickupConfirmedAt = now;
		if (args.newStatus === "delivered") updates.deliveredAt = now;

		await ctx.db.patch(args.shipmentId, updates);

		await createTrackingEvent(ctx, {
			shipmentId: args.shipmentId,
			bookingId: shipment.bookingId,
			companyId: shipment.companyId,
			driverId: shipment.driverId,
			actorUserId: actor.user._id,
			actorRole: actor.role,
			eventType: "status_change",
			previousStatus: shipment.status,
			newStatus: args.newStatus,
			title: formatStatusTitle(args.newStatus),
			description,
		});

		if (proofWasOverridden && proofOverrideReason) {
			await createTrackingEvent(ctx, {
				shipmentId: shipment._id,
				bookingId: shipment.bookingId,
				companyId: shipment.companyId,
				driverId: shipment.driverId,
				actorUserId: actor.user._id,
				actorRole: actor.role,
				eventType: "proof_requirement_overridden",
				title: "Proof Requirement Overridden",
				description: proofOverrideReason,
				visibility: actor.role === "admin" ? "admin" : "company",
			});
		}

		await ctx.db.insert("notifications", {
			recipientUserId: shipment.userId,
			type: "shipment_status",
			title: formatStatusTitle(args.newStatus),
			body: description,
			relatedShipmentId: args.shipmentId,
			createdAt: now,
		});

		const operators = await getActiveCompanyOperators(ctx, shipment.companyId);
		for (const operator of operators) {
			if (operator.userId === actor.user._id) continue;
			await ctx.db.insert("notifications", {
				recipientUserId: operator.userId,
				type: "shipment_status",
				title: formatStatusTitle(args.newStatus),
				body: description,
				relatedShipmentId: args.shipmentId,
				createdAt: now,
			});
		}

		if (shipment.driverId && actor.role !== "driver") {
			const driver = await ctx.db.get(shipment.driverId);
			if (driver && driver.userId !== actor.user._id) {
				await ctx.db.insert("notifications", {
					recipientUserId: driver.userId,
					type: "shipment_status",
					title: formatStatusTitle(args.newStatus),
					body: description,
					relatedShipmentId: shipment._id,
					createdAt: now,
				});
			}
		}

		if (actor.role === "admin") {
			await ctx.db.insert("adminActions", {
				adminUserId: actor.user._id,
				actionType: proofWasOverridden
					? "override_shipment_proof"
					: "update_shipment_status",
				targetType: "shipment",
				targetId: shipment._id,
				reason: proofOverrideReason ?? description,
				metadata: {
					previousStatus: shipment.status,
					newStatus: args.newStatus,
				},
				createdAt: now,
			});
		}

		if (args.newStatus === "delivered") {
			const updatedShipment = await ctx.db.get(args.shipmentId);
			if (updatedShipment) {
				await maybeFinalizeDelivery(
					ctx,
					updatedShipment,
					{ user: actor.user, role: actor.role },
					"Delivery completed after both customer and carrier confirmed",
				);
			}
		}
	},
});

export const markDeliveredByCompany = mutation({
	args: {
		shipmentId: v.id("shipments"),
		description: v.optional(v.string()),
		proofOverrideReason: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const shipment = await ctx.db.get(args.shipmentId);
		if (!shipment) throw new Error("Shipment not found");
		const company = await ctx.db.get(shipment.companyId);
		if (!company) throw new Error("Company not found");
		assertCompanyApproved(company);

		const actor = await requireShipmentOperator(ctx, shipment);
		if (actor.role === "driver") {
			throw new Error("Only the company or an admin can mark delivery");
		}

		const description =
			args.description?.trim() || "Company marked the shipment delivered";
		await markDeliveredByOperator(
			ctx,
			shipment,
			actor,
			description,
			args.proofOverrideReason,
		);
	},
});

export const confirmDelivery = mutation({
	args: { shipmentId: v.id("shipments") },
	handler: async (ctx, args) => {
		const user = await requireUser(ctx);
		const shipment = await ctx.db.get(args.shipmentId);
		if (!shipment || shipment.userId !== user._id) {
			throw new Error("Shipment not found");
		}
		if (shipment.status === "delivery_confirmed") {
			throw new Error("Shipment is already completed");
		}
		if (!USER_CAN_CONFIRM_RECEIPT_STATUSES.has(shipment.status)) {
			throw new Error("Shipment is not ready for receipt confirmation");
		}

		const updatedShipment = await recordUserReceiptConfirmation(
			ctx,
			shipment,
			user,
		);
		await maybeFinalizeDelivery(
			ctx,
			updatedShipment,
			{ user, role: "user" },
			"Customer confirmed receipt of the shipment",
		);
	},
});

export const closeByDriver = mutation({
	args: {
		shipmentId: v.id("shipments"),
		description: v.optional(v.string()),
		proofOverrideReason: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { user, driver } = await requireDriver(ctx);
		const shipment = await ctx.db.get(args.shipmentId);
		if (
			!shipment ||
			shipment.driverId !== driver._id ||
			shipment.companyId !== driver.companyId
		) {
			throw new Error("Shipment not found");
		}

		const description =
			args.description?.trim() || "Driver marked the shipment delivered";
		await markDeliveredByOperator(
			ctx,
			shipment,
			{ user, role: "driver" },
			description,
			args.proofOverrideReason,
		);
	},
});

export const confirmDeliveryOverride = mutation({
	args: { shipmentId: v.id("shipments"), reason: v.string() },
	handler: async (ctx, args) => {
		const shipment = await ctx.db.get(args.shipmentId);
		if (!shipment) throw new Error("Shipment not found");
		if (!["delivered", "disputed"].includes(shipment.status)) {
			throw new Error(
				"Shipment must be delivered or disputed before confirmation",
			);
		}

		const actor = await requireUser(ctx);
		if (!actor.isAdmin) {
			await requireCompanyOperator(ctx, shipment.companyId);
		} else {
			await requireAdmin(ctx);
		}

		const reason = args.reason.trim();
		if (!reason) throw new Error("Override reason is required");

		await finalizeDelivery(
			ctx,
			shipment,
			{ user: actor, role: actor.isAdmin ? "admin" : "company" },
			reason,
		);

		if (actor.isAdmin) {
			await ctx.db.insert("adminActions", {
				adminUserId: actor._id,
				actionType: "confirm_delivery_override",
				targetType: "shipment",
				targetId: shipment._id,
				reason,
				createdAt: Date.now(),
			});
		}
	},
});

export const getNextStatuses = query({
	args: { shipmentId: v.id("shipments") },
	handler: async (ctx, args) => {
		const { shipment } = await requireShipmentAccess(ctx, args.shipmentId);
		return getNextShipmentStatuses(shipment.status);
	},
});

function formatStatusTitle(status: string): string {
	return status
		.split("_")
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(" ");
}
