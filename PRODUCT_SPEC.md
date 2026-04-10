# FleetPulse Product Spec

## Problem Statement

Transitland operates 300 paratransit buses across 2 garages. Maintenance teams rely on sticky notes, WhatsApp, and paper logbooks. Operations managers have zero visibility into fleet health, maintenance backlogs, or tomorrow's bus availability. When buses break down mid-service, riders dependent on paratransit for work, school, and essential trips are stranded. The remaining fleet is overworked, creating a vicious cycle of rising costs and declining reliability.

### The Real Problem (reframed)
This isn't a maintenance tracking problem. It's a **visibility** problem. Mechanics have knowledge. Ops managers need knowledge. There's no system connecting them. An $85 oil change becomes a $14,000 failure cascade when nobody can see it's overdue.

## Stakeholders

### Mechanic (Primary User 1)
- **Context**: Standing in a maintenance bay, hands dirty, possibly using a wall-mounted tablet
- **Current tools**: Sticky notes, WhatsApp group, paper logbooks
- **Job to be done**: See what needs fixing, know if parts are available, log work, move to the next ticket
- **Key pain**: Service history vanishes when buses transfer between garages. Duplicate work across garages.
- **Mental model**: Thinks in physical space (bays) and active tickets — NOT tables and dashboards

### Ops Manager (Primary User 2)
- **Context**: At a desk, scanning fleet-wide status on a monitor
- **Current tools**: Phone calls, WhatsApp, maybe a spreadsheet someone updates weekly
- **Job to be done**: Know fleet availability for tomorrow, identify bottlenecks, prioritize repairs
- **Key pain**: No dashboard. Can't predict availability. Finds out about problems when riders complain.
- **Mental model**: Thinks in fleet-wide patterns and KPIs — NOT individual work orders

## Success Metrics

1. **Fleet Availability Rate** (dispatch reliability, borrowed from airlines) — % of fleet available for service. Target: >90%
2. **Mean Time to Repair (MTTR)** — average hours from work order creation to road-ready
3. **PM Compliance Rate** — % of preventive maintenance completed on schedule
4. **Road Calls per 1,000 Miles** — unplanned breakdowns as a rate metric

Instrument Fleet Availability Rate first — it's the single number that captures the most stakeholder value and is visible on the ops manager dashboard.

## Cross-Domain Inspiration

| Source | Pattern Borrowed | Applied To |
|--------|-----------------|------------|
| Restaurant KDS (Toast, Square) | Ticket board with station assignment | Mechanic work order kanban |
| Domino's Pizza Tracker | Horizontal progress pipeline | Work order status tracker |
| NOC dashboards | Grid of colored status dots | Fleet wall (300 buses at a glance) |
| Airline dispatch reliability | "Can this vehicle safely go out?" + dispatch rate metric | Fleet availability KPI + severity triage |
| Hospital ER triage | Severity-based prioritization: Critical/High/Routine | Work order severity, not P1/P2/P3 |
| Figma Dev Mode | Toggle that swaps entire interface | Role switcher |

## Feature Scope — V1 MVP

### 1. Role Switcher
- Header toggle: Mechanic | Ops Manager
- Swaps entire layout below
- Accent color changes per role

### 2. Mechanic KDS Board
- Bay status strip (8 bays, occupied/open)
- 5-column kanban: Queued → Diagnosed → Parts Ready → In Repair → QA Check
- Work order cards with severity color-coding, bus ID, issue, time tracking

### 3. Fleet Wall (Ops Manager)
- 300 dots split by garage, color = status
- Hover for bus details
- Side-by-side North/South comparison

### 4. KPI Strip (Ops Manager)
- Fleet Availability Rate (primary)
- Running / PM Due / In Maintenance / Road Calls

### 5. Domino's Work Order Tracker (Ops Manager)
- Active work orders with horizontal progress pipeline
- 5-stage visual: circles + connectors
- Severity indicator, time in status

## V2 Roadmap (discussed, not built)
- Parts inventory with predictive replenishment (Amazon Subscribe & Save pattern)
- Garage supervisor view with mechanic assignment tracking (cut due to union sensitivity)
- Cross-garage workload balancing (Uber surge logic)
- Mobile-first PWA for mechanics
- Integration with Spare's scheduling platform
- Usage-based PM triggers from telematics data

## V1 Non-Goals
- No real backend / database (mock data is fine)
- No user authentication
- No mobile responsiveness (desktop-first for demo)
- No real-time updates / WebSockets
- No parts inventory
