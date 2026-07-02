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
