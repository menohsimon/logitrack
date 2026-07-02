# Product Requirements Document

# Logistics Tracking Marketplace Platform

## 1. Product summary

The product is a transport and shipment tracking marketplace. It allows users to browse verified transport companies, request bookings, and track shipment progress from booking to delivery. The main value proposition is trust, accountability, and operational traceability for shipping, delivery, and transport services.

The platform is not only for small parcel delivery. It should support broader transport needs such as petroleum products, agricultural goods, construction materials, housing-related goods, industrial goods, and other cargo categories. Most early companies are expected to be shipping or transport companies, but the data model must remain flexible enough for different transport types.

The first version is not a live GPS tracking app. It is a marketplace and status-based shipment tracking platform. Maps, ETA, path tracing, and driver live location are planned for v0.2.

## 2. Problem statement

Shipping and delivery companies want to reduce lost goods, disputes, and operational uncertainty. Clients want confidence that their package or cargo is being handled properly and that they can see what is happening at every important stage.

Current transport workflows often rely on calls, WhatsApp messages, manual confirmation, handwritten notes, and inconsistent updates. When delays, loss, damage, or disputes happen, both the client and the company may lack a clear timeline of responsibility.

This platform solves that by creating a structured booking, shipment, tracking, proof, review, and support workflow.

## 3. Primary goals

### Business goals

- Create a trusted marketplace for transport and shipping companies.
- Give users a simple way to discover and book verified companies.
- Give companies tools to manage drivers, bookings, and shipment updates.
- Give drivers a simple interface to update assigned shipments.
- Give admins control over trust, moderation, bans, company approval, and support.
- Build a foundation for v0.2 payments and map-based tracking.

### Product goals

- Make every shipment traceable through a status timeline.
- Reduce disputes by collecting proof at pickup and delivery.
- Increase confidence through reviews, ratings, and company verification.
- Support multiple cargo categories without hardcoding the product around small parcels.
- Keep v0.1 lean enough to build quickly with Next.js, Convex, and Clerk.

## 4. Non-goals for v0.1

The following are intentionally excluded from v0.1:

- Online payments
- Escrow
- Wallets
- Company commissions
- Real-time GPS tracking
- Path tracing
- ETA calculation
- In-app route optimization
- Driver background location tracking
- Complex multi-company bidding
- Multi-company quotes for one request
- Full insurance claims handling

These can be added later without changing the core product architecture if the booking, shipment, tracking event, proof, review, and support models are separated correctly.

## 5. Actors

## 5.1 Admin

The Admin represents the platform operator. Admins are responsible for managing marketplace trust, user safety, company approval, and support.

Admin capabilities:

- View dashboard statistics.
- View total bookings.
- View users.
- Ban or unban users.
- View companies.
- Approve, reject, suspend, or ban companies.
- View drivers.
- View bookings and shipments.
- View reviews and reports.
- Moderate abusive or fraudulent content.
- Manage support tickets.
- Assign ticket status and resolution.
- View audit logs of sensitive actions.

## 5.2 User

The User is the client who needs a transport or shipping service.

User capabilities:

- Create an account.
- Browse approved companies.
- Filter companies by category, service type, location, rating, or availability.
- View company profiles.
- Create booking requests.
- Add detailed cargo information.
- Track shipment progress after booking acceptance.
- View proof of pickup and delivery where permitted.
- Confirm delivery.
- Rate and review completed shipments.
- Open support tickets.
- Report problems.

## 5.3 Company

The Company is a transport or shipping service provider. Each company must be represented as a Clerk Organization.

Company capabilities:

- Create or join a Clerk Organization.
- Complete company profile.
- Submit company for platform approval.
- Invite drivers.
- Manage drivers.
- View incoming booking requests.
- Accept or reject booking requests.
- Assign accepted bookings to drivers.
- Create shipment records after acceptance.
- Update shipment details.
- View company reviews and ratings.
- Open or respond to support tickets related to company operations.

## 5.4 Driver

The Driver is an operational user invited by a company. Drivers belong to one company only.

Driver capabilities:

- Accept company invitation.
- Access assigned shipments.
- View pickup and delivery information.
- Update shipment status.
- Upload proof photos.
- Scan or display QR codes where enabled.
- Mark pickup complete.
- Mark delivery complete.
- Report shipment issues.
- Open support tickets.

## 6. User personas

## 6.1 Individual client

An individual wants to send a package or goods from one location to another. They care about price, reliability, communication, and knowing whether the package has been picked up and delivered.

## 6.2 Business client

A small or medium business wants recurring transport for inventory, agricultural products, supplies, or customer deliveries. They care about reliability, proof, accountability, and repeatability.

## 6.3 Transport company manager

A company manager wants to receive bookings, assign drivers, and maintain a strong rating. They need visibility into bookings and driver execution.

## 6.4 Driver

A driver wants to know exactly what shipment is assigned, where to pick up, where to deliver, and how to prove completion.

## 6.5 Platform admin

An admin wants to keep the marketplace trustworthy by approving legitimate companies, banning bad actors, resolving support tickets, and monitoring system activity.

## 7. Product principles

1. Tracking should be event-based before it becomes map-based.
2. Bookings and shipments must be separate concepts.
3. Companies must be verified before appearing publicly.
4. Drivers must be linked to exactly one company.
5. Reviews should be tied to real completed shipments.
6. Proof is central to trust.
7. The cargo model must support multiple industries.
8. Admins must have enough visibility to manage trust and disputes.
9. v0.1 must avoid unnecessary complexity from payments and live maps.
10. The system should be designed so v0.2 can add maps and payments cleanly.

## 8. Core entities

## 8.1 Booking

A booking is the user's request to hire a company for a transport job. It represents commercial intent and request details.

Booking responsibilities:

- Capture who requested the transport.
- Capture which company was selected.
- Capture pickup and destination information.
- Capture cargo details.
- Capture requested pickup date and delivery preferences.
- Track whether the company accepted or rejected the request.
- Store cancellation or rejection reason.

Booking statuses:

- Draft
- Submitted
- Pending company response
- Accepted
- Rejected
- Cancelled by user
- Cancelled by company
- Expired

## 8.2 Shipment

A shipment is the operational tracking record created after a company accepts a booking. It represents the real movement of goods.

Shipment responsibilities:

- Link to the accepted booking.
- Link to the company.
- Link to the assigned driver.
- Store shipment status.
- Store pickup and delivery proof.
- Store tracking events.
- Store completion confirmation.
- Become the source for reviews.

Shipment statuses:

- Created
- Awaiting driver assignment
- Driver assigned
- Pickup scheduled
- Arriving for pickup
- Picked up
- In transit
- At checkpoint
- Delayed
- Out for delivery
- Delivered
- Delivery confirmed
- Failed delivery
- Disputed
- Cancelled

## 8.3 TrackingEvent

A tracking event is an immutable or semi-immutable status update in the shipment timeline.

Tracking event examples:

- Booking accepted
- Driver assigned
- Pickup scheduled
- Driver arrived at pickup
- Cargo picked up
- Cargo in transit
- Cargo reached checkpoint
- Delivery delayed
- Cargo delivered
- Delivery confirmed by user
- Issue reported

Each tracking event should capture:

- Shipment ID
- Event type
- Actor type
- Actor ID
- Previous status
- New status
- Timestamp
- Description
- Proof attachments where applicable
- Internal notes where applicable

## 8.4 Proof

Proof is evidence attached to important shipment events.

Proof types:

- Pickup photo
- Delivery photo
- Cargo photo
- Document photo
- QR code confirmation
- OTP confirmation, optional future alternative
- Signature, optional future alternative
- Receiver name
- Timestamp
- Location metadata in v0.2

## 8.5 Review

A review is only created after shipment completion.

Review responsibilities:

- Link to shipment.
- Link to user.
- Link to company.
- Optionally link to driver.
- Store rating.
- Store comment.
- Store moderation status.
- Contribute to company average rating.
- Optionally contribute to driver average rating.

## 8.6 SupportTicket

A support ticket is a structured support request that reaches admins.

Ticket responsibilities:

- Allow any actor to request help.
- Link to booking or shipment when relevant.
- Capture issue category.
- Capture priority.
- Capture messages.
- Track admin response and resolution.

Ticket statuses:

- Open
- Waiting for admin
- Waiting for user
- Waiting for company
- Waiting for driver
- Under review
- Resolved
- Closed
- Reopened

## 9. v0.1 feature scope

## 9.1 Authentication and identity

Requirements:

- Users authenticate with Clerk.
- Companies are represented as Clerk Organizations.
- Company managers operate within an organization context.
- Drivers are invited by companies.
- Admin role is managed separately from normal marketplace roles.
- Convex stores application-specific user profiles and role metadata.

Acceptance criteria:

- A user can sign up and sign in.
- A company can create an organization.
- A company can invite a driver.
- A driver can accept an invitation.
- A driver cannot belong to more than one company.
- Admin-only routes are inaccessible to non-admins.

## 9.2 Company onboarding and verification

Requirements:

- Company creates or joins a Clerk Organization.
- Company completes profile.
- Company submits verification request.
- Admin approves, rejects, suspends, or bans company.
- Only approved companies appear in marketplace browsing.

Company profile fields:

- Company name
- Legal name, if different
- Logo
- Cover image
- Description
- Service categories
- Transport categories
- Operating regions
- Contact email
- Phone number
- Business address
- Verification documents, optional for v0.1
- Approval status
- Rating summary

Acceptance criteria:

- Pending companies are not visible publicly.
- Approved companies are visible publicly.
- Suspended or banned companies cannot receive new bookings.
- Admin can change verification status.

## 9.3 Company browsing

Requirements:

- Users can browse approved companies.
- Users can filter by service category, location, rating, or cargo category.
- Users can view company profile before booking.

Company card should show:

- Logo
- Name
- Short description
- Rating
- Number of completed shipments
- Service categories
- Operating regions
- Verification badge

Acceptance criteria:

- Only approved companies appear.
- Clicking a company opens its public profile.
- User can start booking from company profile.

## 9.4 Booking request

Requirements:

- User selects a company.
- User fills pickup and destination details.
- User fills cargo details.
- User chooses requested pickup date and optional delivery deadline.
- User submits booking request.
- Company receives request.

Booking form sections:

- Contact details
- Pickup details
- Destination details
- Cargo details
- Timing details
- Special instructions
- Confirmation summary

Acceptance criteria:

- User can submit a booking request to one company.
- Company can view incoming booking requests.
- Booking starts with pending company response status.

## 9.5 Company booking management

Requirements:

- Company can view booking requests.
- Company can accept or reject.
- Company can optionally add a note to the response.
- On acceptance, a shipment is created.
- Company can assign driver after acceptance.

Acceptance criteria:

- Rejected booking does not create shipment.
- Accepted booking creates shipment.
- Shipment is linked to booking, user, company, and later driver.

## 9.6 Driver management

Requirements:

- Company invites driver by email through Clerk organization invitation.
- Driver accepts invite.
- Driver profile is linked to company.
- Company can activate, deactivate, or remove driver.
- Driver belongs to one company only.

Driver profile fields:

- Name
- Email
- Phone
- Company ID
- Status
- License number, optional
- Vehicle details, optional
- Average rating, optional
- Completed shipments count

Acceptance criteria:

- Company can invite drivers.
- Company can only manage its own drivers.
- Driver cannot see another company's shipments.

## 9.7 Shipment tracking

Requirements:

- Shipment is created after booking acceptance.
- Company assigns driver.
- Driver and company can create tracking events.
- User can view tracking timeline.
- Critical events can require proof.

Acceptance criteria:

- User sees timeline updates.
- Driver sees only assigned shipments.
- Company sees all shipments for its organization.
- Tracking event history is preserved.

## 9.8 Proof of pickup and delivery

Requirements:

- Pickup can be confirmed with photo proof.
- Delivery can be confirmed with photo proof and/or QR code.
- QR code can represent shipment confirmation token.
- User or receiver may scan or present QR code depending on final UX choice.

Recommended v0.1 approach:

- Use photo proof as the required baseline.
- Use QR confirmation as an optional stronger verification method.
- Store proof on the specific tracking event.

Acceptance criteria:

- Driver can upload pickup proof.
- Driver can upload delivery proof.
- Proof is linked to shipment and event.
- User can see proof after delivery where privacy rules allow.

## 9.9 Reviews and ratings

Requirements:

- Reviews can only be created for completed shipments.
- Each shipment can receive one user review.
- Review contributes to company rating.
- Review may optionally contribute to driver rating.
- Admin can hide or moderate abusive reviews.

Review fields:

- Shipment ID
- User ID
- Company ID
- Driver ID, optional
- Rating from 1 to 5
- Review text
- Tags, optional
- Moderation status

Acceptance criteria:

- User cannot review before shipment completion.
- User cannot review the same shipment twice.
- Company rating updates after published review.

## 9.10 Support ticket system

Requirements:

- Users, companies, and drivers can open support tickets.
- Tickets reach admin dashboard.
- Tickets can be linked to bookings or shipments.
- Admin can respond, change status, assign priority, and close tickets.

Ticket categories:

- Lost cargo
- Damaged cargo
- Delayed shipment
- Driver issue
- Company issue
- Booking issue
- Account issue
- Review issue
- Verification issue
- Other

Acceptance criteria:

- Any authenticated actor can create a ticket.
- Admin can see all tickets.
- Actors can see their own tickets.
- Admin can resolve and close tickets.

## 9.11 Admin dashboard

Requirements:

- Admin sees key marketplace metrics.
- Admin can manage users.
- Admin can manage companies.
- Admin can approve or ban companies.
- Admin can ban users.
- Admin can view bookings and shipments.
- Admin can manage tickets.
- Admin can moderate reviews.

Dashboard metrics:

- Total users
- Total companies
- Pending companies
- Approved companies
- Banned companies
- Total bookings
- Total accepted bookings
- Total rejected bookings
- Active shipments
- Completed shipments
- Open support tickets
- Average platform rating

Acceptance criteria:

- Admin can ban user.
- Admin can ban company.
- Admin can see total bookings.
- Admin can approve company.
- Admin can resolve support tickets.

## 10. v0.2 feature candidates

Payments:

- Online payment for bookings
- Payment on acceptance
- Payment on delivery
- Platform commission
- Refunds
- Dispute-based payment hold

Maps:

- Pickup and delivery map display
- Driver live location
- Path tracing
- ETA
- Route history
- Geofence confirmation

Advanced marketplace:

- Favorite companies
- Repeat bookings
- Company subscription plans
- Sponsored company listings
- Quote requests
- Business accounts
- Multi-stop shipments

## 11. Success metrics

Product metrics:

- Number of approved companies
- Number of active companies
- Number of booking requests
- Booking acceptance rate
- Shipment completion rate
- Support ticket rate per shipment
- Average company rating
- Repeat user booking rate
- Average response time from company
- Average ticket resolution time

Operational metrics:

- Number of delayed shipments
- Number of disputed shipments
- Number of proof uploads
- Number of cancelled bookings
- Number of banned users or companies

## 12. Risks and mitigations

## 12.1 Fake or low-quality companies

Risk: Users lose trust if unverified or unreliable companies appear.

Mitigation:

- Require admin approval before marketplace visibility.
- Add verified badge.
- Use ratings and reviews tied to completed shipments.
- Allow user reports and support tickets.

## 12.2 Drivers failing to update statuses

Risk: Tracking timeline becomes stale.

Mitigation:

- Make the driver dashboard simple.
- Use required next-action buttons.
- Show company dashboard alerts for stale shipments.
- Add reminders in future versions.

## 12.3 Disputes without proof

Risk: User and company disagree on pickup or delivery.

Mitigation:

- Require photo proof for pickup and delivery.
- Add QR or OTP confirmation.
- Store timestamps on every event.
- Add support ticket workflow.

## 12.4 Cargo category complexity

Risk: Petroleum, agriculture, and construction transport have different data needs.

Mitigation:

- Use a flexible cargo details model.
- Store common fields plus category-specific details.
- Avoid making separate hardcoded shipment types too early.

## 12.5 v0.1 becoming too complex

Risk: Live maps and payments slow down the first release.

Mitigation:

- Keep v0.1 status-based.
- Exclude payments.
- Design schemas so maps and payments can be added later.

## 13. Open decisions

The product direction is mostly clear. Remaining choices:

1. Should QR confirmation be required for delivery, or optional?
2. Should delivery confirmation be done by the user account, receiver name, QR scan, photo proof, or a combination?
3. Should admins manually create the first company manager, or can companies self-register and wait for approval?
4. Should companies be allowed to reject bookings without giving a reason?
5. Should users be able to cancel after company acceptance?
6. Should cancellation rules be strict in v0.1, or left simple until payments are added?

## 14. Recommended v0.1 stance on open decisions

Recommended defaults:

- Company self-registration is allowed, but public visibility requires admin approval.
- QR confirmation is optional in v0.1.
- Photo proof is required for pickup and delivery.
- Companies can reject bookings but must select a basic reason.
- Users can cancel before pickup.
- After pickup, cancellation requires support/admin handling.
- Delivery confirmation can be done through driver proof plus user confirmation.
