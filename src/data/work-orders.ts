import type { PartRequirement, WorkOrder } from "./types";

/**
 * 10 hand-authored work orders exercising the six-stage pipeline.
 * Distribution: 1 Inbound, 1 Triage, 2 Diagnosing, 2 Held, 2 Repairing, 2 Road Test.
 * Severity mix: 3 critical / 4 high / 3 routine.
 * Cross-garage: 6 North, 4 South.
 * Torres, M. (CURRENT_MECHANIC) owns 2 North WOs so Mine/All still tells a story.
 *
 * Timestamps are fixed offsets from today to avoid SSR hydration mismatches.
 */

function todayAt(hours: number, minutes = 0): string {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

function yesterdayAt(hours: number, minutes = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

function daysAgoAt(days: number, hours: number, minutes = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

function tomorrowAt(hours: number, minutes = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

export const workOrders: WorkOrder[] = [
  // ── Inbound: road call, bus being towed back to the depot ──────────────
  {
    id: "WO-1247",
    busId: 182,
    busNumber: "182",
    issue: "Air brake compressor (road call)",
    severity: "critical",
    stage: "inbound",
    bayNumber: null,
    garage: "south",
    mechanicName: null,
    partsStatus: "needed",
    parts: [{ partId: "air-brake-compressor", partName: "Air Brake Compressor", qty: 1 }],
    createdAt: todayAt(6, 15),
    stageEnteredAt: todayAt(6, 15),
    arrivalEta: todayAt(14, 30),
  },

  // ── Triage: just arrived, not yet assigned ─────────────────────────────
  {
    id: "WO-1248",
    busId: 195,
    busNumber: "195",
    issue: "Tire rotation + inspect",
    severity: "routine",
    stage: "triage",
    bayNumber: null,
    garage: "south",
    mechanicName: null,
    partsStatus: "not-needed",
    parts: [],
    createdAt: todayAt(5, 0),
    stageEnteredAt: todayAt(7, 40),
  },

  // ── Diagnosing: Torres actively working it ─────────────────────────────
  {
    id: "WO-1249",
    busId: 56,
    busNumber: "056",
    issue: "Wheelchair ramp hydraulic",
    severity: "high",
    stage: "diagnosing",
    bayNumber: 4,
    garage: "north",
    mechanicName: "Torres, M.",
    partsStatus: "in-stock",
    parts: [{ partId: "hydraulic-cylinder", partName: "Hydraulic Cylinder (ramp)", qty: 1 }],
    createdAt: todayAt(3, 0),
    stageEnteredAt: todayAt(5, 0),
  },

  // ── Diagnosing: stuck, trips the aging tag on the Ops tracker ──────────
  {
    id: "WO-1250",
    busId: 203,
    busNumber: "203",
    issue: "Transmission fluid leak",
    severity: "critical",
    stage: "diagnosing",
    bayNumber: 1,
    garage: "south",
    mechanicName: "Chen, R.",
    partsStatus: "needed",
    parts: [{ partId: "transmission-fluid", partName: "Transmission Fluid (gal)", qty: 3 }],
    createdAt: daysAgoAt(2, 7, 0),
    stageEnteredAt: daysAgoAt(1, 14, 0),
  },

  // ── Held: parts ordered, ETA tomorrow ──────────────────────────────────
  {
    id: "WO-1251",
    busId: 267,
    busNumber: "267",
    issue: "Alternator replacement",
    severity: "high",
    stage: "held",
    bayNumber: 2,
    garage: "south",
    mechanicName: "Chen, R.",
    partsStatus: "ordered",
    parts: [{ partId: "alternator", partName: "Alternator Assembly", qty: 1 }],
    createdAt: yesterdayAt(0, 30),
    stageEnteredAt: yesterdayAt(11, 0),
    blockReason: "parts-ordered",
    blockEta: tomorrowAt(10, 0),
  },

  // ── Held: awaiting bay assignment (all critical bays occupied) ─────────
  {
    id: "WO-1252",
    busId: 41,
    busNumber: "041",
    issue: "Coolant system flush (PM-B)",
    severity: "routine",
    stage: "held",
    bayNumber: null,
    garage: "north",
    mechanicName: null,
    partsStatus: "in-stock",
    parts: [
      { partId: "coolant", partName: "Coolant Concentrate (gal)", qty: 4 },
      { partId: "coolant-hose", partName: "Coolant Hose Assembly", qty: 1 },
    ],
    createdAt: yesterdayAt(6, 0),
    stageEnteredAt: todayAt(6, 30),
    blockReason: "awaiting-bay",
  },

  // ── Repairing: Torres on the rack, critical brake job ──────────────────
  {
    id: "WO-1253",
    busId: 147,
    busNumber: "147",
    issue: "Brake pad replacement",
    severity: "critical",
    stage: "repairing",
    bayNumber: 3,
    garage: "north",
    mechanicName: "Torres, M.",
    partsStatus: "in-stock",
    parts: [
      { partId: "brake-pads", partName: "Brake Pads (set)", qty: 2 },
      { partId: "brake-rotors", partName: "Brake Rotors (pair)", qty: 1 },
    ],
    createdAt: yesterdayAt(5, 30),
    stageEnteredAt: todayAt(6, 15),
  },

  // ── Repairing: mid-job, Vasquez ────────────────────────────────────────
  {
    id: "WO-1254",
    busId: 78,
    busNumber: "078",
    issue: "Engine oil change (PM-A)",
    severity: "routine",
    stage: "repairing",
    bayNumber: 7,
    garage: "north",
    mechanicName: "Vasquez, D.",
    partsStatus: "in-stock",
    parts: [{ partId: "oil-filter", partName: "Oil Filter", qty: 1 }],
    createdAt: todayAt(2, 0),
    stageEnteredAt: todayAt(7, 0),
  },

  // ── Road Test: HVAC repair verifying ready to release ──────────────────
  {
    id: "WO-1255",
    busId: 89,
    busNumber: "089",
    issue: "HVAC compressor failure",
    severity: "high",
    stage: "road-test",
    bayNumber: 5,
    garage: "north",
    mechanicName: "Okafor, E.",
    partsStatus: "in-stock",
    parts: [
      { partId: "hvac-compressor", partName: "HVAC Compressor", qty: 1 },
      { partId: "serpentine-belt", partName: "Serpentine Belt", qty: 1 },
    ],
    createdAt: yesterdayAt(2, 0),
    stageEnteredAt: todayAt(7, 15),
  },

  // ── Road Test: steering fluid leak, final check ────────────────────────
  {
    id: "WO-1256",
    busId: 112,
    busNumber: "112",
    issue: "Steering fluid leak",
    severity: "high",
    stage: "road-test",
    bayNumber: 6,
    garage: "north",
    mechanicName: "Kim, S.",
    partsStatus: "in-stock",
    parts: [{ partId: "steering-fluid", partName: "Power Steering Fluid (qt)", qty: 2 }],
    createdAt: daysAgoAt(2, 4, 0),
    stageEnteredAt: todayAt(7, 0),
  },
  // Pre-seeded PM-A triage WOs — buses that ops already scheduled out of
  // the overdue pool. They sit in Triage unassigned, waiting for a
  // mechanic to pick them up. Gives the mechanic kanban lived-in density
  // and foreshadows the ops-side "Schedule PM service" action.
  {
    id: "WO-1257",
    busId: 55,
    busNumber: "055",
    issue: "PM-A service",
    severity: "routine",
    stage: "triage",
    bayNumber: null,
    garage: "north",
    mechanicName: null,
    partsStatus: "not-needed",
    parts: [
      { partId: "oil-filter", partName: "Oil Filter", qty: 1 },
      { partId: "air-filter", partName: "Engine Air Filter", qty: 1 },
    ],
    createdAt: todayAt(6, 45),
    stageEnteredAt: todayAt(6, 45),
  },
  {
    id: "WO-1258",
    busId: 220,
    busNumber: "220",
    issue: "PM-A service",
    severity: "routine",
    stage: "triage",
    bayNumber: null,
    garage: "south",
    mechanicName: null,
    partsStatus: "not-needed",
    parts: [
      { partId: "oil-filter", partName: "Oil Filter", qty: 1 },
      { partId: "air-filter", partName: "Engine Air Filter", qty: 1 },
    ],
    createdAt: todayAt(7, 10),
    stageEnteredAt: todayAt(7, 10),
  },
];
