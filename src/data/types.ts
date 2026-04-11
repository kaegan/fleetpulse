export type BusStatus = "running" | "pm-due" | "in-maintenance" | "road-call";

export type Garage = "north" | "south";

export type Severity = "critical" | "high" | "routine";

/** 0 = Intake, 1 = Diagnosing, 2 = Parts Ready, 3 = In Repair, 4 = Road Ready */
export type WorkOrderStage = 0 | 1 | 2 | 3 | 4;

export type PartsStatus = "available" | "ordered" | "n/a";

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
}

/**
 * A completed or historical entry in a bus's service log.
 * Used by the BusDetailPanel to show "everything that's been done to this bus"
 * — especially work performed at the *other* garage.
 */
export type HistoryOutcome = "completed" | "deferred" | "recurring";

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
