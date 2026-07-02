import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import {
	assertCompanyApproved,
	getCompanyMember,
	requireDriver,
	requireShipmentAccess,
} from "./lib/auth";
import { proofType } from "./lib/validators";
import { createTrackingEvent } from "./trackingEvents";

export const generateUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		await requireDriver(ctx);
		return await ctx.storage.generateUploadUrl();
	},
});

export const attachProof = mutation({
	args: {
		shipmentId: v.id("shipments"),
		type: proofType,
		storageId: v.id("_storage"),
	},
	handler: async (ctx, args) => {
		const { user, shipment } = await requireShipmentAccess(
			ctx,
			args.shipmentId,
		);

		const driver = await ctx.db
			.query("drivers")
			.withIndex("by_user_id", (q) => q.eq("userId", user._id))
			.unique();

		if (!driver || shipment.driverId !== driver._id) {
			throw new Error("Only assigned driver can upload proof");
		}
		const company = await ctx.db.get(shipment.companyId);
		if (!company) throw new Error("Company not found");
		assertCompanyApproved(company);
		if (["delivery_confirmed", "cancelled"].includes(shipment.status)) {
			throw new Error("Proof cannot be added to a completed shipment");
		}

		const proofId = await ctx.db.insert("proofs", {
			shipmentId: args.shipmentId,
			type: args.type,
			storageId: args.storageId,
			uploadedByUserId: user._id,
			visibility: "user_company_admin",
			createdAt: Date.now(),
		});

		const eventId = await createTrackingEvent(ctx, {
			shipmentId: args.shipmentId,
			bookingId: shipment.bookingId,
			companyId: shipment.companyId,
			driverId: driver._id,
			actorUserId: user._id,
			actorRole: "driver",
			eventType: "proof_uploaded",
			title: formatProofTitle(args.type),
			description: "Shipment proof was uploaded.",
			visibility: "public",
			proofIds: [proofId],
		});

		await ctx.db.patch(proofId, { trackingEventId: eventId });

		return proofId;
	},
});

export const listByShipment = query({
	args: { shipmentId: v.id("shipments") },
	handler: async (ctx, args) => {
		const { user, shipment } = await requireShipmentAccess(
			ctx,
			args.shipmentId,
		);
		const proofs = await ctx.db
			.query("proofs")
			.withIndex("by_shipment_id", (q) => q.eq("shipmentId", args.shipmentId))
			.collect();

		const member = await getCompanyMember(ctx, shipment.companyId, user._id);
		const assignedDriver = shipment.driverId
			? await ctx.db.get(shipment.driverId)
			: null;
		const isCompanyActor = member?.status === "active";
		const isAssignedDriver =
			assignedDriver?.userId === user._id && assignedDriver.status === "active";
		const isShipmentOwner = shipment.userId === user._id;

		const visibleProofs = proofs.filter((proof) => {
			if (user.isAdmin) return true;
			if (proof.visibility === "admin_only") return false;
			if (proof.visibility === "company_admin") {
				return isCompanyActor || isAssignedDriver;
			}
			return isShipmentOwner || isCompanyActor || isAssignedDriver;
		});

		return await Promise.all(
			visibleProofs.map(async (proof) => {
				const uploadedBy = await ctx.db.get(proof.uploadedByUserId);
				return {
					proof,
					uploadedBy,
					url: proof.storageId
						? await ctx.storage.getUrl(proof.storageId)
						: null,
				};
			}),
		);
	},
});

function formatProofTitle(type: string) {
	if (type === "pickup_photo") return "Pickup Proof Uploaded";
	if (type === "delivery_photo") return "Delivery Proof Uploaded";
	return "Proof Uploaded";
}
