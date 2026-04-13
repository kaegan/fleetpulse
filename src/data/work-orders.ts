import type { PartRequirement, StageHistoryEntry, WorkOrder } from "./types";

/**
 * 27 work orders exercising the five-stage pipeline.
 * Distribution: 6 Intake, 9 Triage (1 held), 7 Repair (3 held), 5 Road Test, 0 Done.
 * Severity mix: 5 critical / 10 high / 12 routine.
 * Cross-garage: 16 North, 11 South.
 * Greg T. (CURRENT_MECHANIC) owns 3 North WOs so Mine/All still tells a story.
 *
 * These are the single source of truth for which buses are "in-maintenance".
 * Any bus with an active (non-done) WO here gets derived status "in-maintenance"
 * via deriveBusStatuses(). No separate ID sets needed.
 *
 * Timestamps use hoursAgo(n)/hoursFromNow(n) with fractional hours to produce
 * natural-looking minute values. The 12h mean threshold and tracker aging tags
 * stay deterministic regardless of when the app is run.
 *
 * Above 12h mean (4): WO-1250 (48h), WO-1264 (36h), WO-1251 (20h), WO-1270 (15h)
 * Within 12h mean: all others.
 *
 * stageHistory records every stage transition. The last entry's enteredAt always
 * matches stageEnteredAt. Stage durations sum to total shop time (createdAt → now).
 */

/** N hours in the past from now (fractional hours are fine). */
function hoursAgo(n: number): string {
  return new Date(Date.now() - n * 60 * 60 * 1000).toISOString();
}

/** N hours in the future from now. */
function hoursFromNow(n: number): string {
  return new Date(Date.now() + n * 60 * 60 * 1000).toISOString();
}

/** Build a stageHistory array from a list of [stage, hoursAgo] tuples.
 *  Each tuple says "this stage was entered N hours ago". */
function buildHistory(
  entries: [stage: string, hrsAgo: number][]
): StageHistoryEntry[] {
  return entries.map(([stage, hrsAgo]) => ({
    stage: stage as StageHistoryEntry["stage"],
    enteredAt: hoursAgo(hrsAgo),
  }));
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
    createdAt: hoursAgo(5.12),       // 5h 7m
    stageEnteredAt: hoursAgo(5.12),
    arrivalEta: hoursFromNow(2.62),
    stageHistory: buildHistory([["intake", 5.12]]),
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
    createdAt: hoursAgo(4.38),       // 4h 23m
    stageEnteredAt: hoursAgo(3.05),  // 3h 3m
    stageHistory: buildHistory([["intake", 4.38], ["triage", 3.05]]),
  },

  // ── Triage: Greg actively investigating ──────────────────────────────
  {
    id: "WO-1249",
    busId: 56,
    busNumber: "056",
    issue: "Wheelchair ramp hydraulic",
    severity: "critical",
    stage: "triage",
    bayNumber: 4,
    garage: "north",
    mechanicName: "Greg T.",
    partsStatus: "in-stock",
    parts: [{ partId: "hydraulic-cylinder", partName: "Wheelchair Ramp Hydraulic Cylinder", qty: 1 }],
    createdAt: hoursAgo(6.92),       // 6h 55m
    stageEnteredAt: hoursAgo(4.72),  // 4h 43m
    autoEscalated: true,
    stageHistory: buildHistory([["intake", 6.92], ["triage", 4.72]]),
  },

  // ── Triage: stuck — ABOVE 12H MEAN (48h in shop, ~30h in triage → "Aging 1d+" tag) ──
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
    createdAt: hoursAgo(47.55),      // 1d 23h 33m
    stageEnteredAt: hoursAgo(29.82), // 1d 5h 49m — triggers "Aging 1d+" (≥24h)
    stageHistory: buildHistory([["intake", 47.55], ["triage", 29.82]]),
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
    createdAt: hoursAgo(19.62),      // 19h 37m
    stageEnteredAt: hoursAgo(13.38), // 13h 23m
    isHeld: true,
    blockReason: "parts-ordered",
    blockEta: hoursFromNow(17.45),
    stageHistory: buildHistory([["intake", 19.62], ["triage", 13.38]]),
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
    createdAt: hoursAgo(5.78),       // 5h 47m
    stageEnteredAt: hoursAgo(5.78),
    stageHistory: buildHistory([["intake", 5.78]]),
  },

  // ── Repair: Greg on the rack, critical brake job ─────────────────────
  {
    id: "WO-1253",
    busId: 147,
    busNumber: "147",
    issue: "Brake pad replacement",
    severity: "critical",
    stage: "repair",
    bayNumber: 3,
    garage: "north",
    mechanicName: "Greg T.",
    partsStatus: "needed",
    parts: [
      { partId: "brake-pads", partName: "Brake Pads (set)", qty: 2 },
      { partId: "brake-rotors", partName: "Brake Rotors (pair)", qty: 1 },
    ],
    createdAt: hoursAgo(8.18),       // 8h 11m
    stageEnteredAt: hoursAgo(1.92),  // 1h 55m
    isHeld: true,
    blockReason: "parts-needed",
    stageHistory: buildHistory([["intake", 8.18], ["triage", 5.05], ["repair", 1.92]]),
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
    createdAt: hoursAgo(35.58),      // 1d 11h 35m
    stageEnteredAt: hoursAgo(21.88), // 21h 53m
    isHeld: true,
    blockReason: "parts-ordered",
    blockEta: hoursFromNow(13.72),
    stageHistory: buildHistory([["intake", 35.58], ["triage", 27.42], ["repair", 21.88]]),
  },

  // ── Repair: held — waiting on fuel injector kit, Greg ─────────────────
  {
    id: "WO-1259",
    busId: 134,
    busNumber: "134",
    issue: "Fuel injector replacement",
    severity: "high",
    stage: "repair",
    bayNumber: 8,
    garage: "north",
    mechanicName: "Greg T.",
    partsStatus: "ordered",
    parts: [
      { partId: "fuel-injector", partName: "Fuel Injector Kit", qty: 1 },
      { partId: "fuel-filter", partName: "Fuel Filter", qty: 1 },
    ],
    createdAt: hoursAgo(9.28),       // 9h 17m
    stageEnteredAt: hoursAgo(6.55),  // 6h 33m
    isHeld: true,
    blockReason: "parts-ordered",
    blockEta: hoursFromNow(19.38),
    stageHistory: buildHistory([["intake", 9.28], ["triage", 8.02], ["repair", 6.55]]),
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
    createdAt: hoursAgo(3.52),       // 3h 31m
    stageEnteredAt: hoursAgo(1.68),  // 1h 41m
    stageHistory: buildHistory([["intake", 3.52], ["triage", 2.45], ["repair", 1.68]]),
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
    createdAt: hoursAgo(10.22),      // 10h 13m
    stageEnteredAt: hoursAgo(1.85),  // 1h 51m
    stageHistory: buildHistory([["intake", 10.22], ["triage", 7.88], ["repair", 4.18], ["road-test", 1.85]]),
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
    createdAt: hoursAgo(11.08),      // 11h 5m
    stageEnteredAt: hoursAgo(2.32),  // 2h 19m
    stageHistory: buildHistory([["intake", 11.08], ["triage", 8.72], ["repair", 5.15], ["road-test", 2.32]]),
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
    createdAt: hoursAgo(5.22),       // 5h 13m
    stageEnteredAt: hoursAgo(4.95),  // 4h 57m
    stageHistory: buildHistory([["intake", 5.22], ["triage", 4.95]]),
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
    createdAt: hoursAgo(4.42),       // 4h 25m
    stageEnteredAt: hoursAgo(4.15),  // 4h 9m
    stageHistory: buildHistory([["intake", 4.42], ["triage", 4.15]]),
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
    createdAt: hoursAgo(6.35),       // 6h 21m
    stageEnteredAt: hoursAgo(6.35),
    stageHistory: buildHistory([["intake", 6.35]]),
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
    createdAt: hoursAgo(7.68),       // 7h 41m
    stageEnteredAt: hoursAgo(2.22),  // 2h 13m
    stageHistory: buildHistory([["intake", 7.68], ["triage", 2.22]]),
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
    createdAt: hoursAgo(8.85),       // 8h 51m
    stageEnteredAt: hoursAgo(3.42),  // 3h 25m
    stageHistory: buildHistory([["intake", 8.85], ["triage", 5.98], ["repair", 3.42]]),
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
    createdAt: hoursAgo(7.02),       // 7h 1m
    stageEnteredAt: hoursAgo(7.02),
    stageHistory: buildHistory([["intake", 7.02]]),
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
    createdAt: hoursAgo(9.78),       // 9h 47m
    stageEnteredAt: hoursAgo(1.55),  // 1h 33m
    stageHistory: buildHistory([["intake", 9.78], ["triage", 7.15], ["repair", 3.82], ["road-test", 1.55]]),
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
    createdAt: hoursAgo(5.55),       // 5h 33m
    stageEnteredAt: hoursAgo(3.78),  // 3h 47m
    stageHistory: buildHistory([["intake", 5.55], ["triage", 3.78]]),
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
    parts: [
      { partId: "lift-motor", partName: "Wheelchair Lift Motor", qty: 1 },
      { partId: "hydraulic-cylinder", partName: "Wheelchair Ramp Hydraulic Cylinder", qty: 1 },
    ],
    createdAt: hoursAgo(4.62),       // 4h 37m
    stageEnteredAt: hoursAgo(4.62),
    autoEscalated: true,
    stageHistory: buildHistory([["intake", 4.62]]),
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
    createdAt: hoursAgo(7.95),       // 7h 57m
    stageEnteredAt: hoursAgo(2.28),  // 2h 17m
    stageHistory: buildHistory([["intake", 7.95], ["triage", 5.65], ["repair", 3.48], ["road-test", 2.28]]),
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
    createdAt: hoursAgo(6.58),       // 6h 35m
    stageEnteredAt: hoursAgo(5.18),  // 5h 11m
    stageHistory: buildHistory([["intake", 6.58], ["triage", 5.18]]),
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
    createdAt: hoursAgo(14.75),      // 14h 45m
    stageEnteredAt: hoursAgo(7.88),  // 7h 53m
    isHeld: true,
    blockReason: "parts-ordered",
    blockEta: hoursFromNow(15.82),
    stageHistory: buildHistory([["intake", 14.75], ["triage", 10.92], ["repair", 7.88]]),
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
    createdAt: hoursAgo(9.08),       // 9h 5m
    stageEnteredAt: hoursAgo(2.05),  // 2h 3m
    stageHistory: buildHistory([["intake", 9.08], ["triage", 6.72], ["repair", 4.35], ["road-test", 2.05]]),
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
    createdAt: hoursAgo(5.48),       // 5h 29m
    stageEnteredAt: hoursAgo(3.65),  // 3h 39m
    stageHistory: buildHistory([["intake", 5.48], ["triage", 3.65]]),
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
    createdAt: hoursAgo(4.88),       // 4h 53m
    stageEnteredAt: hoursAgo(4.88),
    stageHistory: buildHistory([["intake", 4.88]]),
  },

  // Bus 168 — North, Triage: securement system failure (auto-escalated)
  {
    id: "WO-1274",
    busId: 168,
    busNumber: "168",
    issue: "Securement track binding — wheelchair tie-down failure",
    severity: "critical",
    stage: "triage",
    bayNumber: null,
    garage: "north",
    mechanicName: "Okafor, E.",
    partsStatus: "needed",
    parts: [{ partId: "securement-track", partName: "Securement Track & Tie-Down Kit", qty: 1 }],
    createdAt: hoursAgo(3.95),       // 3h 57m
    stageEnteredAt: hoursAgo(2.58),  // 2h 35m
    autoEscalated: true,
    stageHistory: buildHistory([["intake", 3.95], ["triage", 2.58]]),
  },
];
