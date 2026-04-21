import type { Garage } from "./types";

/**
 * Driver roster. Drivers are tied to a home garage and have a primary
 * assigned bus — the vehicle they're expected to operate each shift
 * when it's available. When the assigned bus is in-maintenance, ops
 * swaps them onto a spare from the same garage.
 *
 * V1 has no auth, so the "signed in" driver is hardcoded in constants
 * (CURRENT_DRIVER_ID). This roster exists so future surfaces (dispatch
 * overview, driver assignment) can look up drivers by garage.
 */
export interface Driver {
  id: string;
  name: string;
  garage: Garage;
  assignedBusId: number;
  shiftStart: string; // "HH:MM" 24h
  shiftEnd: string;
  license: string; // CDL class for realism
}

export const drivers: Driver[] = [
  {
    id: "DRV-104",
    name: "Marcus W.",
    garage: "north",
    assignedBusId: 42,
    shiftStart: "07:00",
    shiftEnd: "15:30",
    license: "CDL-B w/ Passenger Endorsement",
  },
  {
    id: "DRV-118",
    name: "Priya K.",
    garage: "north",
    assignedBusId: 61,
    shiftStart: "06:30",
    shiftEnd: "15:00",
    license: "CDL-B w/ Passenger Endorsement",
  },
  {
    id: "DRV-122",
    name: "Anthony R.",
    garage: "south",
    assignedBusId: 212,
    shiftStart: "07:30",
    shiftEnd: "16:00",
    license: "CDL-B w/ Passenger Endorsement",
  },
];
