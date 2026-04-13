import type { BusHistoryEntry } from "./types";

/**
 * Mock service history for buses that currently have active work orders.
 *
 * Each bus tells a deliberate story:
 *  - Hero case (Bus 147): the active WO is a *deferred* job from the other garage.
 *    The North mechanic opening the panel instantly learns this isn't a surprise,
 *    it's the rotor replacement South flagged 8 days ago.
 *  - Duplicate-risk (Bus 203): a recurring trans-fluid issue seen at both garages.
 *    Makes the "same symptom, two garages" pattern obvious.
 *  - Other buses get shorter histories (1–3 entries) with a mix of same-garage
 *    and cross-garage entries so the drawer tells a different story each time.
 *
 * Timestamps are relative offsets from "today" so the demo stays evergreen without
 * introducing hydration mismatches (dates are computed at module-evaluation time,
 * which runs the same on server + client during a single page load).
 */

function daysAgo(days: number, hours = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hours, 0, 0, 0);
  return d.toISOString();
}

export const busHistory: Record<number, BusHistoryEntry[]> = {
  // ── Hero case ───────────────────────────────────────────────────────────
  // Bus 147 is currently North with a critical brake pad replacement.
  // History shows South flagged the rotors 8 days ago and deferred — this IS
  // the deferred job, not a new surprise.
  147: [
    {
      id: "WO-1198",
      date: daysAgo(8),
      garage: "south",
      issue: "Rear brake rotor inspection",
      severity: "high",
      mechanicName: "Chen, R.",
      outcome: "deferred",
      note: "Rotors within spec but thinning — flagged for replacement within 2 weeks.",
    },
    {
      id: "WO-1156",
      date: daysAgo(34),
      garage: "north",
      issue: "Engine oil change (preventive maintenance A)",
      severity: "routine",
      mechanicName: "Greg T.",
      outcome: "completed",
    },
    {
      id: "WO-1089",
      date: daysAgo(72),
      garage: "north",
      issue: "Wheelchair ramp sensor calibration",
      severity: "routine",
      mechanicName: "Kim, S.",
      outcome: "completed",
    },
  ],

  // ── Duplicate-risk case ─────────────────────────────────────────────────
  // Bus 203 currently has a critical trans fluid leak at South.
  // History shows North replaced a trans cooler line 3 weeks ago, and South
  // observed residual seepage 10 days ago — this is a recurring issue.
  203: [
    {
      id: "WO-1211",
      date: daysAgo(10),
      garage: "south",
      issue: "Transmission fluid seepage check",
      severity: "high",
      mechanicName: "Chen, R.",
      outcome: "recurring",
      note: "Residual seepage observed after last repair. Monitoring; recommend pan gasket reseal.",
    },
    {
      id: "WO-1174",
      date: daysAgo(22),
      garage: "north",
      issue: "Transmission cooler line replacement",
      severity: "high",
      mechanicName: "Greg T.",
      outcome: "completed",
      note: "Replaced OEM cooler line, pressure-tested OK.",
    },
    {
      id: "WO-1102",
      date: daysAgo(58),
      garage: "south",
      issue: "Coolant system flush (PM-B)",
      severity: "routine",
      mechanicName: "Vasquez, D.",
      outcome: "completed",
    },
  ],

  // ── Cross-garage, single entry ──────────────────────────────────────────
  // Bus 89 (North, HVAC compressor failure). Previously had an HVAC
  // recharge at South — same subsystem, likely related.
  89: [
    {
      id: "WO-1189",
      date: daysAgo(11),
      garage: "south",
      issue: "HVAC refrigerant recharge",
      severity: "routine",
      mechanicName: "Vasquez, D.",
      outcome: "completed",
      note: "Recharged to spec. Compressor sounded loud — flagged for follow-up.",
    },
    {
      id: "WO-1067",
      date: daysAgo(88),
      garage: "north",
      issue: "Preventive maintenance — A engine service",
      severity: "routine",
      mechanicName: "Greg T.",
      outcome: "completed",
    },
  ],

  // ── Same-garage only (no callout should render) ─────────────────────────
  // Bus 56 (North, wheelchair ramp hydraulic). All recent work at North.
  56: [
    {
      id: "WO-1221",
      date: daysAgo(5),
      garage: "north",
      issue: "ADA securement strap replacement",
      severity: "routine",
      mechanicName: "Kim, S.",
      outcome: "completed",
    },
    {
      id: "WO-1133",
      date: daysAgo(45),
      garage: "north",
      issue: "Engine oil change (preventive maintenance A)",
      severity: "routine",
      mechanicName: "Greg T.",
      outcome: "completed",
    },
  ],

  // ── Routine PM with one cross-garage entry ──────────────────────────────
  // Bus 78 (North, oil change PM-A). Last serviced at South 45 days ago.
  78: [
    {
      id: "WO-1145",
      date: daysAgo(45),
      garage: "south",
      issue: "Engine oil change (preventive maintenance A)",
      severity: "routine",
      mechanicName: "Chen, R.",
      outcome: "completed",
    },
    {
      id: "WO-1034",
      date: daysAgo(110),
      garage: "south",
      issue: "Air filter replacement",
      severity: "routine",
      mechanicName: "Chen, R.",
      outcome: "completed",
    },
  ],

  // ── Minimal history (one entry, same garage) ────────────────────────────
  // Bus 195 (South, tire rotation).
  195: [
    {
      id: "WO-1177",
      date: daysAgo(30),
      garage: "south",
      issue: "Coolant system flush (PM-B)",
      severity: "routine",
      mechanicName: "Vasquez, D.",
      outcome: "completed",
    },
  ],

  // ── Cross-garage with completed outcome ─────────────────────────────────
  // Bus 267 (South, alternator). Previously had battery work at North.
  267: [
    {
      id: "WO-1183",
      date: daysAgo(12),
      garage: "north",
      issue: "Battery load test + terminal clean",
      severity: "routine",
      mechanicName: "Greg T.",
      outcome: "completed",
      note: "Battery tested OK; corrosion cleaned. If starting issues persist, check alternator output.",
    },
  ],

  // ── Bus with no history (empty state demo) ──────────────────────────────
  // Bus 41 intentionally has no history — newer to fleet or just no prior WOs.
  41: [],

  // ── Cross-garage air brake history ──────────────────────────────────────
  // Bus 182 (South, critical air brake compressor). Related brake work at North.
  182: [
    {
      id: "WO-1203",
      date: daysAgo(9),
      garage: "north",
      issue: "Air brake line inspection",
      severity: "high",
      mechanicName: "Kim, S.",
      outcome: "deferred",
      note: "Compressor cycling frequently — recommended full diagnostic at home garage.",
    },
    {
      id: "WO-1112",
      date: daysAgo(66),
      garage: "south",
      issue: "Brake shoe replacement",
      severity: "high",
      mechanicName: "Vasquez, D.",
      outcome: "completed",
    },
  ],

  // ── Steering history, same garage ───────────────────────────────────────
  // Bus 112 (North, steering fluid leak).
  112: [
    {
      id: "WO-1170",
      date: daysAgo(28),
      garage: "north",
      issue: "Power steering pump bearing replacement",
      severity: "high",
      mechanicName: "Greg T.",
      outcome: "completed",
    },
    {
      id: "WO-1055",
      date: daysAgo(95),
      garage: "north",
      issue: "Preventive maintenance — A engine service",
      severity: "routine",
      mechanicName: "Greg T.",
      outcome: "completed",
    },
  ],
};

/**
 * Returns a bus's service history sorted newest-first.
 * Returns an empty array if no history is on record (valid empty state).
 */
export function getBusHistory(busId: number): BusHistoryEntry[] {
  const entries = busHistory[busId] ?? [];
  return [...entries].sort((a, b) => b.date.localeCompare(a.date));
}
