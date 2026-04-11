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

/** Rough daily mileage per bus — used to decide which running buses will
 *  cross their PM threshold overnight. Matches the 120 mi/day assumption
 *  already baked into buses.ts:85 when backfilling last-PM dates. */
const DAILY_MILES_PER_BUS = 120;

/** Heuristic: is this work order a scheduled PM job (vs. a corrective
 *  repair)? WorkOrder has no job-type enum, so we pattern-match the issue
 *  string the same way a mechanic would skim it. Kept intentionally narrow
 *  — adding more keywords is cheap if the mock data grows. */
function isPmWorkOrder(wo: WorkOrder): boolean {
  return /\bPM-[AB]\b|oil change|coolant|tire rotation|inspect/i.test(
    wo.issue
  );
}

/** Tomorrow's estimated counts per status. Every term here should be
 *  traceable to something a user can already see in the UI, so the four
 *  count cards, the Fleet Availability card, and the Fleet Health
 *  Distribution chart all tell the same story.
 *
 *  Signals we use:
 *   - Stage 3/4 work orders (In Repair + Road Ready) finish overnight →
 *     those buses move from in-maintenance back into the available pool.
 *     Visible in the In Maintenance drill-down sheet and the WO tracker.
 *   - A completing WO classified as a PM job returns its bus to `running`
 *     (the PM is now fresh). A completing repair returns it to whatever
 *     its pre-repair bucket was — for simplicity we treat that as
 *     `running` too, since repair WOs are generated off road calls /
 *     breakdowns, not PM backlog.
 *   - Running buses within ~1 day of their PM threshold roll over into
 *     pm-due. Visible as the dots immediately right of the PM Due line
 *     in the Fleet Health Distribution chart.
 *   - Road calls are inherently unpredictable, so forecast = today. We
 *     deliberately avoid fabricating a trend.
 *
 *  Invariant: forecast totals still sum to `buses.length`. */
export function getForecastCounts(
  buses: Bus[],
  workOrders: WorkOrder[]
): Record<BusStatus, number> {
  const counts = getStatusCounts(buses);

  // Stage 3/4 WOs — these buses leave in-maintenance overnight.
  const completing = workOrders.filter(
    (wo) => wo.stage === 3 || wo.stage === 4
  );
  const completingPm = completing.filter(isPmWorkOrder).length;
  const completingRepair = completing.length - completingPm;
  const totalCompleting = completingPm + completingRepair;

  // Running buses about to cross their PM threshold — the dots hugging
  // the right side of the PM Due line in the Fleet Health chart.
  const rollingIntoPmDue = buses.filter(
    (b) =>
      b.status === "running" &&
      milesUntilPm(b) > 0 &&
      milesUntilPm(b) <= DAILY_MILES_PER_BUS
  ).length;

  return {
    // Running gains both PM and repair completions, loses buses rolling
    // into pm-due. A completed PM job *was* a pm-due bus, so it doesn't
    // touch the pm-due column here — it left that column when it entered
    // the shop.
    running: counts.running + totalCompleting - rollingIntoPmDue,
    "pm-due": counts["pm-due"] + rollingIntoPmDue,
    "in-maintenance": Math.max(0, counts["in-maintenance"] - totalCompleting),
    "road-call": counts["road-call"],
  };
}

/** Tomorrow's estimated *available* bus count (running + pm-due). Single
 *  source of truth for the primary Fleet Availability card's "X buses"
 *  sub-label, so it can never drift from the four count cards. */
export function getForecastAvailableCount(
  buses: Bus[],
  workOrders: WorkOrder[]
): number {
  const fc = getForecastCounts(buses, workOrders);
  return fc.running + fc["pm-due"];
}

/** Tomorrow's estimated availability rate as a percentage. Derived from
 *  getForecastAvailableCount so the rate and the count can never
 *  disagree. */
export function getForecastAvailability(
  buses: Bus[],
  workOrders: WorkOrder[]
): number {
  return (getForecastAvailableCount(buses, workOrders) / buses.length) * 100;
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
