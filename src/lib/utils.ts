import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Bus, BusStatus, WorkOrder } from "@/data/types";

/** shadcn class-name helper: merge clsx + tailwind-merge */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Count buses by status, optionally filtered to a garage */
export function getStatusCounts(
  buses: Bus[],
  garage?: "north" | "south"
): Record<BusStatus | "total", number> {
  const filtered = garage ? buses.filter((b) => b.garage === garage) : buses;
  return {
    total: filtered.length,
    running: filtered.filter((b) => b.status === "running").length,
    "pm-due": filtered.filter((b) => b.status === "pm-due").length,
    "in-maintenance": filtered.filter((b) => b.status === "in-maintenance")
      .length,
    "road-call": filtered.filter((b) => b.status === "road-call").length,
  };
}

/** Fleet availability rate as a percentage.
 *  Available = running + pm-due (still operational, just overdue for service).
 *  Unavailable = in-maintenance + road-call. */
export function getAvailabilityRate(buses: Bus[]): number {
  const available = buses.filter(
    (b) => b.status === "running" || b.status === "pm-due"
  ).length;
  return (available / buses.length) * 100;
}

/** Tomorrow's estimated availability: today's available fleet plus
 *  buses with In Repair + QA Check work orders that complete overnight. */
export function getForecastAvailability(
  buses: Bus[],
  workOrders: WorkOrder[]
): number {
  const available = buses.filter(
    (b) => b.status === "running" || b.status === "pm-due"
  ).length;
  const completing = workOrders.filter(
    (wo) => wo.stage === 3 || wo.stage === 4
  ).length;
  return ((available + completing) / buses.length) * 100;
}

/** Format a duration between now and an ISO timestamp as "Xh Ym" or "Xd Yh" */
export function formatTimeInStatus(isoDate: string): string {
  const now = new Date();
  const then = new Date(isoDate);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 60) return `${diffMins}m`;

  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  if (hours < 24) return `${hours}h ${mins}m`;

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours}h`;
}

/** Format bus number with leading zeros */
export function formatBusNumber(id: number): string {
  return String(id).padStart(3, "0");
}

/** Get work orders for a specific bus */
export function getWorkOrdersForBus(
  workOrders: WorkOrder[],
  busId: number
): WorkOrder[] {
  return workOrders.filter((wo) => wo.busId === busId);
}

/** Miles until next PM, can be negative if overdue */
export function milesUntilPm(bus: Bus): number {
  return bus.nextPmDueMileage - bus.mileage;
}

/** Format number with comma separators */
export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}
