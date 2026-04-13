import type { PartRequirement, WorkOrder } from "./types";

/**
 * 27 work orders exercising the five-stage pipeline.
 * Distribution: 6 Intake, 9 Triage (1 held), 7 Repair (3 held), 5 Road Test, 0 Done.
 * Severity mix: 5 critical / 10 high / 12 routine.
 * Cross-garage: 16 North, 11 South.
 * Torres, M. (CURRENT_MECHANIC) owns 3 North WOs so Mine/All still tells a story.
 *
 * These are the single source of truth for which buses are "in-maintenance".
 * Any bus with an active (non-done) WO here gets derived status "in-maintenance"
 * via deriveBusStatuses(). No separate ID sets needed.
 *
 * Timestamps use hoursAgo(n)/hoursFromNow(n) so the 12h mean threshold and
 * tracker aging tags stay deterministic regardless of when the app is run.
 *
 * Above 12h mean (4): WO-1250 (48h), WO-1264 (36h), WO-1251 (20h), WO-1270 (15h)
 * Within 12h mean: all others.
 */

/** N hours in the past from now (fractional hours are fine). */
function hoursAgo(n: number): string {
  return new Date(Date.now() - n * 60 * 60 * 1000).toISOString();
}

/** N hours in the future from now. */
function hoursFromNow(n: number): string {
  return new Date(Date.now() + n * 60 * 60 * 1000).toISOString();
}

export const workOrders: WorkOrder[] = [
  // ── Intake: road call, bus being towed back to the depot ────────────────
  {
    id: "WO-1247",
    busId: 182,
    busNumber: "182",
    issue: "Air brake compressor (road call)",
    severity: "critical",
    stage: "intake",
    bayNumber: null,
    garage: "south",
    mechanicName: null,
    partsStatus: "needed",
    parts: [{ partId: "air-brake-compressor", partName: "Air Brake Compressor", qty: 1 }],
    createdAt: hoursAgo(5),
    stageEnteredAt: hoursAgo(5),
    arrivalEta: hoursFromNow(3),
  },

  // ── Triage: arrived, not yet assigned ───────────────────────────────────
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
    createdAt: hoursAgo(4),
    stageEnteredAt: hoursAgo(3),
  },

  // ── Triage: Torres actively investigating ──────────────────────────────
  {
    id: "WO-1249",
    busId: 56,
    busNumber: "056",
    issue: "Wheelchair ramp hydraulic",
    severity: "high",
    stage: "triage",
    bayNumber: 4,
    garage: "north",
    mechanicName: "Torres, M.",
    partsStatus: "in-stock",
    parts: [{ partId: "hydraulic-cylinder", partName: "Hydraulic Cylinder (ramp)", qty: 1 }],
    createdAt: hoursAgo(7),
    stageEnteredAt: hoursAgo(5),
  },

  // ── Triage: stuck — ABOVE 12H MEAN (48h in shop, 30h in stage → "Stuck 1d" tag) ──
  {
    id: "WO-1250",
    busId: 203,
    busNumber: "203",
    issue: "Transmission fluid leak",
    severity: "critical",
    stage: "triage",
    bayNumber: 1,
    garage: "south",
    mechanicName: "Chen, R.",
    partsStatus: "needed",
    parts: [{ partId: "transmission-fluid", partName: "Transmission Fluid (gal)", qty: 3 }],
    createdAt: hoursAgo(48),
    stageEnteredAt: hoursAgo(30),
  },

  // ── Triage: held — ABOVE 12H MEAN (20h in shop, parts ordered) ─────────
  {
    id: "WO-1251",
    busId: 267,
    busNumber: "267",
    issue: "Alternator replacement",
    severity: "high",
    stage: "triage",
    bayNumber: 2,
    garage: "south",
    mechanicName: "Chen, R.",
    partsStatus: "ordered",
    parts: [{ partId: "alternator", partName: "Alternator Assembly", qty: 1 }],
    createdAt: hoursAgo(20),
    stageEnteredAt: hoursAgo(14),
    isHeld: true,
    blockReason: "parts-ordered",
    blockEta: hoursFromNow(18),
  },

  // ── Intake: awaiting bay ───────────────────────────────────────────────
  {
    id: "WO-1252",
    busId: 41,
    busNumber: "041",
    issue: "Coolant system flush (PM-B)",
    severity: "routine",
    stage: "intake",
    bayNumber: null,
    garage: "north",
    mechanicName: null,
    partsStatus: "in-stock",
    parts: [
      { partId: "coolant", partName: "Coolant Concentrate (gal)", qty: 4 },
      { partId: "coolant-hose", partName: "Coolant Hose Assembly", qty: 1 },
    ],
    createdAt: hoursAgo(6),
    stageEnteredAt: hoursAgo(4),
  },

  // ── Repair: Torres on the rack, critical brake job ─────────────────────
  {
    id: "WO-1253",
    busId: 147,
    busNumber: "147",
    issue: "Brake pad replacement",
    severity: "critical",
    stage: "repair",
    bayNumber: 3,
    garage: "north",
    mechanicName: "Torres, M.",
    partsStatus: "in-stock",
    parts: [
      { partId: "brake-pads", partName: "Brake Pads (set)", qty: 2 },
      { partId: "brake-rotors", partName: "Brake Rotors (pair)", qty: 1 },
    ],
    createdAt: hoursAgo(8),
    stageEnteredAt: hoursAgo(2),
  },

  // ── Repair: held — ABOVE 12H MEAN (36h in shop, windshield parts ordered) ──
  {
    id: "WO-1264",
    busId: 99,
    busNumber: "099",
    issue: "Windshield replacement (stone damage)",
    severity: "routine",
    stage: "repair",
    bayNumber: 11,
    garage: "north",
    mechanicName: "Petrov, A.",
    partsStatus: "ordered",
    parts: [],
    createdAt: hoursAgo(36),
    stageEnteredAt: hoursAgo(22),
    isHeld: true,
    blockReason: "parts-ordered",
    blockEta: hoursFromNow(14),
  },

  // ── Repair: held — waiting on fuel injector kit, Torres ─────────────────
  {
    id: "WO-1259",
    busId: 134,
    busNumber: "134",
    issue: "Fuel injector replacement",
    severity: "high",
    stage: "repair",
    bayNumber: 8,
    garage: "north",
    mechanicName: "Torres, M.",
    partsStatus: "ordered",
    parts: [
      { partId: "fuel-injector", partName: "Fuel Injector Kit", qty: 1 },
      { partId: "fuel-filter", partName: "Fuel Filter", qty: 1 },
    ],
    createdAt: hoursAgo(9),
    stageEnteredAt: hoursAgo(7),
    isHeld: true,
    blockReason: "parts-ordered",
    blockEta: hoursFromNow(20),
  },

  // ── Repair: mid-job, Vasquez ────────────────────────────────────────────
  {
    id: "WO-1254",
    busId: 78,
    busNumber: "078",
    issue: "Engine oil change (preventive maintenance A)",
    severity: "routine",
    stage: "repair",
    bayNumber: 7,
    garage: "north",
    mechanicName: "Vasquez, D.",
    partsStatus: "in-stock",
    parts: [{ partId: "oil-filter", partName: "Oil Filter", qty: 1 }],
    createdAt: hoursAgo(3),
    stageEnteredAt: hoursAgo(2),
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
    createdAt: hoursAgo(10),
    stageEnteredAt: hoursAgo(2),
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
    createdAt: hoursAgo(11),
    stageEnteredAt: hoursAgo(2),
  },

  // ── Pre-seeded PM-A WOs ─────────────────────────────────────────────────
  {
    id: "WO-1257",
    busId: 55,
    busNumber: "055",
    issue: "Preventive maintenance — A service",
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
    createdAt: hoursAgo(5),
    stageEnteredAt: hoursAgo(5),
  },
  {
    id: "WO-1258",
    busId: 220,
    busNumber: "220",
    issue: "Preventive maintenance — A service",
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
    createdAt: hoursAgo(4),
    stageEnteredAt: hoursAgo(4),
  },

  // ── Additional work orders ──────────────────────────────────────────────

  // Bus 010 — North, Intake: exhaust system
  {
    id: "WO-1260",
    busId: 10,
    busNumber: "010",
    issue: "Exhaust leak — DPF system warning",
    severity: "high",
    stage: "intake",
    bayNumber: null,
    garage: "north",
    mechanicName: null,
    partsStatus: "needed",
    parts: [],
    createdAt: hoursAgo(6),
    stageEnteredAt: hoursAgo(6),
  },

  // Bus 037 — North, Triage: suspension
  {
    id: "WO-1261",
    busId: 37,
    busNumber: "037",
    issue: "Front suspension air bag replacement",
    severity: "high",
    stage: "triage",
    bayNumber: 9,
    garage: "north",
    mechanicName: "Okafor, E.",
    partsStatus: "in-stock",
    parts: [{ partId: "serpentine-belt", partName: "Serpentine Belt", qty: 1 }],
    createdAt: hoursAgo(8),
    stageEnteredAt: hoursAgo(2),
  },

  // Bus 049 — North, Repair: battery system
  {
    id: "WO-1262",
    busId: 49,
    busNumber: "049",
    issue: "Battery bank replacement (12V system)",
    severity: "routine",
    stage: "repair",
    bayNumber: 10,
    garage: "north",
    mechanicName: "Kim, S.",
    partsStatus: "in-stock",
    parts: [],
    createdAt: hoursAgo(9),
    stageEnteredAt: hoursAgo(3),
  },

  // Bus 062 — North, Intake: door mechanism
  {
    id: "WO-1263",
    busId: 62,
    busNumber: "062",
    issue: "Passenger door actuator malfunction",
    severity: "high",
    stage: "intake",
    bayNumber: null,
    garage: "north",
    mechanicName: null,
    partsStatus: "needed",
    parts: [],
    createdAt: hoursAgo(7),
    stageEnteredAt: hoursAgo(5),
  },

  // Bus 131 — North, Road Test: coolant thermostat
  {
    id: "WO-1265",
    busId: 131,
    busNumber: "131",
    issue: "Coolant thermostat replacement",
    severity: "routine",
    stage: "road-test",
    bayNumber: 12,
    garage: "north",
    mechanicName: "Nguyen, T.",
    partsStatus: "in-stock",
    parts: [{ partId: "coolant", partName: "Coolant Concentrate (gal)", qty: 2 }],
    createdAt: hoursAgo(10),
    stageEnteredAt: hoursAgo(2),
  },

  // Bus 145 — North, Triage: tire blowout
  {
    id: "WO-1266",
    busId: 145,
    busNumber: "145",
    issue: "Dual rear tire blowout — rim inspection",
    severity: "critical",
    stage: "triage",
    bayNumber: 13,
    garage: "north",
    mechanicName: "Jackson, L.",
    partsStatus: "needed",
    parts: [{ partId: "tires", partName: "Bus Tire (each)", qty: 2 }],
    createdAt: hoursAgo(6),
    stageEnteredAt: hoursAgo(4),
  },

  // Bus 185 — South, Intake: wheelchair lift
  {
    id: "WO-1267",
    busId: 185,
    busNumber: "185",
    issue: "Wheelchair lift platform motor failure",
    severity: "critical",
    stage: "intake",
    bayNumber: null,
    garage: "south",
    mechanicName: null,
    partsStatus: "needed",
    parts: [{ partId: "hydraulic-cylinder", partName: "Hydraulic Cylinder (ramp)", qty: 1 }],
    createdAt: hoursAgo(5),
    stageEnteredAt: hoursAgo(5),
  },

  // Bus 215 — South, Road Test: HVAC ductwork
  {
    id: "WO-1268",
    busId: 215,
    busNumber: "215",
    issue: "HVAC ductwork condensation — blower motor reseat",
    severity: "routine",
    stage: "road-test",
    bayNumber: 14,
    garage: "south",
    mechanicName: "Vasquez, D.",
    partsStatus: "not-needed",
    parts: [],
    createdAt: hoursAgo(8),
    stageEnteredAt: hoursAgo(2),
  },

  // Bus 245 — South, Triage: fuel system
  {
    id: "WO-1269",
    busId: 245,
    busNumber: "245",
    issue: "Fuel tank sender unit — erratic gauge readings",
    severity: "routine",
    stage: "triage",
    bayNumber: null,
    garage: "south",
    mechanicName: "Petrov, A.",
    partsStatus: "not-needed",
    parts: [],
    createdAt: hoursAgo(7),
    stageEnteredAt: hoursAgo(5),
  },

  // Bus 275 — South, Repair: held — ABOVE 12H MEAN (15h in shop, parts ordered) ──
  {
    id: "WO-1270",
    busId: 275,
    busNumber: "275",
    issue: "Air compressor rebuild kit install",
    severity: "high",
    stage: "repair",
    bayNumber: 15,
    garage: "south",
    mechanicName: "Nguyen, T.",
    partsStatus: "ordered",
    parts: [{ partId: "air-brake-compressor", partName: "Air Brake Compressor", qty: 1 }],
    createdAt: hoursAgo(15),
    stageEnteredAt: hoursAgo(8),
    isHeld: true,
    blockReason: "parts-ordered",
    blockEta: hoursFromNow(16),
  },

  // Bus 290 — South, Road Test: steering gearbox
  {
    id: "WO-1271",
    busId: 290,
    busNumber: "290",
    issue: "Steering gearbox adjustment — play in wheel",
    severity: "high",
    stage: "road-test",
    bayNumber: 16,
    garage: "south",
    mechanicName: "Jackson, L.",
    partsStatus: "in-stock",
    parts: [{ partId: "steering-fluid", partName: "Power Steering Fluid (qt)", qty: 1 }],
    createdAt: hoursAgo(9),
    stageEnteredAt: hoursAgo(2),
  },

  // Bus 295 — South, Triage: electrical multiplexer
  {
    id: "WO-1272",
    busId: 295,
    busNumber: "295",
    issue: "Multiplexing module fault — intermittent lighting",
    severity: "high",
    stage: "triage",
    bayNumber: null,
    garage: "south",
    mechanicName: null,
    partsStatus: "needed",
    parts: [],
    createdAt: hoursAgo(6),
    stageEnteredAt: hoursAgo(4),
  },

  // Bus 300 — South, Intake: PM-B deep service
  {
    id: "WO-1273",
    busId: 300,
    busNumber: "300",
    issue: "Preventive maintenance — B service (deep inspection)",
    severity: "routine",
    stage: "intake",
    bayNumber: null,
    garage: "south",
    mechanicName: null,
    partsStatus: "not-needed",
    parts: [
      { partId: "oil-filter", partName: "Oil Filter", qty: 1 },
      { partId: "air-filter", partName: "Engine Air Filter", qty: 1 },
      { partId: "coolant", partName: "Coolant Concentrate (gal)", qty: 2 },
    ],
    createdAt: hoursAgo(5),
    stageEnteredAt: hoursAgo(5),
  },
];
