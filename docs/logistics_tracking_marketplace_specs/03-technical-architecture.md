# Technical Architecture Specification

# Logistics Tracking Marketplace Platform

## 1. Stack

The confirmed stack is:

- Frontend: Next.js
- Backend and database: Convex
- Authentication and organizations: Clerk
- Company organizations: Clerk Organizations
- File and proof storage: Convex file storage or external object storage, depending on final scale

Recommended frontend assumptions:

- Next.js App Router
- TypeScript
- Server components where useful
- Client components for interactive dashboards and forms
- Clerk middleware for route protection
- Convex React hooks for live data

## 2. Architecture overview

The platform has four interface areas:

1. Public marketplace
2. User dashboard
3. Company dashboard
4. Driver dashboard
5. Admin dashboard

Convex is the source of truth for application data. Clerk is the source of truth for identity and organization membership.

Clerk stores:

- Authenticated users
- User identity
- Organizations
- Organization memberships
- Invitations
- Session context

Convex stores:

- App user profiles
- Companies linked to Clerk organization IDs
- Driver profiles
- Bookings
- Shipments
- Cargo details
- Tracking events
- Proof records
- Reviews
- Support tickets
- Notifications
- Admin actions
- Audit logs

## 3. Clerk integration model

## 3.1 Clerk users

Every authenticated actor starts as a Clerk user.

Convex should mirror the Clerk user into an application `users` table.

Recommended Convex user fields:

- `clerkUserId`
- `email`
- `name`
- `phone`
- `avatarUrl`
- `roleFlags`
- `status`
- `createdAt`
- `updatedAt`

Important:

Do not rely only on Clerk metadata for business logic. Store application-specific role and status in Convex so admin bans, user states, and business rules remain queryable.

## 3.2 Clerk Organizations for companies

Each company maps to one Clerk Organization.

Convex company record should include:

- `clerkOrgId`
- `ownerUserId`
- `name`
- `status`
- `verificationStatus`

The app should treat `clerkOrgId` as the identity bridge between Clerk and Convex.

## 3.3 Driver invitation

Drivers are invited through Clerk organization invitation.

When driver accepts:

1. Clerk membership is created.
2. Convex checks if user already has driver profile linked to another company.
3. If not linked, Convex creates driver profile for that company.
4. If already linked to another company, Convex blocks operational access and raises an error or admin review condition.

## 4. Authorization principles

1. Admin access is platform-level.
2. Company access requires active Clerk Organization context.
3. Company users can only access records linked to their company.
4. Drivers can only access shipments assigned to them.
5. Users can only access their own bookings, shipments, tickets, and reviews.
6. Public users can only see approved companies and public company reviews.
7. Banned users cannot create bookings, reviews, or tickets except possibly ban appeal tickets.
8. Banned companies cannot receive new bookings or assign drivers.

## 5. Recommended Convex tables

This schema is written as a conceptual data model. Adapt field syntax to Convex validators during implementation.

## 5.1 users

Purpose: application profile for every Clerk user.

Fields:

- `_id`
- `clerkUserId: string`
- `email: string`
- `name: string`
- `phone?: string`
- `avatarUrl?: string`
- `status: "active" | "suspended" | "banned"`
- `isAdmin: boolean`
- `defaultRole: "user" | "company" | "driver" | "admin"`
- `createdAt: number`
- `updatedAt: number`

Indexes:

- `by_clerk_user_id`
- `by_email`
- `by_status`

## 5.2 companies

Purpose: company profile linked to Clerk Organization.

Fields:

- `_id`
- `clerkOrgId: string`
- `ownerUserId: Id<"users">`
- `name: string`
- `legalName?: string`
- `slug: string`
- `description?: string`
- `logoStorageId?: Id<"_storage">`
- `coverImageStorageId?: Id<"_storage">`
- `contactEmail?: string`
- `phone?: string`
- `address?: string`
- `operatingRegions: string[]`
- `serviceCategories: string[]`
- `cargoCategories: string[]`
- `status: "draft" | "pending_verification" | "approved" | "rejected" | "suspended" | "banned"`
- `verificationStatus: "not_submitted" | "pending" | "approved" | "rejected"`
- `verificationNotes?: string`
- `averageRating: number`
- `reviewCount: number`
- `completedShipmentCount: number`
- `createdAt: number`
- `updatedAt: number`

Indexes:

- `by_clerk_org_id`
- `by_slug`
- `by_status`
- `by_verification_status`
- `by_owner_user_id`

## 5.3 companyMembers

Purpose: app-level member roles within a company.

Fields:

- `_id`
- `companyId: Id<"companies">`
- `userId: Id<"users">`
- `clerkOrgId: string`
- `clerkMembershipId?: string`
- `role: "owner" | "manager" | "dispatcher" | "driver"`
- `status: "active" | "invited" | "removed" | "suspended"`
- `createdAt: number`
- `updatedAt: number`

Indexes:

- `by_company_id`
- `by_user_id`
- `by_company_and_user`
- `by_role`

## 5.4 drivers

Purpose: operational driver profile. A driver belongs to one company only.

Fields:

- `_id`
- `userId: Id<"users">`
- `companyId: Id<"companies">`
- `status: "active" | "inactive" | "suspended" | "removed"`
- `phone?: string`
- `licenseNumber?: string`
- `vehicleType?: string`
- `vehiclePlate?: string`
- `vehicleCapacity?: string`
- `averageRating: number`
- `reviewCount: number`
- `completedShipmentCount: number`
- `createdAt: number`
- `updatedAt: number`

Indexes:

- `by_user_id`
- `by_company_id`
- `by_company_and_status`

Constraint:

- One active driver profile per user.
- Driver cannot be active in multiple companies.

## 5.5 bookings

Purpose: user request to book one company.

Fields:

- `_id`
- `bookingNumber: string`
- `userId: Id<"users">`
- `companyId: Id<"companies">`
- `status: "draft" | "submitted" | "pending_company_response" | "accepted" | "rejected" | "cancelled_by_user" | "cancelled_by_company" | "expired"`
- `pickupAddress: string`
- `pickupContactName?: string`
- `pickupContactPhone?: string`
- `pickupInstructions?: string`
- `destinationAddress: string`
- `destinationContactName?: string`
- `destinationContactPhone?: string`
- `destinationInstructions?: string`
- `requestedPickupDate?: number`
- `requestedDeliveryDate?: number`
- `specialInstructions?: string`
- `cargoSnapshot: object`
- `companyResponseNote?: string`
- `rejectionReason?: string`
- `cancellationReason?: string`
- `acceptedAt?: number`
- `rejectedAt?: number`
- `cancelledAt?: number`
- `createdAt: number`
- `updatedAt: number`

Indexes:

- `by_user_id`
- `by_company_id`
- `by_status`
- `by_company_and_status`
- `by_user_and_status`
- `by_booking_number`

## 5.6 cargoDetails

Purpose: detailed cargo data linked to a booking and shipment.

Fields:

- `_id`
- `bookingId: Id<"bookings">`
- `shipmentId?: Id<"shipments">`
- `category: "general_package" | "petroleum" | "agriculture" | "construction" | "housing" | "industrial" | "other"`
- `title: string`
- `description?: string`
- `quantity?: number`
- `unit?: string`
- `weightKg?: number`
- `volumeM3?: number`
- `lengthCm?: number`
- `widthCm?: number`
- `heightCm?: number`
- `declaredValue?: number`
- `currency?: string`
- `fragile: boolean`
- `hazardous: boolean`
- `requiresRefrigeration: boolean`
- `requiresSpecialHandling: boolean`
- `handlingInstructions?: string`
- `categorySpecific: object`
- `photoStorageIds?: Id<"_storage">[]`
- `createdAt: number`
- `updatedAt: number`

Indexes:

- `by_booking_id`
- `by_shipment_id`
- `by_category`

## 5.7 shipments

Purpose: operational tracking record created after booking acceptance.

Fields:

- `_id`
- `shipmentNumber: string`
- `bookingId: Id<"bookings">`
- `userId: Id<"users">`
- `companyId: Id<"companies">`
- `driverId?: Id<"drivers">`
- `status: "created" | "awaiting_driver_assignment" | "driver_assigned" | "pickup_scheduled" | "arriving_for_pickup" | "picked_up" | "in_transit" | "at_checkpoint" | "delayed" | "out_for_delivery" | "delivered" | "delivery_confirmed" | "failed_delivery" | "disputed" | "cancelled"`
- `pickupAddress: string`
- `destinationAddress: string`
- `currentStatusDescription?: string`
- `pickupProofRequired: boolean`
- `deliveryProofRequired: boolean`
- `qrConfirmationEnabled: boolean`
- `pickupConfirmedAt?: number`
- `deliveredAt?: number`
- `deliveryConfirmedAt?: number`
- `cancelledAt?: number`
- `disputedAt?: number`
- `createdAt: number`
- `updatedAt: number`

Indexes:

- `by_booking_id`
- `by_user_id`
- `by_company_id`
- `by_driver_id`
- `by_status`
- `by_company_and_status`
- `by_driver_and_status`
- `by_shipment_number`

## 5.8 trackingEvents

Purpose: append-only timeline events for shipments.

Fields:

- `_id`
- `shipmentId: Id<"shipments">`
- `bookingId: Id<"bookings">`
- `companyId: Id<"companies">`
- `driverId?: Id<"drivers">`
- `actorUserId: Id<"users">`
- `actorRole: "admin" | "user" | "company" | "driver" | "system"`
- `eventType: string`
- `previousStatus?: string`
- `newStatus?: string`
- `title: string`
- `description?: string`
- `visibility: "public" | "company" | "admin"`
- `proofIds?: Id<"proofs">[]`
- `createdAt: number`

Indexes:

- `by_shipment_id`
- `by_booking_id`
- `by_company_id`
- `by_driver_id`
- `by_created_at`

## 5.9 proofs

Purpose: proof records attached to tracking events.

Fields:

- `_id`
- `shipmentId: Id<"shipments">`
- `trackingEventId?: Id<"trackingEvents">`
- `type: "pickup_photo" | "delivery_photo" | "cargo_photo" | "document_photo" | "qr_confirmation" | "otp_confirmation" | "signature" | "receiver_name"`
- `storageId?: Id<"_storage">`
- `qrTokenId?: Id<"qrTokens">`
- `textValue?: string`
- `uploadedByUserId: Id<"users">`
- `visibility: "user_company_admin" | "company_admin" | "admin_only"`
- `createdAt: number`

Indexes:

- `by_shipment_id`
- `by_tracking_event_id`
- `by_type`

## 5.10 qrTokens

Purpose: QR or token-based confirmation.

Fields:

- `_id`
- `shipmentId: Id<"shipments">`
- `purpose: "pickup_confirmation" | "delivery_confirmation"`
- `tokenHash: string`
- `status: "active" | "used" | "expired" | "revoked"`
- `createdByUserId: Id<"users">`
- `usedByUserId?: Id<"users">`
- `expiresAt?: number`
- `usedAt?: number`
- `createdAt: number`

Indexes:

- `by_shipment_id`
- `by_token_hash`
- `by_status`

Security note:

Store a hash of the token, not the raw token. QR should encode a short URL or token that can be validated server-side.

## 5.11 reviews

Purpose: shipment-based reviews.

Fields:

- `_id`
- `shipmentId: Id<"shipments">`
- `bookingId: Id<"bookings">`
- `userId: Id<"users">`
- `companyId: Id<"companies">`
- `driverId?: Id<"drivers">`
- `rating: number`
- `comment?: string`
- `tags?: string[]`
- `status: "published" | "hidden" | "removed" | "pending_moderation"`
- `createdAt: number`
- `updatedAt: number`

Indexes:

- `by_shipment_id`
- `by_company_id`
- `by_driver_id`
- `by_user_id`
- `by_status`

Constraint:

- One review per shipment per user.

## 5.12 supportTickets

Purpose: support workflow for users, companies, drivers, and admins.

Fields:

- `_id`
- `ticketNumber: string`
- `createdByUserId: Id<"users">`
- `createdByRole: "user" | "company" | "driver" | "admin"`
- `companyId?: Id<"companies">`
- `driverId?: Id<"drivers">`
- `bookingId?: Id<"bookings">`
- `shipmentId?: Id<"shipments">`
- `subject: string`
- `category: "lost_cargo" | "damaged_cargo" | "delayed_shipment" | "driver_issue" | "company_issue" | "booking_issue" | "account_issue" | "review_issue" | "verification_issue" | "other"`
- `priority: "low" | "medium" | "high" | "urgent"`
- `status: "open" | "waiting_for_admin" | "waiting_for_user" | "waiting_for_company" | "waiting_for_driver" | "under_review" | "resolved" | "closed" | "reopened"`
- `assignedAdminId?: Id<"users">`
- `lastMessageAt?: number`
- `resolvedAt?: number`
- `closedAt?: number`
- `createdAt: number`
- `updatedAt: number`

Indexes:

- `by_ticket_number`
- `by_created_by_user_id`
- `by_company_id`
- `by_driver_id`
- `by_booking_id`
- `by_shipment_id`
- `by_status`
- `by_priority`

## 5.13 supportMessages

Purpose: threaded messages inside support tickets.

Fields:

- `_id`
- `ticketId: Id<"supportTickets">`
- `senderUserId: Id<"users">`
- `senderRole: "user" | "company" | "driver" | "admin" | "system"`
- `message: string`
- `attachmentStorageIds?: Id<"_storage">[]`
- `internalOnly: boolean`
- `createdAt: number`

Indexes:

- `by_ticket_id`
- `by_sender_user_id`

## 5.14 notifications

Purpose: in-app notifications.

Fields:

- `_id`
- `recipientUserId: Id<"users">`
- `type: string`
- `title: string`
- `body?: string`
- `relatedBookingId?: Id<"bookings">`
- `relatedShipmentId?: Id<"shipments">`
- `relatedTicketId?: Id<"supportTickets">`
- `readAt?: number`
- `createdAt: number`

Indexes:

- `by_recipient_user_id`
- `by_recipient_and_read`

## 5.15 adminActions

Purpose: audit log for admin operations.

Fields:

- `_id`
- `adminUserId: Id<"users">`
- `actionType: string`
- `targetType: "user" | "company" | "booking" | "shipment" | "review" | "ticket" | "driver"`
- `targetId: string`
- `reason?: string`
- `metadata?: object`
- `createdAt: number`

Indexes:

- `by_admin_user_id`
- `by_target_type`
- `by_target_id`
- `by_action_type`

## 6. Recommended Convex function groups

## 6.1 users

Queries:

- `getCurrentUser`
- `getUserById`
- `listUsersForAdmin`

Mutations:

- `syncCurrentUserFromClerk`
- `updateUserProfile`
- `banUser`
- `unbanUser`

## 6.2 companies

Queries:

- `listApprovedCompanies`
- `getCompanyBySlug`
- `getCompanyById`
- `getCurrentCompany`
- `listCompaniesForAdmin`
- `listPendingCompaniesForAdmin`

Mutations:

- `createCompanyFromClerkOrg`
- `updateCompanyProfile`
- `submitCompanyVerification`
- `approveCompany`
- `rejectCompany`
- `suspendCompany`
- `banCompany`

## 6.3 drivers

Queries:

- `listCompanyDrivers`
- `getDriverProfile`
- `getCurrentDriverProfile`

Mutations:

- `createDriverAfterInviteAccepted`
- `updateDriverProfile`
- `deactivateDriver`
- `removeDriver`

## 6.4 bookings

Queries:

- `listUserBookings`
- `listCompanyBookings`
- `getBookingById`
- `listBookingsForAdmin`

Mutations:

- `createBookingRequest`
- `cancelBookingByUser`
- `acceptBooking`
- `rejectBooking`
- `cancelBookingByCompany`

## 6.5 shipments

Queries:

- `listUserShipments`
- `listCompanyShipments`
- `listDriverShipments`
- `getShipmentById`
- `getShipmentTimeline`
- `listShipmentsForAdmin`

Mutations:

- `assignDriverToShipment`
- `updateShipmentStatus`
- `markPickupComplete`
- `markShipmentDelayed`
- `markDelivered`
- `confirmDeliveryByUser`
- `openShipmentDispute`

## 6.6 proofs

Queries:

- `listShipmentProofs`
- `getProofById`

Mutations:

- `generateUploadUrl`
- `attachPickupProof`
- `attachDeliveryProof`
- `createQrConfirmationToken`
- `confirmWithQrToken`

## 6.7 reviews

Queries:

- `listCompanyReviews`
- `listDriverReviews`
- `getShipmentReview`
- `listReviewsForAdmin`

Mutations:

- `createShipmentReview`
- `hideReview`
- `removeReview`
- `restoreReview`

## 6.8 support

Queries:

- `listMyTickets`
- `getTicketById`
- `listTicketsForAdmin`
- `listCompanyTickets`

Mutations:

- `createSupportTicket`
- `addSupportMessage`
- `changeTicketStatus`
- `assignTicketToAdmin`
- `closeTicket`
- `reopenTicket`

## 7. Authorization helper functions

Create helper functions for consistent security.

Suggested helpers:

- `requireAuth(ctx)`
- `requireCurrentUser(ctx)`
- `requireAdmin(ctx)`
- `requireActiveUser(ctx)`
- `requireCompanyMember(ctx, companyId)`
- `requireCompanyManager(ctx, companyId)`
- `requireDriverForCompany(ctx, companyId)`
- `requireShipmentAccess(ctx, shipmentId)`
- `requireBookingAccess(ctx, bookingId)`
- `assertCompanyApproved(company)`
- `assertUserNotBanned(user)`
- `assertCompanyNotBanned(company)`

Authorization should be enforced inside Convex functions, not only in the UI.

## 8. Status transition rules

## 8.1 Booking transitions

Allowed transitions:

- `draft` to `submitted`
- `submitted` to `pending_company_response`
- `pending_company_response` to `accepted`
- `pending_company_response` to `rejected`
- `pending_company_response` to `cancelled_by_user`
- `accepted` to `cancelled_by_user`, only before pickup
- `accepted` to `cancelled_by_company`, only before pickup

Avoid allowing arbitrary status changes from the frontend. Use specific mutations.

## 8.2 Shipment transitions

Allowed transitions:

- `created` to `awaiting_driver_assignment`
- `awaiting_driver_assignment` to `driver_assigned`
- `driver_assigned` to `pickup_scheduled`
- `pickup_scheduled` to `arriving_for_pickup`
- `arriving_for_pickup` to `picked_up`
- `driver_assigned` to `picked_up`, if skipping optional pickup states
- `picked_up` to `in_transit`
- `in_transit` to `at_checkpoint`
- `at_checkpoint` to `in_transit`
- `in_transit` to `delayed`
- `delayed` to `in_transit`
- `in_transit` to `out_for_delivery`
- `out_for_delivery` to `delivered`
- `delivered` to `delivery_confirmed`
- any active state to `disputed`, when issue reported
- pre-pickup active states to `cancelled`

Important:

- Pickup completion should require pickup proof.
- Delivery completion should require delivery proof.
- Admin override should create an admin action and tracking event.

## 9. File storage

v0.1 proof files can use Convex file storage if scale is manageable.

Files to store:

- Company logo
- Company cover image
- Cargo photos
- Pickup proof photos
- Delivery proof photos
- Support ticket attachments
- Verification documents, optional

File requirements:

- Store storage ID in Convex record.
- Store uploader ID.
- Store visibility level.
- Validate file type.
- Limit file size.
- Use signed upload URLs.

## 10. QR confirmation design

Recommended token flow:

1. Generate random token.
2. Store hashed token in `qrTokens`.
3. Encode token in QR URL.
4. When scanned, validate token hash.
5. Check token purpose and status.
6. Check token expiration.
7. Mark token as used.
8. Create proof record.
9. Create tracking event.

QR security rules:

- Tokens should be one-time use.
- Tokens should expire.
- Tokens should be scoped to shipment and purpose.
- Store token hash, not raw token.
- Do not allow QR token to bypass all proof requirements unless intended.

## 11. Admin dashboard queries

Admin dashboard should aggregate:

- Total users
- Active users
- Banned users
- Total companies
- Pending companies
- Approved companies
- Suspended companies
- Banned companies
- Total bookings
- Pending bookings
- Accepted bookings
- Rejected bookings
- Active shipments
- Completed shipments
- Disputed shipments
- Open tickets
- Urgent tickets
- Reviews pending moderation

Avoid expensive queries by storing counters where needed later. For MVP, direct queries may be acceptable if data volume is small.

## 12. Data integrity rules

- A shipment must have an accepted booking.
- A booking must have one selected company.
- A driver must belong to the shipment company.
- A review must belong to a completed shipment.
- A company must be approved to appear publicly.
- A banned user cannot create new bookings.
- A banned company cannot accept new bookings.
- Tracking events should not be deleted by normal users.
- Admin actions must be logged.

## 13. Realtime behavior

Convex supports reactive queries, so these should update in real time:

- Company incoming bookings
- Driver assigned shipments
- User shipment timeline
- Admin support tickets
- Admin pending company approvals
- Ticket messages
- Notifications

## 14. Notifications architecture

Start with in-app notifications in Convex.

Later add email notifications with a service like Resend or Clerk email templates.

Notification creation should happen inside mutations that change important states.

Examples:

- Booking submitted sends notification to company managers.
- Booking accepted sends notification to user.
- Driver assigned sends notification to driver.
- Shipment delivered sends notification to user.
- Ticket updated sends notification to relevant actor.

## 15. Security and privacy

## 15.1 Public data

Public:

- Approved company profile
- Public company ratings
- Public company reviews
- Service categories
- Operating regions

Private:

- User contact information
- Driver personal information
- Exact pickup and destination details
- Shipment proof files
- Support messages
- Admin actions

## 15.2 Route protection

Use Clerk middleware to protect dashboard routes.

Use Convex authorization for all data access.

Never rely only on hidden UI elements for permissions.

## 15.3 Ban enforcement

Banned users:

- Cannot create bookings.
- Cannot create reviews.
- Cannot create normal support tickets unless ban appeal is supported.

Banned companies:

- Hidden from marketplace.
- Cannot accept bookings.
- Cannot invite new drivers.
- Active shipments require admin review.

## 16. Suggested folder structure

```txt
app/
  (public)/
    page.tsx
    companies/
      page.tsx
      [slug]/page.tsx
  (dashboard)/
    dashboard/
      page.tsx
      bookings/
      shipments/
      support/
      profile/
    company/
      page.tsx
      profile/
      verification/
      drivers/
      bookings/
      shipments/
      support/
      reviews/
    driver/
      page.tsx
      shipments/
      support/
    admin/
      page.tsx
      users/
      companies/
      bookings/
      shipments/
      support/
      reviews/
      audit-logs/
components/
  marketplace/
  bookings/
  shipments/
  support/
  admin/
  company/
  driver/
convex/
  schema.ts
  users.ts
  companies.ts
  drivers.ts
  bookings.ts
  shipments.ts
  trackingEvents.ts
  proofs.ts
  reviews.ts
  support.ts
  notifications.ts
  admin.ts
  auth.ts
lib/
  clerk.ts
  permissions.ts
  constants.ts
  statusTransitions.ts
```

## 17. Implementation warnings

- Do not combine booking and shipment into one table.
- Do not store company identity only in Clerk metadata.
- Do not trust client-side role checks.
- Do not allow arbitrary status transitions from the UI.
- Do not let drivers query company-wide shipments.
- Do not let pending companies appear publicly.
- Do not allow reviews without completed shipments.
- Do not make maps a dependency for v0.1.
- Do not add payments before shipment lifecycle is stable.

## 18. Technical MVP checklist

- Clerk auth configured.
- Clerk organization support enabled.
- Convex user sync implemented.
- Company creation from Clerk org implemented.
- Company verification status implemented.
- Driver invite and profile sync implemented.
- Booking creation implemented.
- Booking acceptance creates shipment.
- Driver assignment implemented.
- Shipment status updates implemented.
- Tracking events created automatically.
- Photo proof upload implemented.
- Review creation implemented.
- Support ticket system implemented.
- Admin dashboard implemented.
- Authorization checks tested.
