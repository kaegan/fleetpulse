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
    createdAt: todayAt(6, 15),
    stageEnteredAt: todayAt(6, 15),
    arrivalEta: todayAt(14, 30),
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
    createdAt: todayAt(5, 0),
    stageEnteredAt: todayAt(7, 40),
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
    createdAt: todayAt(3, 0),
    stageEnteredAt: todayAt(5, 0),
  },

  // ── Triage: stuck, trips the aging tag on the Ops tracker ──────────────
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
    createdAt: daysAgoAt(2, 7, 0),
    stageEnteredAt: daysAgoAt(1, 14, 0),
  },

  // ── Triage: held — parts ordered, ETA tomorrow ─────────────────────────
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
    createdAt: yesterdayAt(0, 30),
    stageEnteredAt: yesterdayAt(11, 0),
    isHeld: true,
    blockReason: "parts-ordered",
    blockEta: tomorrowAt(10, 0),
  },

  // ── Intake: awaiting bay (all critical bays occupied) ─────────────────
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
    createdAt: yesterdayAt(6, 0),
    stageEnteredAt: todayAt(6, 30),
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
    createdAt: yesterdayAt(5, 30),
    stageEnteredAt: todayAt(6, 15),
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
    createdAt: daysAgoAt(1, 8, 0),
    stageEnteredAt: yesterdayAt(14, 0),
    isHeld: true,
    blockReason: "parts-ordered",
    blockEta: tomorrowAt(14, 0),
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
  // Pre-seeded PM-A WOs — buses that ops already scheduled out of the
  // overdue pool. They sit in Triage unassigned, waiting for a mechanic
  // to pick them up. Gives the mechanic kanban lived-in density and
  // foreshadows the ops-side "Schedule PM service" action.
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
    createdAt: todayAt(6, 45),
    stageEnteredAt: todayAt(6, 45),
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
    createdAt: todayAt(7, 10),
    stageEnteredAt: todayAt(7, 10),
  },

  // ── Additional work orders (buses previously phantom-maintenance) ─────

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
    createdAt: todayAt(5, 30),
    stageEnteredAt: todayAt(5, 30),
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
    createdAt: yesterdayAt(14, 0),
    stageEnteredAt: todayAt(6, 0),
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
    createdAt: yesterdayAt(8, 0),
    stageEnteredAt: todayAt(5, 45),
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
    createdAt: todayAt(4, 15),
    stageEnteredAt: todayAt(6, 30),
  },

  // Bus 099 — North, Repair: held, windshield
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
    createdAt: daysAgoAt(2, 9, 0),
    stageEnteredAt: yesterdayAt(10, 0),
    isHeld: true,
    blockReason: "parts-ordered",
    blockEta: tomorrowAt(16, 0),
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
    createdAt: daysAgoAt(1, 6, 0),
    stageEnteredAt: todayAt(7, 30),
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
    createdAt: todayAt(3, 45),
    stageEnteredAt: todayAt(5, 15),
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
    createdAt: todayAt(5, 0),
    stageEnteredAt: todayAt(5, 0),
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
    createdAt: yesterdayAt(11, 0),
    stageEnteredAt: todayAt(6, 45),
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
    createdAt: todayAt(4, 0),
    stageEnteredAt: todayAt(6, 15),
  },

  // Bus 275 — South, Repair: held, air compressor rebuild
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
    createdAt: daysAgoAt(1, 10, 0),
    stageEnteredAt: yesterdayAt(15, 0),
    isHeld: true,
    blockReason: "parts-ordered",
    blockEta: tomorrowAt(11, 0),
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
    createdAt: daysAgoAt(1, 7, 0),
    stageEnteredAt: todayAt(7, 0),
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
    createdAt: todayAt(3, 30),
    stageEnteredAt: todayAt(5, 45),
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
    createdAt: todayAt(6, 0),
    stageEnteredAt: todayAt(6, 0),
  },
];
