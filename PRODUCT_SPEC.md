# FleetPulse Product Spec

## Problem Statement

This isn't a maintenance tracking problem. It's a **visibility** problem.

Transitland operates 300 paratransit buses across 2 garages. Mechanics have knowledge — what's broken, what's been tried, what's overdue. Ops managers need that knowledge to forecast availability, triage repairs, and spot bottlenecks. There's no system connecting them. An $85 oil change becomes a $14,000 failure cascade when nobody can see it's overdue, and riders who depend on paratransit for work, school, and essential trips get stranded when the fleet runs thin.

The product's core bet is that the right information surfaces, shaped to each persona's mental model, can replace sticky notes, WhatsApp threads, and weekly spreadsheets without adding workflow overhead.

## Stakeholders

### Mechanic (Primary User 1)
- **Context**: Standing in a maintenance bay, hands dirty, wall-mounted tablet
- **Current tools**: Sticky notes, WhatsApp group, paper logbooks
- **Mental model**: Thinks in physical space (bays) and active tickets — not tables, dashboards, or portfolios
- **Key pain**: Service history vanishes when buses transfer between garages. Duplicate diagnosis across garages.

### Ops Manager (Primary User 2)
- **Context**: At a desk, scanning fleet-wide status on a monitor
- **Current tools**: Phone calls, WhatsApp, a spreadsheet someone updates weekly
- **Mental model**: Thinks in fleet-wide patterns, KPIs, and tomorrow's dispatch — not individual work orders
- **Key pain**: No dashboard. Can't confidently predict availability. Finds out about problems when riders complain.

Canonical JTBD for both personas live in `JTBD.md`.

## Success Metrics

1. **Fleet Availability Rate** (dispatch reliability, borrowed from airlines) — % of fleet available for service. Target: >90%
2. **Mean Time to Repair (MTTR)** — average hours from work order creation to road-ready
3. **PM Compliance Rate** — % of preventive maintenance completed on schedule
4. **Road Calls per 1,000 Miles** — unplanned breakdowns as a rate metric

Fleet Availability Rate is instrumented first — it's the single number that captures the most stakeholder value and anchors the ops manager dashboard.

## Cross-Domain Inspiration

| Source | Pattern Borrowed | Applied To |
|--------|-----------------|------------|
| Restaurant KDS (Toast, Square) | Ticket board with station assignment | Mechanic work order kanban |
| Domino's Pizza Tracker | Horizontal progress pipeline | Work order status tracker |
| NOC dashboards | Grid of colored status dots | Fleet wall (300 buses at a glance) |
| Airline dispatch reliability | "Can this vehicle safely go out?" + dispatch rate metric | Fleet availability KPI + severity triage |
| Hospital ER triage | Severity-based prioritization: Critical/High/Routine | Work order severity, not P1/P2/P3 |
| Figma Dev Mode | Toggle that swaps entire interface | Role switcher |

## Product Approach: Role-Scoped Actions

Role-based UX isn't about whether the product has create/edit actions — it's about **which** actions belong to each persona, and what surface those actions live on. Mechanics and ops managers see the same underlying work orders, but the shape of what they can act on is different:

- **Mechanics get tactical, card-level controls** — advance a work order's stage, see whether parts are available, work one ticket at a time. The KDS board is designed for the garage floor, not for portfolio management.
- **Ops managers get fleet-wide, decisioning surfaces** — tomorrow's availability forecast, bottleneck bars, severity filters across the full tracker. They don't push individual tickets through stages, but they need enough control to filter, sort, and escalate.

The role switcher swaps which set of actions and views is in front of you. Same data layer underneath; radically different interaction model on top. Both personas have agency; the agency just lives where each person actually works.

## Feature Scope — V1 MVP

### 1. Role Switcher
- Header toggle: Mechanic | Ops Manager
- Swaps entire layout below
- Each role has its own accent treatment

### 2. Mechanic KDS Board
- Bay status strip (8 bays, occupied/open)
- 5-column kanban: Queued → Diagnosed → Parts Ready → In Repair → QA Check
- Work order cards with severity indicator, bus ID, issue, time tracking
- **Parts-status badge** on each card (available / ordered)
- **Stage-progression button** to advance or complete a work order from the card itself

### 3. Fleet Wall (Ops Manager)
- 300 dots split by garage, color = status
- Hover for bus details
- Side-by-side North/South comparison

### 4. KPI Strip (Ops Manager)
- Fleet Availability Rate (primary, hero number)
- **Tomorrow's availability forecast** sitting on the availability card
- Running / PM Due / In Maintenance / Road Calls counts
- **Bottleneck bar** showing work-order counts per stage with the peak stage highlighted

### 5. Domino's Work Order Tracker (Ops Manager)
- Active work orders with horizontal progress pipeline
- 5-stage visual: circles + connectors
- Severity indicator, time in status
- **Severity filter pills** (All / Critical / High / Routine) to focus the tracker without losing context

## V2 Roadmap (discussed, not built)
- Parts inventory with predictive replenishment (Amazon Subscribe & Save pattern)
- Garage supervisor view with mechanic assignment tracking (cut due to union sensitivity)
- Cross-garage workload balancing (Uber surge logic)
- Mobile-first PWA for mechanics
- Integration with Spare's scheduling platform
- Usage-based PM triggers from telematics data
