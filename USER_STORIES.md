# FleetPulse — User Stories & Jobs to Be Done

## Maintenance Teams

### Pain: Rely on sticky notes and WhatsApp to track vehicle issues

**JTBD**: When a bus comes into my bay with an issue, I want to log it in a system that everyone can see, so I don't have to remember it, text about it, or write it on a sticky that falls off the wall.

**User Story**: As a mechanic, I want to create a work order from a standardized form so that the issue is immediately visible to my garage, the other garage, and ops managers — replacing the WhatsApp thread nobody reads.

---

### Pain: Service history gets lost when buses are transferred between garages

**JTBD**: When a bus arrives at my garage from the other location, I want to see everything that's been done to it, so I don't repeat work or miss a known issue.

**User Story**: As a mechanic at South Garage, I want to pull up Bus #147's complete service history — including all work done at North Garage — so I can diagnose issues with full context instead of starting from zero.

---

### Pain: Can't see which buses are overdue for preventive maintenance

**JTBD**: When I'm planning my day, I want to know which buses in my garage are approaching or past their PM intervals, so I can pull them in before they break down on a route.

**User Story**: As a mechanic, I want to see a queue of buses due for preventive maintenance — sorted by urgency — so I can work on the most overdue ones first during downtime between reactive repairs.

---

### Pain: Duplicate work because teams don't communicate across garages

**JTBD**: When I'm about to start a diagnostic on a bus, I want to know if someone at the other garage already diagnosed the same symptom last week, so I don't waste 2 hours rediscovering the same root cause.

**User Story**: As a mechanic, I want work orders and diagnostic notes to be shared across both garages in real time, so that a brake issue diagnosed at North Garage doesn't get re-diagnosed from scratch when the bus shows up at South Garage.

---

## Operations Managers

### Pain: No dashboard showing fleet health status

**JTBD**: When I sit down in the morning, I want to see the health of my entire 300-bus fleet in one glance, so I can identify problems before they become crises.

**User Story**: As an ops manager, I want a fleet wall showing every bus color-coded by status (running, PM due, in maintenance, road call) — split by garage — so I can spot patterns and act on them without calling anyone.

---

### Pain: Can't predict how many buses will be available tomorrow

**JTBD**: When dispatch asks me how many buses they can schedule for tomorrow's routes, I want to give them a confident number, not a guess based on who I talked to last.

**User Story**: As an ops manager, I want to see a fleet availability rate and a count of buses currently in each maintenance stage, so I can forecast tomorrow's available fleet based on expected repair completions.

---

### Pain: Need to know which vehicles are priority for repairs

**JTBD**: When the garage has 15 buses waiting for repair and only 8 bays, I want to know which buses to fix first based on route criticality and issue severity, not just who got there first.

**User Story**: As an ops manager, I want work orders triaged by severity (Critical / High / Routine) so that a bus with a safety-critical brake issue gets repaired before a bus with a cosmetic scratch — regardless of which entered the queue first.

---

### Pain: Want visibility into maintenance backlogs

**JTBD**: When I'm in a weekly planning meeting, I want to see how many work orders are in each stage and which ones are aging, so I can allocate resources and escalate blockers — like a parts stockout holding up 3 repairs.

**User Story**: As an ops manager, I want a Domino's-style progress tracker for every active work order showing its stage (Queued → Diagnosed → Parts Ready → In Repair → QA Check) and time in status, so I can see bottlenecks without asking the garage supervisor for an update.
