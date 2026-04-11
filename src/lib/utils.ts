import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type {
  Bus,
  BusHistoryEntry,
  BusStatus,
  Garage,
  WorkOrder,
} from "@/data/types";

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

/** Window (in days) used to decide whether a cross-garage history entry is
 *  fresh enough to flag as "just arrived from the other garage". */
export const CROSS_GARAGE_CALLOUT_WINDOW_DAYS = 14;

/** Whole calendar days between an ISO timestamp and `now`, never negative. */
export function daysBetween(isoDate: string, now: Date = new Date()): number {
  const then = new Date(isoDate);
  const ms = now.getTime() - then.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

/** Cross-garage callout: if a bus's most-recent service entry happened at the
 *  *other* garage within the last 14 days, surface it so a mechanic sees prior
 *  work the moment they pick the bus up. Returns `null` when there's nothing
 *  worth flagging. */
export function getCrossGarageCallout(
  bus: Bus,
  history: BusHistoryEntry[],
  now: Date = new Date()
): { entry: BusHistoryEntry; daysAgo: number } | null {
  const mostRecent = history[0];
  if (!mostRecent) return null;
  if (mostRecent.garage === bus.garage) return null;
  const daysAgo = daysBetween(mostRecent.date, now);
  if (daysAgo > CROSS_GARAGE_CALLOUT_WINDOW_DAYS) return null;
  return { entry: mostRecent, daysAgo };
}

/** Extract the handful of keywords that identify a repair symptom so we can
 *  match "HVAC compressor failure" against "HVAC refrigerant recharge". Keeping
 *  this naive on purpose — a real EAM would use a parts taxonomy. */
function extractIssueKeywords(issue: string): string[] {
  const KEYWORDS = [
    "hvac",
    "brake",
    "transmission",
    "alternator",
    "coolant",
    "oil",
    "tire",
    "steering",
    "ramp",
    "wheelchair",
    "battery",
    "air brake",
    "compressor",
    "rotor",
    "fluid",
  ];
  const lowered = issue.toLowerCase();
  return KEYWORDS.filter((k) => lowered.includes(k));
}

export interface SimilarIssueMatch {
  busId: number;
  entry: BusHistoryEntry;
  daysAgo: number;
}

/** Search all bus service history for recent entries that share a keyword with
 *  the current issue string. Used by the Log Repair form to help mechanics
 *  spot "has anyone else seen this symptom recently?" before they dive in. */
export function getSimilarRecentIssues(
  issue: string,
  allHistory: Record<number, BusHistoryEntry[]>,
  options: {
    withinDays?: number;
    excludeBusId?: number;
    excludeGarage?: Garage;
    onlyOtherGarage?: boolean;
    now?: Date;
  } = {}
): SimilarIssueMatch[] {
  const {
    withinDays = 30,
    excludeBusId,
    excludeGarage,
    onlyOtherGarage = false,
    now = new Date(),
  } = options;

  const keywords = extractIssueKeywords(issue);
  if (keywords.length === 0) return [];

  const matches: SimilarIssueMatch[] = [];
  for (const [busIdStr, entries] of Object.entries(allHistory)) {
    const busId = Number(busIdStr);
    if (excludeBusId !== undefined && busId === excludeBusId) continue;
    for (const entry of entries) {
      if (onlyOtherGarage && excludeGarage && entry.garage === excludeGarage) {
        continue;
      }
      const entryKeywords = extractIssueKeywords(entry.issue);
      const overlap = keywords.some((k) => entryKeywords.includes(k));
      if (!overlap) continue;
      const daysAgo = daysBetween(entry.date, now);
      if (daysAgo > withinDays) continue;
      matches.push({ busId, entry, daysAgo });
    }
  }

  // Newest first so the peek shows the freshest reference case.
  return matches.sort((a, b) => a.daysAgo - b.daysAgo);
}

/** Hours (integer, non-negative) between an ISO timestamp and `now`. */
export function hoursSince(isoDate: string, now: Date = new Date()): number {
  const then = new Date(isoDate);
  const ms = now.getTime() - then.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60)));
}
