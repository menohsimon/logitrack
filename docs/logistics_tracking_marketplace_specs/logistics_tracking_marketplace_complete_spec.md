# Logistics Tracking Marketplace Platform Specs

This folder contains the product specification pack for a transport and shipment tracking marketplace built with Next.js, Convex, and Clerk.

## Confirmed direction

The platform is a marketplace where users browse verified transport companies, make booking requests, and track shipments through every operational stage. Companies use Clerk Organizations. Drivers are invited by companies and belong to one company only. Admins control marketplace trust, verification, bans, support, and moderation.

## Version strategy

### v0.1

The first version focuses on marketplace trust and status-based shipment tracking.

Included:

- User accounts
- Company onboarding using Clerk Organizations
- Company verification by admin
- Driver invitation by company
- Public company browsing
- Booking requests
- Company acceptance or rejection
- Driver assignment
- Shipment creation after accepted booking
- Status-based shipment timeline
- Proof of pickup and delivery using photos and/or QR codes
- Reviews and ratings after completed shipments
- Support ticket system routed to admins
- Admin dashboard with booking stats, users, companies, bans, and ticket management

Excluded from v0.1:

- Payments
- Real-time maps
- Path tracing
- ETA
- Driver live location
- Escrow or commission logic

### v0.2

The second version can add:

- Payments
- Map-based shipment tracking
- Driver live location
- Route path tracing
- ETA
- Geofenced pickup and delivery events
- Platform commission
- More advanced dispute resolution

## Documents in this pack

1. `01-product-requirements.md`  
   Full PRD covering product purpose, actors, scope, features, functional requirements, and acceptance criteria.

2. `02-roles-permissions-workflows.md`  
   Actor permissions, lifecycle workflows, route structure, and operational flows.

3. `03-technical-architecture.md`  
   Clerk organization model, Convex schema, API structure, auth rules, indexes, and implementation notes.

4. `04-cargo-tracking-support.md`  
   Cargo model, category-specific fields, tracking timeline, proof workflow, reviews, and support ticket logic.

5. `05-roadmap-mvp-plan.md`  
   Suggested build phases, MVP milestones, backlog, v0.2 planning, testing checklist, and implementation order.

## Recommended use

Use these documents as the base for:

- Codex planning mode
- Team alignment
- Database design
- UI route planning
- Feature breakdown
- Investor or advisor explanation
- MVP execution planning


---

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


---

# Roles, Permissions, and Workflows

# Logistics Tracking Marketplace Platform

## 1. Role model

The platform has four main actors:

1. Admin
2. User
3. Company
4. Driver

Companies are represented as Clerk Organizations. Drivers are invited into company organizations, but the application must enforce that one driver belongs to only one company.

## 2. Role definitions

## 2.1 Admin

Admin is a platform-level role. Admin is not tied to a company organization.

Admin responsibilities:

- Manage marketplace trust.
- Approve or reject companies.
- Ban or suspend users.
- Ban or suspend companies.
- View all bookings and shipments.
- Manage support tickets.
- Moderate reviews.
- View high-level platform metrics.

## 2.2 User

User is the client role.

User responsibilities:

- Browse approved companies.
- Create booking requests.
- Track accepted shipments.
- Confirm delivery.
- Rate completed shipments.
- Open support tickets.

## 2.3 Company owner or manager

Company owner or manager is a role within a Clerk Organization.

Company responsibilities:

- Complete company profile.
- Submit for verification.
- Invite drivers.
- Manage drivers.
- Accept or reject booking requests.
- Assign drivers.
- Monitor shipments.
- Respond to support tickets.

## 2.4 Driver

Driver is an invited company member. Drivers belong to one company only.

Driver responsibilities:

- View assigned shipments.
- Update shipment tracking statuses.
- Upload pickup and delivery proof.
- Report issues.
- Open support tickets.

## 3. Permission matrix

| Feature | Admin | User | Company | Driver |
|---|---:|---:|---:|---:|
| Browse public companies | Yes | Yes | Yes | Yes |
| Create booking request | No | Yes | No | No |
| View own booking | Yes | Yes | Yes, if selected company | No, unless assigned |
| Accept or reject booking | Yes, override only | No | Yes | No |
| Create shipment | System/Admin | No | Yes, by accepting booking | No |
| Assign driver | Yes, override only | No | Yes | No |
| View assigned shipment | Yes | Yes, if owner | Yes, if company owns it | Yes, if assigned |
| Update shipment status | Yes | Limited confirmation | Yes | Yes, if assigned |
| Upload proof | Yes | Limited confirmation proof | Yes | Yes, if assigned |
| Confirm delivery | Yes | Yes | Yes, admin/company override | No |
| Review shipment | No | Yes, after completion | No | No |
| Moderate review | Yes | No | No | No |
| Open support ticket | Yes | Yes | Yes | Yes |
| Manage all tickets | Yes | No | No | No |
| View own tickets | Yes | Yes | Yes | Yes |
| Ban user | Yes | No | No | No |
| Ban company | Yes | No | No | No |
| Approve company | Yes | No | No | No |
| Invite driver | No | No | Yes | No |
| Remove driver | Yes, override only | No | Yes | No |

## 4. Account and organization workflow

## 4.1 User signup

1. User creates an account with Clerk.
2. Convex creates or updates application user profile.
3. User can browse approved companies.
4. User can create booking requests.

## 4.2 Company signup

1. Company manager creates account with Clerk.
2. Company manager creates Clerk Organization.
3. Convex creates company profile linked to Clerk organization ID.
4. Company completes profile.
5. Company submits verification.
6. Company status becomes pending verification.
7. Admin reviews company.
8. If approved, company becomes visible in marketplace.
9. If rejected, company must update profile or documents.
10. If banned, company loses operational access.

## 4.3 Driver invitation

1. Company manager opens driver management page.
2. Company sends invitation through Clerk Organization.
3. Driver receives invite.
4. Driver accepts and creates account or signs in.
5. Convex creates driver profile linked to company.
6. App checks whether driver already belongs to another company.
7. If driver already belongs to a company, the invite should be blocked or require admin intervention.
8. Driver can access assigned shipment dashboard.

## 5. Company verification workflow

Company statuses:

- Draft
- Pending verification
- Approved
- Rejected
- Suspended
- Banned

Workflow:

1. Company creates organization.
2. Company profile status starts as draft.
3. Company fills required information.
4. Company submits verification request.
5. Status changes to pending verification.
6. Admin reviews.
7. Admin approves or rejects.
8. Approved companies appear publicly.
9. Suspended or banned companies are hidden and cannot receive bookings.

Admin review checklist:

- Company name looks legitimate.
- Contact information is present.
- Operating regions are clear.
- Service categories are clear.
- Documents are provided if required.
- No duplicate company exists.
- Company is not previously banned.

## 6. Booking workflow

## 6.1 User creates booking

1. User browses approved companies.
2. User opens company profile.
3. User clicks book or request transport.
4. User fills pickup information.
5. User fills destination information.
6. User fills cargo details.
7. User fills timing preferences.
8. User adds special handling instructions.
9. User reviews summary.
10. User submits booking request.
11. Booking status becomes pending company response.

## 6.2 Company handles booking request

1. Company receives booking request.
2. Company reviews cargo, pickup, destination, and timing.
3. Company accepts or rejects.
4. If rejected, company selects reason and can add note.
5. If accepted, shipment is created.
6. Shipment starts as awaiting driver assignment or created.

Recommended rejection reasons:

- Outside operating region
- Cargo type not supported
- No available driver
- Requested time unavailable
- Vehicle capacity unavailable
- Company cannot fulfill request
- Other

## 6.3 Booking status lifecycle

Suggested booking statuses:

1. Draft
2. Submitted
3. Pending company response
4. Accepted
5. Rejected
6. Cancelled by user
7. Cancelled by company
8. Expired

Rules:

- Draft bookings are not visible to companies.
- Submitted bookings must have required fields.
- Pending bookings can be accepted or rejected by company.
- Accepted bookings create shipments.
- Rejected bookings do not create shipments.
- Cancelled bookings should store cancellation actor and reason.

## 7. Shipment workflow

## 7.1 Shipment creation

1. Company accepts booking.
2. System creates shipment linked to booking.
3. Shipment stores user, company, cargo, pickup, destination, and requested timing.
4. Shipment status becomes awaiting driver assignment.

## 7.2 Driver assignment

1. Company opens shipment.
2. Company selects active driver from its company.
3. Shipment stores driver ID.
4. Shipment status becomes driver assigned.
5. Driver sees assignment.

## 7.3 Pickup execution

1. Driver views assigned shipment.
2. Driver starts pickup process.
3. Driver updates status to arriving for pickup, if used.
4. Driver reaches pickup location.
5. Driver uploads pickup proof photo.
6. Optional QR confirmation is performed.
7. Shipment status becomes picked up.
8. Tracking event is created.

## 7.4 In-transit execution

1. Driver updates shipment as in transit.
2. Driver or company can add checkpoint events, optional.
3. Driver or company can mark delayed if needed.
4. User sees timeline updates.

## 7.5 Delivery execution

1. Driver marks out for delivery, if used.
2. Driver reaches delivery destination.
3. Driver uploads delivery proof photo.
4. Optional QR confirmation is performed.
5. Shipment status becomes delivered.
6. User can confirm delivery.
7. Shipment status becomes delivery confirmed.
8. User can leave review.

## 7.6 Shipment status lifecycle

Suggested shipment statuses:

1. Created
2. Awaiting driver assignment
3. Driver assigned
4. Pickup scheduled
5. Arriving for pickup
6. Picked up
7. In transit
8. At checkpoint
9. Delayed
10. Out for delivery
11. Delivered
12. Delivery confirmed
13. Failed delivery
14. Disputed
15. Cancelled

Rules:

- Shipment cannot exist without accepted booking.
- Shipment should not be marked picked up without pickup proof, unless company/admin override is used.
- Shipment should not be marked delivered without delivery proof, unless company/admin override is used.
- User review is only available after delivery confirmed or completed status.
- Disputed shipment should block review until resolved, or mark review as pending moderation.

## 8. Tracking event workflow

Every important shipment status change creates a tracking event.

Tracking event fields:

- Shipment ID
- Booking ID
- Company ID
- Driver ID, optional
- Actor ID
- Actor role
- Event type
- Previous status
- New status
- Description
- Attachments
- Created at

Tracking event principles:

- Tracking events should be append-only where possible.
- Sensitive correction should create a correction event, not silently edit history.
- Admin actions should be logged.
- User-facing timeline can hide internal notes.

## 9. Proof workflow

## 9.1 Photo proof

Photo proof is the baseline for v0.1.

Pickup proof:

- Driver uploads cargo photo at pickup.
- Photo is attached to pickup tracking event.
- Timestamp is stored.
- Optional notes can be added.

Delivery proof:

- Driver uploads delivery photo.
- Photo is attached to delivery tracking event.
- Receiver name can be recorded.
- Timestamp is stored.

## 9.2 QR confirmation

QR confirmation can be optional in v0.1.

Possible flow A, user presents QR:

1. User opens shipment confirmation QR.
2. Driver scans QR at pickup or delivery.
3. System validates shipment token.
4. Confirmation event is created.

Possible flow B, driver presents QR:

1. Driver opens shipment QR.
2. User or receiver scans QR.
3. System validates identity and shipment.
4. Confirmation event is created.

Recommendation:

Use photo proof as required. Add QR as optional for delivery confirmation first.

## 10. Review workflow

1. Shipment reaches delivery confirmed status.
2. User sees review prompt.
3. User submits rating and comment.
4. Review links to shipment, company, and optionally driver.
5. Company rating recalculates.
6. Admin can moderate review if reported.

Review rules:

- One review per shipment.
- Only shipment owner can review.
- Review requires completed shipment.
- Reviews should not be editable forever. A short edit window can be used.

## 11. Support ticket workflow

## 11.1 Ticket creation

Any authenticated actor can create a ticket.

Ticket creation fields:

- Subject
- Category
- Description
- Related booking, optional
- Related shipment, optional
- Attachments, optional
- Priority, optional or system-derived

## 11.2 Ticket handling

1. Ticket is created.
2. Admin sees ticket in dashboard.
3. Admin reviews ticket.
4. Admin requests more information if needed.
5. User, company, or driver responds.
6. Admin resolves or closes ticket.
7. Ticket can be reopened if needed.

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

Ticket priorities:

- Low
- Medium
- High
- Urgent

Urgent examples:

- Lost cargo
- Petroleum safety issue
- Legal or security issue
- Driver safety issue
- Fraud report

## 12. Admin workflows

## 12.1 Ban user

1. Admin opens user profile.
2. Admin reviews activity.
3. Admin selects ban user.
4. Admin enters reason.
5. User status becomes banned.
6. User cannot create new bookings.
7. Existing active bookings require review.
8. Admin action is logged.

## 12.2 Ban company

1. Admin opens company profile.
2. Admin reviews complaints, ratings, and tickets.
3. Admin selects ban company.
4. Admin enters reason.
5. Company status becomes banned.
6. Company is hidden from marketplace.
7. Company cannot accept new bookings.
8. Active shipments are flagged for admin review.
9. Admin action is logged.

## 12.3 Suspend company

Suspension is softer than ban.

Effects:

- Company hidden from marketplace.
- Company cannot receive new bookings.
- Company may still complete active shipments.
- Admin can restore company later.

## 12.4 Moderate review

1. Review is reported or flagged.
2. Admin opens review.
3. Admin can keep, hide, or remove review.
4. If hidden, it does not affect public display.
5. Admin action is logged.

## 13. Recommended Next.js route structure

Public routes:

- `/`
- `/companies`
- `/companies/[companyId]`
- `/track/[shipmentId]`, optional public tracking with secure token

Auth routes:

- `/dashboard`
- `/dashboard/bookings`
- `/dashboard/bookings/[bookingId]`
- `/dashboard/shipments`
- `/dashboard/shipments/[shipmentId]`
- `/dashboard/support`
- `/dashboard/support/[ticketId]`
- `/dashboard/reviews`
- `/dashboard/profile`

Company routes:

- `/company`
- `/company/profile`
- `/company/verification`
- `/company/drivers`
- `/company/bookings`
- `/company/bookings/[bookingId]`
- `/company/shipments`
- `/company/shipments/[shipmentId]`
- `/company/support`
- `/company/reviews`

Driver routes:

- `/driver`
- `/driver/shipments`
- `/driver/shipments/[shipmentId]`
- `/driver/support`

Admin routes:

- `/admin`
- `/admin/users`
- `/admin/users/[userId]`
- `/admin/companies`
- `/admin/companies/[companyId]`
- `/admin/bookings`
- `/admin/shipments`
- `/admin/support`
- `/admin/support/[ticketId]`
- `/admin/reviews`
- `/admin/audit-logs`

## 14. UI page requirements

## 14.1 Company marketplace page

Must include:

- Search input
- Category filters
- Region filters
- Rating filter
- Company cards
- Empty state
- Loading state

## 14.2 Company profile page

Must include:

- Company logo and name
- Verification badge
- Rating summary
- Service categories
- Operating regions
- Company description
- Completed shipments count
- Reviews
- Book button

## 14.3 Booking form

Must include:

- Company context
- Pickup details
- Destination details
- Cargo details
- Timing details
- Special instructions
- Summary confirmation

## 14.4 Shipment tracking page

Must include:

- Shipment status
- Pickup and delivery summary
- Company info
- Driver info, limited for user safety
- Timeline of tracking events
- Proof section
- Support button
- Delivery confirmation action when available

## 14.5 Admin dashboard

Must include:

- Stats cards
- Pending company approvals
- Recent bookings
- Active shipments
- Open tickets
- Recent admin actions

## 15. Notification events

v0.1 can start with in-app notifications and email if desired.

Notification triggers:

- Company approved
- Company rejected
- Driver invited
- Booking submitted
- Booking accepted
- Booking rejected
- Driver assigned
- Shipment picked up
- Shipment delayed
- Shipment delivered
- Delivery confirmed
- Review received
- Ticket created
- Ticket updated
- Ticket resolved

## 16. Edge cases

- User cancels booking before acceptance.
- User cancels booking after acceptance but before pickup.
- Company rejects booking.
- Company accepts booking but does not assign driver.
- Driver is removed while shipment is assigned.
- Driver fails to upload proof.
- Shipment is marked delivered but user disputes it.
- Company is suspended while active shipments exist.
- Driver belongs to another company.
- Review is abusive or fraudulent.
- Support ticket is opened by a banned user.

## 17. Recommended policy defaults

- User can cancel freely before company acceptance.
- User cancellation after company acceptance is allowed before pickup, with reason required.
- Cancellation after pickup creates support ticket or disputed status.
- Company rejection requires reason.
- Company suspension does not automatically cancel active shipments.
- Banned company cannot receive new bookings.
- Banned user cannot create bookings or reviews.
- Driver removal should unassign future shipments but preserve historical records.


---

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


---

# Cargo, Tracking, Proof, Reviews, and Support Specification

# Logistics Tracking Marketplace Platform

## 1. Purpose

This document defines the operational layer of the platform: cargo details, shipment tracking, proof of pickup and delivery, reviews, and support tickets.

This layer is central to the product because the platform's value is trust and accountability. Users need to know what is being transported, who is responsible, what stage the shipment is at, and what proof exists if something goes wrong.

## 2. Cargo model

The platform should support multiple transport categories without becoming too rigid too early.

Use a two-level cargo model:

1. Common cargo fields used by every shipment.
2. Category-specific fields stored as structured metadata.

## 3. Common cargo fields

Every cargo record should support:

- Title
- Description
- Cargo category
- Quantity
- Unit
- Weight in kg
- Volume in cubic meters
- Dimensions
- Declared value
- Currency
- Photos
- Fragile flag
- Hazardous flag
- Refrigeration requirement
- Special handling requirement
- Handling instructions
- Loading instructions
- Unloading instructions
- Notes

## 4. Cargo categories

Recommended initial categories:

- General package
- Petroleum product
- Agricultural product
- Construction material
- Housing or household goods
- Industrial goods
- Other

## 5. General package details

Use for normal parcels and non-specialized shipments.

Fields:

- Package type
- Number of packages
- Weight
- Dimensions
- Fragile flag
- Declared value
- Pickup photo
- Special handling instructions

Examples:

- Documents
- Electronics
- Clothing
- Packaged goods
- Consumer goods

## 6. Petroleum product details

Use for fuel or petroleum-related transport.

Fields:

- Product type
- Quantity
- Unit, such as liters or barrels
- Hazard classification
- Container type
- Safety requirements
- Temperature sensitivity
- Spill risk notes
- Loading site instructions
- Delivery site instructions
- Required vehicle type
- Required handling certification, optional

Examples:

- Petrol
- Diesel
- Lubricants
- Gas cylinders, if allowed by company policy
- Industrial petroleum products

Important v0.1 note:

The platform should store detailed information, but should avoid claiming regulatory compliance unless the business has verified the applicable laws and certifications.

## 7. Agricultural product details

Use for farm goods, food produce, and raw agricultural materials.

Fields:

- Product type
- Quantity
- Unit, such as kg, bags, crates, tons
- Perishable flag
- Refrigeration requirement
- Humidity sensitivity
- Packaging type
- Harvest date, optional
- Expiry sensitivity, optional
- Loading instructions
- Unloading instructions

Examples:

- Cocoa
- Coffee
- Maize
- Plantains
- Fruits
- Vegetables
- Animal feed

## 8. Construction material details

Use for building materials and site deliveries.

Fields:

- Material type
- Quantity
- Unit, such as bags, tons, pieces, cubic meters
- Weight
- Loading equipment required
- Unloading equipment required
- Site access notes
- Fragile flag
- Dust or spill notes
- Vehicle type requirement

Examples:

- Cement
- Sand
- Gravel
- Bricks
- Tiles
- Wood
- Steel rods
- Pipes

## 9. Housing or household goods details

Use for house moving, furniture, appliances, and domestic transport.

Fields:

- Item list
- Number of rooms, optional
- Furniture count, optional
- Appliance count, optional
- Fragile items
- Disassembly required
- Floor level at pickup
- Floor level at destination
- Elevator availability
- Packaging required
- Loading assistance required
- Unloading assistance required

Examples:

- Furniture
- Appliances
- Personal belongings
- Office relocation
- Household relocation

## 10. Industrial goods details

Use for machines, equipment, and business goods.

Fields:

- Equipment type
- Serial numbers, optional
- Weight
- Dimensions
- Handling sensitivity
- Loading equipment required
- Unloading equipment required
- Insurance required, future
- Special safety instructions

Examples:

- Machines
- Tools
- Industrial supplies
- Factory equipment
- Business inventory

## 11. Cargo form UX

The booking form should first ask for cargo category. Based on the selected category, it should show relevant fields.

Recommended UX sections:

1. Category and description
2. Quantity and measurement
3. Size and weight
4. Value and sensitivity
5. Handling requirements
6. Photos
7. Special instructions

The form should avoid overwhelming users by showing all fields at once. Use progressive disclosure.

## 12. Pickup and destination model

Pickup fields:

- Pickup address
- Pickup city or region
- Pickup contact name
- Pickup contact phone
- Pickup date or preferred window
- Pickup instructions
- Access notes

Destination fields:

- Destination address
- Destination city or region
- Receiver name
- Receiver phone
- Requested delivery date or preferred window
- Delivery instructions
- Access notes

v0.2 map fields:

- Pickup latitude
- Pickup longitude
- Destination latitude
- Destination longitude
- Route coordinates
- Last driver latitude
- Last driver longitude

## 13. Shipment tracking model

Tracking should be based on immutable timeline events.

Each timeline event should have:

- Title
- Description
- Actor
- Timestamp
- Status change
- Proof, if available
- Visibility level

Visibility levels:

- Public to user, company, driver, admin
- Company and admin only
- Admin only

## 14. User-facing tracking timeline

The user-facing timeline should show only meaningful updates.

Recommended user timeline events:

- Booking request submitted
- Booking accepted
- Driver assigned
- Pickup scheduled
- Cargo picked up
- Cargo in transit
- Shipment delayed
- Out for delivery
- Delivered
- Delivery confirmed
- Issue reported
- Dispute resolved

Avoid exposing internal company notes unless they are explicitly marked public.

## 15. Company-facing tracking timeline

Company timeline can show:

- All user-facing events
- Driver assignment changes
- Driver notes
- Internal status notes
- Proof upload status
- Support ticket links

## 16. Admin-facing tracking timeline

Admin timeline should show:

- All events
- Internal notes
- Admin overrides
- Support ticket links
- Review moderation links
- Ban or suspension events related to shipment actors

## 17. Status transition requirements

## 17.1 Pickup proof required

The system should prevent marking a shipment as picked up unless:

- A pickup proof photo exists, or
- A QR confirmation exists, or
- An admin/company override is applied with a reason

Recommended v0.1 default:

Require pickup photo.

## 17.2 Delivery proof required

The system should prevent marking a shipment as delivered unless:

- A delivery proof photo exists, or
- A QR confirmation exists, or
- An admin/company override is applied with a reason

Recommended v0.1 default:

Require delivery photo. QR confirmation can be optional.

## 18. Proof types

## 18.1 Pickup photo

Purpose:

Show the cargo was collected.

Required data:

- Image file
- Shipment ID
- Uploaded by
- Timestamp
- Event ID

Optional data:

- Notes
- Location in v0.2

## 18.2 Delivery photo

Purpose:

Show the cargo reached destination.

Required data:

- Image file
- Shipment ID
- Uploaded by
- Timestamp
- Event ID

Optional data:

- Receiver name
- Receiver phone
- Notes
- Location in v0.2

## 18.3 QR confirmation

Purpose:

Add stronger confirmation that pickup or delivery was acknowledged by the correct party.

Recommended first use:

Delivery confirmation.

QR token rules:

- One-time use
- Purpose-specific
- Expiring token
- Linked to shipment
- Stored as hash
- Creates proof and tracking event when used

## 18.4 Receiver name

Purpose:

Record who received the shipment.

Fields:

- Receiver name
- Receiver phone, optional
- Relationship or role, optional
- Notes

## 19. Proof visibility

Proof should not always be public.

Recommended visibility:

- User can see proof for their own shipment.
- Company can see proof for its shipments.
- Driver can see proof they uploaded or shipment proof for assigned shipment.
- Admin can see all proof.

Sensitive proof should be admin-only or company-admin only.

## 20. Reviews and ratings

## 20.1 Review creation

A user can review only after shipment completion.

Review should include:

- Rating from 1 to 5
- Comment
- Optional tags
- Linked shipment
- Linked company
- Optional linked driver

Recommended tags:

- On time
- Professional
- Good communication
- Careful handling
- Damaged cargo
- Delayed
- Poor communication
- Excellent service

## 20.2 Rating calculation

Company rating:

- Average all published reviews linked to the company.
- Store average and count on company for fast marketplace display.

Driver rating:

- Optional for v0.1.
- If used, average published reviews linked to driver.

## 20.3 Review moderation

Review statuses:

- Published
- Hidden
- Removed
- Pending moderation

Admin actions:

- Hide review
- Remove review
- Restore review
- Mark as reviewed

Company should not be able to delete user reviews. It can report them.

## 21. Support ticket system

The support system should work like a ticketing workflow that reaches admin.

Actors that can create tickets:

- User
- Company
- Driver
- Admin

Tickets can be related to:

- Account
- Booking
- Shipment
- Company verification
- Review
- General issue

## 22. Ticket categories

Recommended categories:

- Lost cargo
- Damaged cargo
- Delayed shipment
- Driver issue
- Company issue
- Booking issue
- Account issue
- Review issue
- Verification issue
- Payment issue, future
- Other

## 23. Ticket priorities

Priority levels:

- Low
- Medium
- High
- Urgent

Priority guidance:

- Low: basic question, profile issue, non-urgent clarification.
- Medium: booking issue, company response delay, ordinary shipment question.
- High: shipment delay, delivery dispute, review abuse, driver issue.
- Urgent: lost cargo, petroleum safety issue, fraud, security issue, active conflict.

## 24. Ticket statuses

Suggested statuses:

- Open
- Waiting for admin
- Waiting for user
- Waiting for company
- Waiting for driver
- Under review
- Resolved
- Closed
- Reopened

## 25. Ticket message model

Each ticket can have messages.

Message fields:

- Ticket ID
- Sender ID
- Sender role
- Message body
- Attachments
- Internal-only flag
- Created timestamp

Admin internal notes should not be visible to normal users, companies, or drivers.

## 26. Support workflows by scenario

## 26.1 Lost cargo

1. User opens ticket linked to shipment.
2. Category is lost cargo.
3. Priority becomes urgent or high.
4. Admin reviews timeline and proof.
5. Admin contacts company through ticket.
6. Company responds with details.
7. Admin resolves, escalates, or marks shipment disputed.

## 26.2 Damaged cargo

1. User opens ticket with photos.
2. Ticket links to shipment.
3. Admin reviews delivery proof.
4. Company can respond.
5. Admin marks ticket resolved or escalates.

## 26.3 Delayed shipment

1. User opens ticket or company marks delayed.
2. Shipment status may change to delayed.
3. Admin can monitor if issue escalates.
4. Company or driver adds update.
5. Ticket closes after delivery or explanation.

## 26.4 Company verification issue

1. Company opens ticket.
2. Admin reviews verification status.
3. Admin requests missing information.
4. Company updates profile or documents.
5. Admin approves or rejects.

## 27. Dispute behavior

A shipment can become disputed when:

- User reports lost cargo.
- User disputes delivery.
- User reports damage.
- Company reports unreachable receiver.
- Driver reports unsafe delivery condition.
- Admin flags suspicious activity.

Disputed shipment effects:

- Review may be blocked or set to pending moderation.
- Admin ticket should be linked.
- Timeline should show issue reported.
- Company and user should see current dispute state.

## 28. Recommended v0.1 proof and support rules

- Pickup photo is required.
- Delivery photo is required.
- QR confirmation is optional.
- QR confirmation should be prioritized for delivery.
- Tickets can be created from shipment page.
- Tickets linked to shipments should show relevant timeline to admin.
- Urgent tickets should appear at top of admin dashboard.
- Admin actions should be logged.

## 29. Acceptance criteria

Cargo:

- User can enter cargo details by category.
- Cargo details are attached to booking.
- Cargo details are copied or linked to shipment after acceptance.

Tracking:

- Shipment timeline shows status events.
- Status updates create tracking events.
- User can view shipment timeline.
- Company can view company shipment timeline.
- Driver can view assigned shipment timeline.

Proof:

- Driver can upload pickup photo.
- Driver can upload delivery photo.
- Proof is linked to tracking event.
- User can view proof for own shipment.

Reviews:

- User can review completed shipment.
- User cannot review incomplete shipment.
- Company rating updates after review.

Support:

- User can create ticket.
- Company can create ticket.
- Driver can create ticket.
- Admin can view all tickets.
- Admin can reply and close ticket.


---

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


---

