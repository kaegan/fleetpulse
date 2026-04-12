export type BusStatus = "running" | "pm-due" | "in-maintenance" | "road-call";

export type Garage = "north" | "south";

export type Severity = "critical" | "high" | "routine";

/**
 * Six-stage work order lifecycle aligned with real bus depot workflows:
 *  - inbound   : WO exists, bus not yet in the depot (driver defect, road call, scheduled PM)
 *  - triage    : bus arrived, not yet assigned to a mechanic
 *  - diagnosing: mechanic identifying root cause
 *  - held      : blocked on parts/bay/approval — detour, not a linear step
 *  - repairing : parts kitted, actively wrenching
 *  - road-test : verifying repair before release to dispatch
 */
export type WorkOrderStage =
  | "inbound"
  | "triage"
  | "diagnosing"
  | "held"
  | "repairing"
  | "road-test";

export type PartsStatus = "not-needed" | "in-stock" | "needed" | "ordered";

export type BlockReason =
  | "parts-ordered"
  | "parts-needed"
  | "awaiting-bay"
  | "awaiting-approval"
  | "awaiting-customer"
  | "other";

export interface Bus {
  id: number;
  busNumber: string; // "001" through "300"
  garage: Garage;
  status: BusStatus;
  mileage: number;
  lastPmMileage: number;
  nextPmDueMileage: number;
  lastPmDate: string; // ISO date
  model: string;
  year: number;
}

export interface WorkOrder {
  id: string; // "WO-1247" format
  busId: number;
  busNumber: string;
  issue: string;
  severity: Severity;
  stage: WorkOrderStage;
  bayNumber: number | null;
  garage: Garage;
  mechanicName: string | null;
  partsStatus: PartsStatus;
  createdAt: string; // ISO datetime
  stageEnteredAt: string; // ISO datetime — for time-in-status calc
  /** Reason the WO is parked in Held. Only set when stage === "held". */
  blockReason?: BlockReason;
  /** ETA when the blocker is expected to clear (e.g. parts arrival). ISO datetime. */
  blockEta?: string;
  /** ETA when the bus will physically arrive at the depot. Only meaningful while stage === "inbound". */
  arrivalEta?: string;
  /** Specific parts needed for this work order. */
  parts?: PartRequirement[];
}

/**
 * A completed or historical entry in a bus's service log.
 * Used by the BusDetailPanel to show "everything that's been done to this bus"
 * — especially work performed at the *other* garage.
 */
export type HistoryOutcome = "completed" | "deferred" | "recurring";

export interface Part {
  id: string;
  name: string;
  category: string;
  stockNorth: number;
  stockSouth: number;
  reorderPoint: number;
  monthlyUsageRate: number;
  leadTimeDays: number;
}

export interface PartRequirement {
  partId: string;
  partName: string;
  qty: number;
}

export interface BusHistoryEntry {
  id: string; // "WO-1198" format — historical WO number
  date: string; // ISO datetime — completion date
  garage: Garage; // where the work was done (may differ from bus's current garage)
  issue: string;
  severity: Severity;
  mechanicName: string;
  outcome: HistoryOutcome;
  note?: string; // short 1-line handoff note
}
