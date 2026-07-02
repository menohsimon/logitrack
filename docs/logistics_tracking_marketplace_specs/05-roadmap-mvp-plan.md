# MVP Roadmap and Implementation Plan

# Logistics Tracking Marketplace Platform

## 1. Build strategy

The best strategy is to build the platform in layers:

1. Identity and roles
2. Company onboarding and verification
3. Marketplace browsing
4. Booking request flow
5. Shipment tracking flow
6. Proof and timeline
7. Reviews and ratings
8. Support tickets
9. Admin controls
10. v0.2 enhancements

Do not start with maps or payments. The core product needs to prove that users can book companies, companies can execute shipments, and the system can track responsibility through events and proof.

## 2. MVP definition

The MVP is successful when:

- A company can create an organization and submit for approval.
- Admin can approve the company.
- User can browse approved companies.
- User can create a booking request for one company.
- Company can accept booking.
- Shipment is created after acceptance.
- Company can assign driver.
- Driver can update shipment status.
- Driver can upload pickup and delivery proof.
- User can track shipment timeline.
- User can confirm delivery.
- User can review completed shipment.
- Any actor can open support ticket.
- Admin can manage users, companies, bookings, shipments, and tickets.

## 3. Phase 0: Project setup

Goal:

Prepare the application foundation.

Tasks:

- Initialize Next.js app.
- Configure TypeScript.
- Configure Clerk.
- Configure Convex.
- Configure environment variables.
- Configure basic route groups.
- Configure app layout.
- Configure protected routes.
- Set up UI component system.
- Set up basic dashboard shell.

Deliverables:

- App boots locally.
- Clerk sign-in works.
- Convex connection works.
- Protected dashboard route works.

Acceptance criteria:

- Authenticated users can access dashboard.
- Unauthenticated users are redirected to sign in.
- Convex functions can read current user identity.

## 4. Phase 1: User sync and role foundation

Goal:

Create the identity bridge between Clerk and Convex.

Tasks:

- Create Convex `users` table.
- Implement user sync mutation.
- Add current user query.
- Add user status fields.
- Add admin flag.
- Add ban enforcement helper.
- Create permission helper utilities.

Deliverables:

- Convex user profile exists for each Clerk user.
- Admin and non-admin roles can be differentiated.
- Banned user logic is defined.

Acceptance criteria:

- New signed-in user gets Convex profile.
- Admin-only function rejects normal users.
- Banned user cannot create restricted records.

## 5. Phase 2: Company organization and verification

Goal:

Allow companies to exist as Clerk Organizations and require admin approval before marketplace visibility.

Tasks:

- Enable Clerk Organizations.
- Create `companies` table.
- Create company profile page.
- Link company to Clerk organization ID.
- Add company status and verification fields.
- Create company verification submission mutation.
- Create admin company approval page.
- Implement approve, reject, suspend, and ban actions.

Deliverables:

- Company can create profile.
- Company can submit for verification.
- Admin can approve or reject.
- Approved company appears publicly.

Acceptance criteria:

- Pending company is not public.
- Approved company is public.
- Banned company is not public and cannot receive bookings.
- Admin action is logged.

## 6. Phase 3: Driver invitation and management

Goal:

Allow companies to invite and manage drivers.

Tasks:

- Use Clerk organization invitation flow.
- Create `companyMembers` table.
- Create `drivers` table.
- Create driver management UI.
- Implement driver profile creation after invite acceptance.
- Enforce one-company-per-driver rule.
- Add driver status management.

Deliverables:

- Company can invite driver.
- Driver can accept invite.
- Driver appears in company drivers list.
- Driver dashboard exists.

Acceptance criteria:

- Driver belongs to one company only.
- Company cannot manage drivers from another company.
- Driver cannot see shipments from another company.

## 7. Phase 4: Public marketplace and company profiles

Goal:

Let users browse approved companies and start booking.

Tasks:

- Build `/companies` page.
- Build company search and filters.
- Build public company profile page.
- Show rating summary.
- Show service categories.
- Show operating regions.
- Add book button.

Deliverables:

- Public marketplace page.
- Public company profile page.

Acceptance criteria:

- Only approved companies appear.
- User can open company profile.
- User can start booking from profile.

## 8. Phase 5: Booking request flow

Goal:

Let users request transport from one company.

Tasks:

- Create `bookings` table.
- Create `cargoDetails` table.
- Build booking form.
- Add cargo category fields.
- Add pickup and destination fields.
- Add timing fields.
- Add booking summary step.
- Add company booking inbox.
- Add accept and reject mutations.

Deliverables:

- User booking form.
- Company booking management page.
- Booking status lifecycle.

Acceptance criteria:

- User can submit booking to selected company.
- Company can accept booking.
- Company can reject booking with reason.
- Rejected booking does not create shipment.
- Accepted booking creates shipment.

## 9. Phase 6: Shipment lifecycle and driver assignment

Goal:

Create operational shipment flow after booking acceptance.

Tasks:

- Create `shipments` table.
- Create `trackingEvents` table.
- Implement shipment creation on booking acceptance.
- Add company shipment list.
- Add shipment detail page.
- Add driver assignment mutation.
- Add driver assigned shipments page.
- Add tracking timeline UI.

Deliverables:

- Shipment detail page.
- Company shipment management.
- Driver assignment.
- User shipment tracking page.

Acceptance criteria:

- Accepted booking creates shipment.
- Company can assign active driver.
- Driver sees assigned shipment.
- User sees shipment timeline.
- Status changes create tracking events.

## 10. Phase 7: Proof of pickup and delivery

Goal:

Add evidence to key shipment events.

Tasks:

- Create `proofs` table.
- Implement upload URL generation.
- Add pickup proof upload.
- Add delivery proof upload.
- Attach proof to tracking event.
- Enforce proof before picked up and delivered statuses.
- Add proof viewer to shipment timeline.

Deliverables:

- Pickup proof upload.
- Delivery proof upload.
- Proof displayed in timeline.

Acceptance criteria:

- Driver cannot mark picked up without pickup proof, unless override is allowed.
- Driver cannot mark delivered without delivery proof, unless override is allowed.
- User can view proof for own shipment.
- Admin can view all proof.

## 11. Phase 8: QR confirmation

Goal:

Add optional stronger confirmation for pickup or delivery.

Recommended scope:

Add QR confirmation for delivery first.

Tasks:

- Create `qrTokens` table.
- Generate token for shipment confirmation.
- Render QR code in user shipment page or driver page, based on chosen flow.
- Validate QR token.
- Create proof record from QR confirmation.
- Create tracking event.
- Expire or mark token as used.

Deliverables:

- Optional QR delivery confirmation.

Acceptance criteria:

- QR token is one-time use.
- Used QR token cannot be reused.
- QR confirmation creates proof event.
- QR confirmation links to shipment.

## 12. Phase 9: Reviews and ratings

Goal:

Let users review completed shipments and build marketplace trust.

Tasks:

- Create `reviews` table.
- Add review form after delivery confirmation.
- Enforce one review per shipment.
- Calculate company average rating.
- Optionally calculate driver average rating.
- Build company review display.
- Build admin review moderation page.

Deliverables:

- Review form.
- Company rating summary.
- Public company reviews.
- Admin moderation.

Acceptance criteria:

- User cannot review incomplete shipment.
- User cannot review same shipment twice.
- Published review affects company rating.
- Admin can hide or remove review.

## 13. Phase 10: Support ticket system

Goal:

Provide support workflow that reaches admins.

Tasks:

- Create `supportTickets` table.
- Create `supportMessages` table.
- Build ticket creation form.
- Link tickets to bookings or shipments.
- Build actor ticket inbox.
- Build admin ticket inbox.
- Add ticket status changes.
- Add ticket priority.
- Add internal admin notes.

Deliverables:

- Support ticket creation.
- Ticket messages.
- Admin support dashboard.

Acceptance criteria:

- User can open ticket.
- Company can open ticket.
- Driver can open ticket.
- Admin can view all tickets.
- Admin can reply and close tickets.
- Ticket can link to shipment.

## 14. Phase 11: Admin dashboard

Goal:

Give admins marketplace control.

Tasks:

- Build admin dashboard overview.
- Add stats cards.
- Add user management.
- Add company management.
- Add booking and shipment viewer.
- Add support ticket dashboard.
- Add review moderation.
- Add ban and unban actions.
- Add audit log page.

Deliverables:

- Full admin dashboard.

Acceptance criteria:

- Admin can see total bookings.
- Admin can ban users.
- Admin can ban companies.
- Admin can approve companies.
- Admin can manage tickets.
- Admin can view audit logs.

## 15. Phase 12: Notifications

Goal:

Notify actors when important events happen.

Tasks:

- Create `notifications` table.
- Create notification component.
- Add unread count.
- Trigger notifications from major mutations.

Notification triggers:

- Company submitted for approval
- Company approved or rejected
- Driver invited
- Booking submitted
- Booking accepted or rejected
- Driver assigned
- Shipment picked up
- Shipment delivered
- Delivery confirmed
- Ticket updated
- Review received

Deliverables:

- In-app notifications.

Acceptance criteria:

- Relevant actor gets notification after important event.
- User can mark notifications as read.

## 16. Suggested first build order for Codex

Give Codex small, controlled tasks in this order:

1. Create Convex schema for users, companies, drivers, bookings, shipments, tracking events, proofs, reviews, tickets, notifications, and admin actions.
2. Implement auth helpers and current user sync.
3. Implement company creation from Clerk Organization.
4. Implement company verification workflow.
5. Implement admin company approval UI.
6. Implement marketplace company list.
7. Implement booking form.
8. Implement company booking inbox.
9. Implement accept booking and create shipment.
10. Implement driver assignment.
11. Implement shipment timeline.
12. Implement proof upload.
13. Implement review flow.
14. Implement support tickets.
15. Implement admin dashboard metrics.

## 17. MVP acceptance test scenarios

## 17.1 Company verification test

1. Create company organization.
2. Fill company profile.
3. Submit for verification.
4. Confirm company does not appear publicly.
5. Admin approves company.
6. Confirm company appears publicly.

## 17.2 Booking test

1. User opens approved company profile.
2. User creates booking request.
3. Company sees request.
4. Company accepts request.
5. Shipment is created.

## 17.3 Driver assignment test

1. Company invites driver.
2. Driver accepts invite.
3. Company assigns driver to shipment.
4. Driver sees assigned shipment.

## 17.4 Shipment tracking test

1. Driver uploads pickup proof.
2. Shipment status becomes picked up.
3. Timeline updates.
4. Driver uploads delivery proof.
5. Shipment status becomes delivered.
6. User confirms delivery.
7. Shipment status becomes delivery confirmed.

## 17.5 Review test

1. User opens completed shipment.
2. User submits review.
3. Company rating updates.
4. Review appears on company profile.

## 17.6 Support ticket test

1. User opens ticket linked to shipment.
2. Admin sees ticket.
3. Admin replies.
4. User replies.
5. Admin closes ticket.

## 17.7 Ban test

1. Admin bans user.
2. Banned user cannot create booking.
3. Admin bans company.
4. Banned company disappears from marketplace.
5. Banned company cannot accept bookings.

## 18. v0.2 roadmap

## 18.1 Payments

Possible payment models:

- Pay outside app, track only.
- Pay through platform at booking acceptance.
- Pay on delivery.
- Platform commission.
- Escrow-like hold until delivery confirmation.

Recommended path:

Add payments only after shipment lifecycle, proof, and support are stable.

## 18.2 Maps and live tracking

Features:

- Pickup and destination coordinates.
- Driver live location.
- Route path.
- ETA.
- Geofence pickup and delivery.
- Driver location history.

Risks:

- Battery usage.
- Background location permission.
- Map provider cost.
- Driver privacy.
- GPS inaccuracy.

Recommended path:

Start with static pickup and destination map, then add live location later.

## 18.3 Advanced marketplace

Features:

- Favorite companies
- Repeat booking
- Company subscriptions
- Sponsored listings
- Advanced search
- Business accounts
- Multi-stop transport
- Quote requests

## 19. Backlog

## 19.1 High priority

- Company verification
- Booking flow
- Shipment timeline
- Driver assignment
- Proof upload
- Support tickets
- Admin bans
- Reviews

## 19.2 Medium priority

- QR confirmation
- Notifications
- Review moderation
- Company analytics
- Driver performance stats
- Better cargo templates

## 19.3 Low priority

- Public tracking link
- Multi-stop shipments
- Advanced reports
- Company subscription plans
- In-app chat
- Payment integration
- Map path tracing

## 20. Recommended MVP cut if time is limited

If the build becomes too large, keep these features:

- Clerk auth
- Companies with approval
- Marketplace browse
- Booking request
- Booking accept/reject
- Shipment creation
- Driver assignment
- Status timeline
- Pickup and delivery photo proof
- Support ticket
- Admin company and user bans

Delay these:

- QR confirmation
- Driver ratings
- Advanced filters
- Notifications
- Review moderation details
- Admin analytics beyond basic counts

## 21. Final implementation advice

The most important technical decision is to keep these concepts separate:

- Company identity and organization
- Booking request
- Operational shipment
- Tracking event
- Proof record
- Review
- Support ticket

This separation gives the product enough structure to grow into payments, maps, route tracing, ETA, disputes, and commissions without rewriting the foundation.
