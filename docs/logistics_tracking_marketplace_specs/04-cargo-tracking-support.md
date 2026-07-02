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
