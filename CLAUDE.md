# FleetPulse

Fleet management tool for Transitland, a fictional paratransit agency. Built as a product assessment for Spare (transit tech, Series B, ~$56M revenue). This maps to Spare's real EAM (Enterprise Asset Management) product.

## Where things live

- **Product spec** — `PRODUCT_SPEC.md` (problem statement, stakeholders, success metrics, cross-domain inspiration, V1 feature scope, V2 roadmap). Start here for product intent.
- **Jobs to be done** — `JTBD.md` (pain + job statements for both personas). Scope boundary for any new feature work — if something doesn't map to a JTBD here, don't build it.
- **Visual system** — `DESIGN.md` (Airbnb-warm palette, coral/copper accent, Airbnb Cereal typography, three-layer shadows). Trust this for anything visual.
- **Reference mockup** — `fleetpulse-role-switcher.jsx` in project root, for visual reference only (not production code).

> ⚠️ Any reference to a "dark industrial" palette (`#0a0a0a` backgrounds, amber/blue role accents, garage-environment framing) from an older revision of this doc is stale. DESIGN.md is the source of truth.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes with mock data (no real DB needed for this assessment)
- **Deployment**: Vercel
- **Domain**: TBD (fleetpulse.fyi or fleetpulse.so)

## Architecture Conventions

### Role Switcher (Figma Dev Mode pattern)
- Toggle in the top bar: "Mechanic" | "Ops Manager"
- One click swaps the entire interface below
- Active role gets its accent treatment; inactive is muted
- State boolean — conditionally render different layout components
- Same data layer, radically different UX

### Top Bar (shared)
- Left: FleetPulse logo + current garage name
- Center: Role switcher toggle
- Right: Current date/time

For the detailed view-by-view feature breakdown (bay strip, kanban, fleet wall, KPI strip, Domino's tracker), see `PRODUCT_SPEC.md` § Feature Scope.

## Mock Data Requirements

Seed realistic data for:
- 300 buses with IDs (Bus #001 through #300)
- Assign to garages: #001-#175 = North, #176-#300 = South
- ~73% running, ~10% PM due, ~10% in maintenance, ~7% road calls
- 8-12 active work orders with varied severities and stages
- Realistic issue types: brake pads, transmission fluid, HVAC, wheelchair ramp hydraulics, oil change (PM), tire rotation, alternator, coolant flush
- Mechanic names for assigned work orders

## What NOT to Build (V1 Cuts)

- Parts inventory management (V2 — needs procurement integration)
- Garage supervisor / mechanic assignment tracking (V2 — union sensitivity)
- Predictive maintenance / ML (Future — needs real telemetry data)
- User auth / login (unnecessary for assessment demo)
- Mobile-responsive mechanic view (V2 — would be a separate PWA)
- Notifications system (V2)
- Real-time updates / WebSockets

## Product Decisions to Remember

1. **Usage-based maintenance triggers, not calendar-based** — this is Spare's core EAM differentiator.
2. **Role-scoped actions, not a shared generic interface.** Role-based UX is about *which* actions and surfaces belong to each persona — not about denying anyone agency. Mechanics get tactical card-level controls (stage progression, parts status) on the KDS board. Ops managers get fleet-wide decisioning surfaces (availability forecast, bottleneck bar, severity filter) on the tracker. Both personas act on the same data, just through different lenses.
3. **Cross-garage visibility is a first-class feature, not an afterthought** — the brief specifically calls out "duplicate work because teams don't communicate across garages".
4. **Work orders use hospital triage severity** (Critical/High/Routine), not generic P1/P2/P3.
5. **The Domino's Tracker pattern eliminates "how's my bus doing?" WhatsApp messages.**
