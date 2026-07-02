import { v } from "convex/values";

export const userStatus = v.union(
	v.literal("active"),
	v.literal("suspended"),
	v.literal("banned"),
);

export const defaultRole = v.union(
	v.literal("user"),
	v.literal("company"),
	v.literal("driver"),
	v.literal("admin"),
);

export const companyStatus = v.union(
	v.literal("draft"),
	v.literal("pending_verification"),
	v.literal("approved"),
	v.literal("rejected"),
	v.literal("suspended"),
	v.literal("banned"),
);

export const verificationStatus = v.union(
	v.literal("not_submitted"),
	v.literal("pending"),
	v.literal("approved"),
	v.literal("rejected"),
);

export const companyMemberRole = v.union(
	v.literal("owner"),
	v.literal("manager"),
	v.literal("driver"),
);

export const companyInviteRole = v.union(
	v.literal("manager"),
	v.literal("driver"),
);

export const companyInviteStatus = v.union(
	v.literal("pending"),
	v.literal("accepted"),
	v.literal("declined"),
	v.literal("revoked"),
);

export const memberStatus = v.union(
	v.literal("active"),
	v.literal("invited"),
	v.literal("removed"),
	v.literal("suspended"),
);

export const driverStatus = v.union(
	v.literal("active"),
	v.literal("inactive"),
	v.literal("suspended"),
	v.literal("removed"),
);

export const bookingStatus = v.union(
	v.literal("draft"),
	v.literal("submitted"),
	v.literal("pending_company_response"),
	v.literal("accepted"),
	v.literal("rejected"),
	v.literal("cancelled_by_user"),
	v.literal("cancelled_by_company"),
	v.literal("expired"),
);

export const cargoCategory = v.union(
	v.literal("general_package"),
	v.literal("petroleum"),
	v.literal("agriculture"),
	v.literal("construction"),
	v.literal("housing"),
	v.literal("industrial"),
	v.literal("other"),
);

export const shipmentStatus = v.union(
	v.literal("created"),
	v.literal("awaiting_driver_assignment"),
	v.literal("driver_assigned"),
	v.literal("pickup_scheduled"),
	v.literal("arriving_for_pickup"),
	v.literal("picked_up"),
	v.literal("in_transit"),
	v.literal("at_checkpoint"),
	v.literal("delayed"),
	v.literal("out_for_delivery"),
	v.literal("delivered"),
	v.literal("delivery_confirmed"),
	v.literal("failed_delivery"),
	v.literal("disputed"),
	v.literal("cancelled"),
);

export const actorRole = v.union(
	v.literal("admin"),
	v.literal("user"),
	v.literal("company"),
	v.literal("driver"),
	v.literal("system"),
);

export const eventVisibility = v.union(
	v.literal("public"),
	v.literal("company"),
	v.literal("admin"),
);

export const proofType = v.union(
	v.literal("pickup_photo"),
	v.literal("delivery_photo"),
	v.literal("cargo_photo"),
	v.literal("document_photo"),
	v.literal("qr_confirmation"),
	v.literal("otp_confirmation"),
	v.literal("signature"),
	v.literal("receiver_name"),
);

export const proofVisibility = v.union(
	v.literal("user_company_admin"),
	v.literal("company_admin"),
	v.literal("admin_only"),
);

export const reviewStatus = v.union(
	v.literal("published"),
	v.literal("hidden"),
	v.literal("removed"),
	v.literal("pending_moderation"),
);

export const ticketCategory = v.union(
	v.literal("lost_cargo"),
	v.literal("damaged_cargo"),
	v.literal("delayed_shipment"),
	v.literal("driver_issue"),
	v.literal("company_issue"),
	v.literal("booking_issue"),
	v.literal("account_issue"),
	v.literal("review_issue"),
	v.literal("verification_issue"),
	v.literal("other"),
);

export const ticketPriority = v.union(
	v.literal("low"),
	v.literal("medium"),
	v.literal("high"),
	v.literal("urgent"),
);

export const ticketStatus = v.union(
	v.literal("open"),
	v.literal("waiting_for_admin"),
	v.literal("waiting_for_user"),
	v.literal("waiting_for_company"),
	v.literal("waiting_for_driver"),
	v.literal("under_review"),
	v.literal("resolved"),
	v.literal("closed"),
	v.literal("reopened"),
);

export const walletStatus = v.union(v.literal("active"), v.literal("frozen"));

export const walletOwnerType = v.union(
	v.literal("user"),
	v.literal("company"),
	v.literal("driver"),
);

export const walletTransactionType = v.union(
	v.literal("top_up"),
	v.literal("booking_hold"),
	v.literal("booking_capture"),
	v.literal("refund"),
	v.literal("adjustment"),
);

export const paymentIntentStatus = v.union(
	v.literal("pending"),
	v.literal("succeeded"),
	v.literal("failed"),
	v.literal("cancelled"),
);

export const adminAccessRequestStatus = v.union(
	v.literal("pending"),
	v.literal("approved"),
	v.literal("rejected"),
);

export const adminTargetType = v.union(
	v.literal("user"),
	v.literal("company"),
	v.literal("booking"),
	v.literal("shipment"),
	v.literal("review"),
	v.literal("ticket"),
	v.literal("driver"),
	v.literal("admin_access_request"),
);

export const geoPoint = v.object({
	lat: v.number(),
	lng: v.number(),
	displayName: v.optional(v.string()),
	source: v.union(
		v.literal("gps"),
		v.literal("search"),
		v.literal("pin"),
		v.literal("import"),
	),
	provider: v.optional(v.string()),
	providerPlaceId: v.optional(v.string()),
	accuracyMeters: v.optional(v.number()),
	capturedAt: v.optional(v.number()),
});

export const routeSnapshot = v.object({
	provider: v.string(),
	distanceMeters: v.number(),
	durationSeconds: v.number(),
	geometry: v.object({
		type: v.literal("LineString"),
		coordinates: v.array(v.array(v.number())),
	}),
});
