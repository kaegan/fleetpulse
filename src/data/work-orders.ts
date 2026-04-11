import type { WorkOrder } from "./types";

/**
 * 10 hand-authored work orders. Each tells a specific story.
 * Distribution: stages 0-4 spread across, 3 critical / 4 high / 3 routine.
 * Cross-garage: 6 North, 4 South.
 *
 * Stage map: 0=Intake, 1=Diagnosing, 2=Parts Ready, 3=In Repair, 4=Road Ready
 *
 * Timestamps are fixed offsets from "today at 8am" to avoid SSR hydration mismatches.
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

export const workOrders: WorkOrder[] = [
  {
    id: "WO-1247",
    busId: 147,
    busNumber: "147",
    issue: "Brake pad replacement",
    severity: "critical",
    stage: 3,
    bayNumber: 3,
    garage: "north",
    mechanicName: "Torres, M.",
    partsStatus: "available",
    createdAt: yesterdayAt(5, 30),
    stageEnteredAt: todayAt(6, 15),
  },
  {
    id: "WO-1248",
    busId: 203,
    busNumber: "203",
    issue: "Transmission fluid leak",
    severity: "critical",
    stage: 2,
    bayNumber: 1,
    garage: "south",
    mechanicName: "Chen, R.",
    partsStatus: "available",
    createdAt: daysAgoAt(2, 7, 0),
    // Stuck in Parts Ready for 2+ days — trips the aging tag in the tracker
    // so Ops can see the bottleneck at a glance.
    stageEnteredAt: daysAgoAt(2, 10, 0),
  },
  {
    id: "WO-1249",
    busId: 89,
    busNumber: "089",
    issue: "HVAC compressor failure",
    severity: "high",
    stage: 4,
    bayNumber: 5,
    garage: "north",
    mechanicName: "Okafor, E.",
    partsStatus: "available",
    createdAt: yesterdayAt(2, 0),
    stageEnteredAt: todayAt(7, 15),
  },
  {
    id: "WO-1250",
    busId: 56,
    busNumber: "056",
    issue: "Wheelchair ramp hydraulic",
    severity: "high",
    stage: 1,
    bayNumber: null,
    garage: "north",
    mechanicName: null,
    partsStatus: "ordered",
    createdAt: todayAt(3, 0),
    stageEnteredAt: todayAt(5, 0),
  },
  {
    id: "WO-1251",
    busId: 78,
    busNumber: "078",
    issue: "Engine oil change (PM-A)",
    severity: "routine",
    stage: 3,
    bayNumber: 7,
    garage: "north",
    mechanicName: "Torres, M.",
    partsStatus: "n/a",
    createdAt: todayAt(2, 0),
    stageEnteredAt: todayAt(7, 0),
  },
  {
    id: "WO-1252",
    busId: 195,
    busNumber: "195",
    issue: "Tire rotation + inspect",
    severity: "routine",
    stage: 0,
    bayNumber: null,
    garage: "south",
    mechanicName: null,
    partsStatus: "n/a",
    createdAt: todayAt(5, 0),
    stageEnteredAt: todayAt(5, 0),
  },
  {
    id: "WO-1253",
    busId: 267,
    busNumber: "267",
    issue: "Alternator replacement",
    severity: "high",
    stage: 2,
    bayNumber: 2,
    garage: "south",
    mechanicName: "Chen, R.",
    partsStatus: "available",
    createdAt: yesterdayAt(0, 30),
    stageEnteredAt: todayAt(5, 30),
  },
  {
    id: "WO-1254",
    busId: 41,
    busNumber: "041",
    issue: "Coolant system flush (PM-B)",
    severity: "routine",
    stage: 0,
    bayNumber: null,
    garage: "north",
    mechanicName: null,
    partsStatus: "n/a",
    createdAt: yesterdayAt(6, 0),
    stageEnteredAt: yesterdayAt(6, 0),
  },
  {
    id: "WO-1255",
    busId: 182,
    busNumber: "182",
    issue: "Air brake compressor",
    severity: "critical",
    stage: 1,
    bayNumber: 4,
    garage: "south",
    mechanicName: "Vasquez, D.",
    partsStatus: "ordered",
    createdAt: daysAgoAt(3, 2, 0),
    // Stuck in Diagnosing 1.5 days — trips aging tag.
    stageEnteredAt: daysAgoAt(1, 14, 0),
  },
  {
    id: "WO-1256",
    busId: 112,
    busNumber: "112",
    issue: "Steering fluid leak",
    severity: "high",
    stage: 4,
    bayNumber: 6,
    garage: "north",
    mechanicName: "Kim, S.",
    partsStatus: "available",
    createdAt: daysAgoAt(2, 4, 0),
    stageEnteredAt: todayAt(7, 0),
  },
];
