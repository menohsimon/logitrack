import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import {
	actorRole,
	adminAccessRequestStatus,
	adminTargetType,
	bookingStatus,
	cargoCategory,
	companyInviteRole,
	companyInviteStatus,
	companyMemberRole,
	companyStatus,
	defaultRole,
	driverStatus,
	eventVisibility,
	geoPoint,
	memberStatus,
	paymentIntentStatus,
	proofType,
	proofVisibility,
	reviewStatus,
	routeSnapshot,
	shipmentStatus,
	ticketCategory,
	ticketPriority,
	ticketStatus,
	userStatus,
	verificationStatus,
	walletOwnerType,
	walletStatus,
	walletTransactionType,
} from "./lib/validators";

export default defineSchema({
	users: defineTable({
		clerkUserId: v.string(),
		email: v.string(),
		name: v.string(),
		phone: v.optional(v.string()),
		avatarUrl: v.optional(v.string()),
		address: v.optional(v.string()),
		status: userStatus,
		isAdmin: v.boolean(),
		defaultRole: defaultRole,
		activeCompanyId: v.optional(v.id("companies")),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_clerk_user_id", ["clerkUserId"])
		.index("by_email", ["email"])
		.index("by_status", ["status"]),

	companies: defineTable({
		clerkOrgId: v.optional(v.string()),
		ownerUserId: v.id("users"),
		name: v.string(),
		legalName: v.optional(v.string()),
		slug: v.string(),
		description: v.optional(v.string()),
		logoStorageId: v.optional(v.id("_storage")),
		coverImageStorageId: v.optional(v.id("_storage")),
		contactEmail: v.optional(v.string()),
		phone: v.optional(v.string()),
		address: v.optional(v.string()),
		location: v.optional(geoPoint),
		operatingRegions: v.array(v.string()),
		serviceCategories: v.array(v.string()),
		cargoCategories: v.array(v.string()),
		status: companyStatus,
		verificationStatus: verificationStatus,
		verificationNotes: v.optional(v.string()),
		averageRating: v.number(),
		reviewCount: v.number(),
		completedShipmentCount: v.number(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_clerk_org_id", ["clerkOrgId"])
		.index("by_slug", ["slug"])
		.index("by_status", ["status"])
		.index("by_verification_status", ["verificationStatus"])
		.index("by_owner_user_id", ["ownerUserId"]),

	companyMembers: defineTable({
		companyId: v.id("companies"),
		userId: v.id("users"),
		clerkOrgId: v.optional(v.string()),
		clerkMembershipId: v.optional(v.string()),
		role: companyMemberRole,
		status: memberStatus,
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_company_id", ["companyId"])
		.index("by_user_id", ["userId"])
		.index("by_company_and_user", ["companyId", "userId"])
		.index("by_role", ["role"]),

	companyInvites: defineTable({
		companyId: v.id("companies"),
		email: v.string(),
		invitedByUserId: v.id("users"),
		role: companyInviteRole,
		driverCompensationRateBps: v.optional(v.number()),
		status: companyInviteStatus,
		acceptedByUserId: v.optional(v.id("users")),
		acceptedAt: v.optional(v.number()),
		declinedAt: v.optional(v.number()),
		revokedAt: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_company_id", ["companyId"])
		.index("by_email", ["email"])
		.index("by_company_and_email", ["companyId", "email"])
		.index("by_status", ["status"]),

	drivers: defineTable({
		userId: v.id("users"),
		companyId: v.id("companies"),
		vehicleId: v.optional(v.id("vehicles")),
		status: driverStatus,
		compensationRateBps: v.optional(v.number()),
		phone: v.optional(v.string()),
		licenseNumber: v.optional(v.string()),
		vehicleType: v.optional(v.string()),
		vehicleClass: v.optional(v.string()),
		vehicleModel: v.optional(v.string()),
		vehiclePlate: v.optional(v.string()),
		vehicleCapacityKg: v.optional(v.number()),
		averageRating: v.number(),
		reviewCount: v.number(),
		completedShipmentCount: v.number(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user_id", ["userId"])
		.index("by_company_id", ["companyId"])
		.index("by_company_and_status", ["companyId", "status"]),

	vehicles: defineTable({
		companyId: v.id("companies"),
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
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_company_id", ["companyId"])
		.index("by_company_and_status", ["companyId", "status"]),

	bookings: defineTable({
		bookingNumber: v.string(),
		userId: v.id("users"),
		companyId: v.id("companies"),
		status: bookingStatus,
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
		pickupLocation: v.optional(geoPoint),
		destinationLocation: v.optional(geoPoint),
		routeSnapshot: v.optional(routeSnapshot),
		estimatedFareCents: v.number(),
		fareCurrency: v.optional(v.string()),
		finalFareCents: v.optional(v.number()),
		cargoSnapshot: v.any(),
		companyResponseNote: v.optional(v.string()),
		rejectionReason: v.optional(v.string()),
		cancellationReason: v.optional(v.string()),
		acceptedAt: v.optional(v.number()),
		rejectedAt: v.optional(v.number()),
		cancelledAt: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user_id", ["userId"])
		.index("by_company_id", ["companyId"])
		.index("by_status", ["status"])
		.index("by_company_and_status", ["companyId", "status"])
		.index("by_user_and_status", ["userId", "status"])
		.index("by_booking_number", ["bookingNumber"]),

	cargoDetails: defineTable({
		bookingId: v.id("bookings"),
		shipmentId: v.optional(v.id("shipments")),
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
		declaredValue: v.optional(v.number()),
		currency: v.optional(v.string()),
		fragile: v.boolean(),
		hazardous: v.boolean(),
		requiresRefrigeration: v.boolean(),
		requiresSpecialHandling: v.boolean(),
		handlingInstructions: v.optional(v.string()),
		categorySpecific: v.optional(v.any()),
		photoStorageIds: v.optional(v.array(v.id("_storage"))),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_booking_id", ["bookingId"])
		.index("by_shipment_id", ["shipmentId"])
		.index("by_category", ["category"]),

	shipments: defineTable({
		shipmentNumber: v.string(),
		bookingId: v.id("bookings"),
		userId: v.id("users"),
		companyId: v.id("companies"),
		driverId: v.optional(v.id("drivers")),
		vehicleId: v.optional(v.id("vehicles")),
		status: shipmentStatus,
		pickupAddress: v.string(),
		destinationAddress: v.string(),
		pickupLocation: v.optional(geoPoint),
		destinationLocation: v.optional(geoPoint),
		routeSnapshot: v.optional(routeSnapshot),
		currentStatusDescription: v.optional(v.string()),
		pickupProofRequired: v.boolean(),
		deliveryProofRequired: v.boolean(),
		qrConfirmationEnabled: v.boolean(),
		pickupConfirmedAt: v.optional(v.number()),
		deliveredAt: v.optional(v.number()),
		deliveryConfirmedAt: v.optional(v.number()),
		userReceiptConfirmedAt: v.optional(v.number()),
		cancelledAt: v.optional(v.number()),
		disputedAt: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_booking_id", ["bookingId"])
		.index("by_user_id", ["userId"])
		.index("by_company_id", ["companyId"])
		.index("by_driver_id", ["driverId"])
		.index("by_vehicle_id", ["vehicleId"])
		.index("by_status", ["status"])
		.index("by_company_and_status", ["companyId", "status"])
		.index("by_driver_and_status", ["driverId", "status"])
		.index("by_shipment_number", ["shipmentNumber"]),

	transitSteps: defineTable({
		shipmentId: v.id("shipments"),
		companyId: v.id("companies"),
		driverId: v.optional(v.id("drivers")),
		title: v.string(),
		description: v.optional(v.string()),
		location: v.optional(v.string()),
		locationPoint: v.optional(geoPoint),
		sequence: v.number(),
		status: v.union(
			v.literal("pending"),
			v.literal("completed"),
			v.literal("skipped"),
		),
		completedAt: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_shipment_id", ["shipmentId"])
		.index("by_company_id", ["companyId"])
		.index("by_driver_id", ["driverId"]),

	shipmentLocations: defineTable({
		shipmentId: v.id("shipments"),
		companyId: v.id("companies"),
		driverId: v.id("drivers"),
		lat: v.number(),
		lng: v.number(),
		accuracyMeters: v.optional(v.number()),
		heading: v.optional(v.number()),
		speedMps: v.optional(v.number()),
		capturedAt: v.number(),
		updatedAt: v.number(),
		etaSeconds: v.optional(v.number()),
		estimatedArrivalAt: v.optional(v.number()),
		routeProvider: v.optional(v.string()),
	})
		.index("by_shipment_id", ["shipmentId"])
		.index("by_company_id", ["companyId"])
		.index("by_driver_id", ["driverId"]),

	trackingEvents: defineTable({
		shipmentId: v.id("shipments"),
		bookingId: v.id("bookings"),
		companyId: v.id("companies"),
		driverId: v.optional(v.id("drivers")),
		actorUserId: v.id("users"),
		actorRole: actorRole,
		eventType: v.string(),
		previousStatus: v.optional(v.string()),
		newStatus: v.optional(v.string()),
		title: v.string(),
		description: v.optional(v.string()),
		visibility: eventVisibility,
		proofIds: v.optional(v.array(v.id("proofs"))),
		createdAt: v.number(),
	})
		.index("by_shipment_id", ["shipmentId"])
		.index("by_booking_id", ["bookingId"])
		.index("by_company_id", ["companyId"])
		.index("by_driver_id", ["driverId"])
		.index("by_created_at", ["createdAt"]),

	proofs: defineTable({
		shipmentId: v.id("shipments"),
		trackingEventId: v.optional(v.id("trackingEvents")),
		type: proofType,
		storageId: v.optional(v.id("_storage")),
		qrTokenId: v.optional(v.id("qrTokens")),
		textValue: v.optional(v.string()),
		uploadedByUserId: v.id("users"),
		visibility: proofVisibility,
		createdAt: v.number(),
	})
		.index("by_shipment_id", ["shipmentId"])
		.index("by_tracking_event_id", ["trackingEventId"])
		.index("by_type", ["type"]),

	qrTokens: defineTable({
		shipmentId: v.id("shipments"),
		purpose: v.union(
			v.literal("pickup_confirmation"),
			v.literal("delivery_confirmation"),
		),
		tokenHash: v.string(),
		status: v.union(
			v.literal("active"),
			v.literal("used"),
			v.literal("expired"),
			v.literal("revoked"),
		),
		createdByUserId: v.id("users"),
		usedByUserId: v.optional(v.id("users")),
		expiresAt: v.optional(v.number()),
		usedAt: v.optional(v.number()),
		createdAt: v.number(),
	})
		.index("by_shipment_id", ["shipmentId"])
		.index("by_token_hash", ["tokenHash"])
		.index("by_status", ["status"]),

	reviews: defineTable({
		shipmentId: v.id("shipments"),
		bookingId: v.id("bookings"),
		userId: v.id("users"),
		companyId: v.id("companies"),
		driverId: v.optional(v.id("drivers")),
		rating: v.number(),
		comment: v.optional(v.string()),
		tags: v.optional(v.array(v.string())),
		status: reviewStatus,
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_shipment_id", ["shipmentId"])
		.index("by_company_id", ["companyId"])
		.index("by_driver_id", ["driverId"])
		.index("by_user_id", ["userId"])
		.index("by_status", ["status"]),

	supportTickets: defineTable({
		ticketNumber: v.string(),
		createdByUserId: v.id("users"),
		createdByRole: v.union(
			v.literal("user"),
			v.literal("company"),
			v.literal("driver"),
			v.literal("admin"),
		),
		companyId: v.optional(v.id("companies")),
		driverId: v.optional(v.id("drivers")),
		bookingId: v.optional(v.id("bookings")),
		shipmentId: v.optional(v.id("shipments")),
		subject: v.string(),
		category: ticketCategory,
		priority: ticketPriority,
		status: ticketStatus,
		assignedAdminId: v.optional(v.id("users")),
		lastMessageAt: v.optional(v.number()),
		resolvedAt: v.optional(v.number()),
		closedAt: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_ticket_number", ["ticketNumber"])
		.index("by_created_by_user_id", ["createdByUserId"])
		.index("by_company_id", ["companyId"])
		.index("by_driver_id", ["driverId"])
		.index("by_booking_id", ["bookingId"])
		.index("by_shipment_id", ["shipmentId"])
		.index("by_status", ["status"])
		.index("by_priority", ["priority"]),

	supportMessages: defineTable({
		ticketId: v.id("supportTickets"),
		senderUserId: v.id("users"),
		senderRole: v.union(
			v.literal("user"),
			v.literal("company"),
			v.literal("driver"),
			v.literal("admin"),
			v.literal("system"),
		),
		message: v.string(),
		attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
		internalOnly: v.boolean(),
		createdAt: v.number(),
	})
		.index("by_ticket_id", ["ticketId"])
		.index("by_sender_user_id", ["senderUserId"]),

	notifications: defineTable({
		recipientUserId: v.id("users"),
		type: v.string(),
		title: v.string(),
		body: v.optional(v.string()),
		relatedBookingId: v.optional(v.id("bookings")),
		relatedShipmentId: v.optional(v.id("shipments")),
		relatedTicketId: v.optional(v.id("supportTickets")),
		relatedCompanyInviteId: v.optional(v.id("companyInvites")),
		readAt: v.optional(v.number()),
		createdAt: v.number(),
	})
		.index("by_recipient_user_id", ["recipientUserId"])
		.index("by_recipient_and_read", ["recipientUserId", "readAt"])
		.index("by_related_company_invite_id", ["relatedCompanyInviteId"]),

	adminAccessRequests: defineTable({
		userId: v.id("users"),
		clerkUserId: v.string(),
		email: v.string(),
		name: v.string(),
		avatarUrl: v.optional(v.string()),
		approved: v.boolean(),
		status: adminAccessRequestStatus,
		reviewedByUserId: v.optional(v.id("users")),
		rejectionReason: v.optional(v.string()),
		requestedAt: v.number(),
		reviewedAt: v.optional(v.number()),
	})
		.index("by_user_id", ["userId"])
		.index("by_clerk_user_id", ["clerkUserId"])
		.index("by_status", ["status"])
		.index("by_approved", ["approved"]),

	adminActions: defineTable({
		adminUserId: v.id("users"),
		actionType: v.string(),
		targetType: adminTargetType,
		targetId: v.string(),
		reason: v.optional(v.string()),
		metadata: v.optional(v.any()),
		createdAt: v.number(),
	})
		.index("by_admin_user_id", ["adminUserId"])
		.index("by_target_type", ["targetType"])
		.index("by_target_id", ["targetId"])
		.index("by_action_type", ["actionType"]),

	wallets: defineTable({
		ownerType: v.optional(walletOwnerType),
		userId: v.optional(v.id("users")),
		companyId: v.optional(v.id("companies")),
		driverId: v.optional(v.id("drivers")),
		balanceCents: v.number(),
		currency: v.string(),
		status: walletStatus,
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user_id", ["userId"])
		.index("by_owner_user", ["ownerType", "userId"])
		.index("by_owner_company", ["ownerType", "companyId"])
		.index("by_owner_driver", ["ownerType", "driverId"]),

	walletTransactions: defineTable({
		walletId: v.id("wallets"),
		userId: v.id("users"),
		type: walletTransactionType,
		amountCents: v.number(),
		balanceAfterCents: v.number(),
		description: v.string(),
		bookingId: v.optional(v.id("bookings")),
		shipmentId: v.optional(v.id("shipments")),
		paymentIntentId: v.optional(v.id("paymentIntents")),
		createdAt: v.number(),
	})
		.index("by_wallet_id", ["walletId"])
		.index("by_user_id", ["userId"])
		.index("by_booking_id", ["bookingId"]),

	paymentIntents: defineTable({
		userId: v.id("users"),
		walletId: v.id("wallets"),
		amountCents: v.number(),
		currency: v.string(),
		provider: v.string(),
		status: paymentIntentStatus,
		purpose: v.union(v.literal("top_up"), v.literal("booking_payment")),
		bookingId: v.optional(v.id("bookings")),
		metadata: v.optional(v.any()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user_id", ["userId"])
		.index("by_status", ["status"]),
});
