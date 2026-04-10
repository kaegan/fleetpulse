# FleetPulse

Fleet management tool for Transitland, a fictional paratransit agency. Built as a product assessment for Spare (transit tech, Series B, ~$56M revenue). This maps to Spare's real EAM (Enterprise Asset Management) product.

## Context

- 300 buses across 2 garages (North: 175, South: 125)
- 20-30 buses in maintenance at any time
- Mechanics currently use sticky notes, WhatsApp, paper logbooks
- Parts clerks track inventory on spreadsheets
- No preventive maintenance visibility — buses break down mid-service

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes with mock data (no real DB needed for this assessment)
- **Deployment**: Vercel
- **Domain**: TBD (fleetpulse.fyi or fleetpulse.so)

## Design System

### Palette — Dark Industrial
This is NOT a white SaaS dashboard. It's designed for garage environments.

- Background: `#0a0a0a` (near black)
- Surface: `#111111` (cards, panels)
- Border: `#1e1e1e` to `#262626`
- Text primary: `#e5e5e5`
- Text secondary: `#a3a3a3`
- Text muted: `#737373`
- Text faint: `#525252`

### Status Colors
- Running/Healthy: `#22c55e` (green)
- PM Due/Warning: `#f59e0b` (amber)
- In Maintenance/Critical: `#ef4444` (red)
- Road Call/Breakdown: `#1e1e1e` with red border

### Role Accent Colors
- Mechanic view: Amber (`#f59e0b`) — warm, workshop energy
- Ops Manager view: Blue (`#3b82f6`) — command center energy

### Typography
- Font: Inter (or system sans-serif fallback)
- Tight letter-spacing on headings: `-0.02em`
- Uppercase labels: `text-[11px] font-semibold uppercase tracking-wider text-neutral-500`

## Architecture

### Role Switcher (Figma Dev Mode pattern)
- Toggle in the top bar: "Mechanic" | "Ops Manager"
- One click swaps the entire interface below
- Active role gets its accent color; inactive is muted gray
- State boolean — conditionally render different layout components
- Same data layer, radically different UX

### Top Bar (shared)
- Left: FleetPulse logo (green dot + wordmark) + current garage name
- Center: Role switcher toggle
- Right: Current date/time

## Two Views

### 1. Mechanic View — KDS Board
Inspired by restaurant Kitchen Display Systems. Mechanics think in physical space and active tickets.

**Bay Status Strip** (top)
- Horizontal row of all maintenance bays (8 per garage)
- Each bay shows: bay number, bus number if occupied, "Open" if free
- Occupied bays: dark background. Open bays: subtle green tint

**Work Order Kanban** (main area)
- 5 columns: Queued → Diagnosed → Parts Ready → In Repair → QA Check
- Column headers show count badges
- Cards contain:
  - Bus number (bold, primary)
  - Issue description
  - Time in current status
  - Work order ID (monospace, muted)
  - Bay assignment (if applicable)
  - Severity color-coding via left border: red=critical, amber=high, green=routine
- Cards should feel tactile — like tickets on a KDS screen

### 2. Ops Manager View — Fleet Wall + Tracker
Inspired by NOC dashboards and Domino's Pizza Tracker.

**KPI Strip** (top)
- Fleet Availability Rate (% — primary metric, large)
- Running count
- PM Due count
- In Maintenance count
- Road Calls count
- Color-coded: green if healthy, amber if warning

**Fleet Wall** (middle)
- Split into two panels: North Garage | South Garage
- Each panel: grid of small colored squares (one per bus)
- Color = status (green/amber/red/black)
- Hover on any square: tooltip with bus number and status
- Header per garage: name, total buses, available count
- Legend at bottom of each panel
- This is the NOC pattern — see entire fleet health at a glance

**Active Work Orders — Domino's Tracker** (bottom)
- List of all active work orders
- Each row has a horizontal progress pipeline:
  - 5 stages: Queued → Diagnosed → Parts Ready → In Repair → QA Check
  - Completed stages: filled circles with checkmarks
  - Current stage: outlined circle with accent border
  - Future stages: muted
  - Connector lines between stages (filled = complete, muted = future)
- Row also shows: bus number, WO ID, issue description, time in status, severity dot

## Mock Data Requirements

Seed realistic data for:
- 300 buses with IDs (Bus #001 through #300)
- Assign to garages: #001-#175 = North, #176-#300 = South
- ~73% running, ~10% PM due, ~10% in maintenance, ~7% road calls
- 8-12 active work orders with varied severities and stages
- Realistic issue types: brake pads, transmission fluid, HVAC, wheelchair ramp hydraulics, oil change (PM), tire rotation, alternator, coolant flush
- Mechanic names for assigned work orders

## Reference Mockup

See `fleetpulse-role-switcher.jsx` in the project root for a working React prototype of both views. Use it as a visual reference, not as production code.

## What NOT to Build (V1 Cuts)

- Parts inventory management (V2 — needs procurement integration)
- Garage supervisor / mechanic assignment tracking (V2 — union sensitivity)
- Predictive maintenance / ML (Future — needs real telemetry data)
- User auth / login (unnecessary for assessment demo)
- Mobile-responsive mechanic view (V2 — would be a separate PWA)
- Notifications system (V2)

## Product Decisions to Remember

1. Usage-based maintenance triggers, not calendar-based — this is Spare's core EAM differentiator
2. Role-based UX is an intentional architectural decision mirroring Spare's actual EAM product (technician tools, supervisor dashboards, leadership analytics)
3. Cross-garage visibility is a first-class feature, not an afterthought — the brief specifically calls out "duplicate work because teams don't communicate across garages"
4. Work orders use hospital triage severity (Critical/High/Routine), not generic P1/P2/P3
5. The Domino's Tracker pattern eliminates "how's my bus doing?" WhatsApp messages
