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
