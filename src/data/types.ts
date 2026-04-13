export type BusStatus = "running" | "pm-due" | "in-maintenance" | "road-call";

export type Garage = "north" | "south";

export type Severity = "critical" | "high" | "routine";

/**
 * Five-stage work order lifecycle aligned with real bus depot workflows:
 *  - intake    : WO exists, bus not yet in a work bay (en route, awaiting bay)
 *  - triage    : bus in bay, pre-repair investigation (assignment + root-cause)
 *  - repair    : parts kitted, actively wrenching
 *  - road-test : verifying repair before release to dispatch
 *  - done      : repair verified, awaiting dismissal from the board
 *
 * "Held" is an orthogonal boolean flag (isHeld), not a pipeline stage.
 */
export type WorkOrderStage =
  | "intake"
  | "triage"
  | "repair"
  | "road-test"
  | "done";

export type PartsStatus = "not-needed" | "in-stock" | "needed" | "ordered";

export type BlockReason =
  | "parts-ordered"
  | "parts-needed"
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
  /** True when the WO is blocked (parts, approval, etc.). Orthogonal to stage. */
  isHeld?: boolean;
  /** Reason the WO is blocked. Set when isHeld is true. */
  blockReason?: BlockReason;
  /** ETA when the blocker is expected to clear (e.g. parts arrival). ISO datetime. */
  blockEta?: string;
  /** ETA when the bus will physically arrive at the depot. Only meaningful while stage === "intake". */
  arrivalEta?: string;
  /** Specific parts needed for this work order. */
  parts?: PartRequirement[];
  /** True when the system auto-escalated severity to Critical due to accessibility equipment. */
  autoEscalated?: boolean;
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
  /** Set when the mechanic requests a cross-depot transfer for this part. */
  transferRequested?: boolean;
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
