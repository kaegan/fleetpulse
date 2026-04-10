export type BusStatus = "running" | "pm-due" | "in-maintenance" | "road-call";

export type Garage = "north" | "south";

export type Severity = "critical" | "high" | "routine";

/** 0 = Queued, 1 = Diagnosed, 2 = Parts Ready, 3 = In Repair, 4 = QA Check */
export type WorkOrderStage = 0 | 1 | 2 | 3 | 4;

export type PartsStatus = "available" | "ordered" | "n/a";

export type Role = "mechanic" | "ops";

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

export interface Bay {
  number: number; // 1-8
  garage: Garage;
  workOrderId: string | null;
}
