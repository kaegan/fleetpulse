import type { BusStatus, Garage } from "./types";
import { buses } from "./buses";
import { getStatusCounts } from "@/lib/utils";

/**
 * 30-day deterministic history of status counts, per status, pinned to today's
 * actual count at index 29. Each series tells a plausible short story the Ops
 * Manager can read in a glance — is the fleet trending the right way?
 *
 * The "yesterday" value used by the KPI cards is just `series[28].value`.
 *
 * Same seeded LCG shape as availability-history.ts so the look-and-feel is
 * consistent across the mock data layer.
 */

export interface StatusDataPoint {
  date: string; // "YYYY-MM-DD"
  value: number; // absolute count
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface SeriesConfig {
  /** Absolute value on day 0 (30 days ago). */
  startValue: number;
  /** Random seed — use a distinct prime per series for independent noise. */
  seed: number;
  /** Max daily absolute jitter. */
  jitter: number;
  /** Bounded values so numbers never go negative / unreasonable. */
  min: number;
  max: number;
}

function generateSeries(
  todayValue: number,
  config: SeriesConfig
): StatusDataPoint[] {
  const rand = seededRandom(config.seed);
  const days = 30;
  const drift = (todayValue - config.startValue) / (days - 1);

  const values: number[] = [];
  let current = config.startValue;

  for (let i = 0; i < days - 1; i++) {
    values.push(Math.round(current));
    // Linear drift toward today's value + small noise
    let delta = drift + (rand() - 0.5) * config.jitter;
    // Mid-month wobble so the lines don't look mechanical
    if (i >= 9 && i <= 11) delta += (rand() - 0.5) * config.jitter;
    current = Math.max(config.min, Math.min(config.max, current + delta));
  }

  // Pin the final value to today's live count
  values.push(todayValue);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return values.map((value, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (days - 1 - i));
    return {
      date: date.toISOString().split("T")[0],
      value,
    };
  });
}

function buildHistory(): Record<BusStatus, StatusDataPoint[]> {
  const counts = getStatusCounts(buses);

  // Story framing (matches the availability-history narrative at ~85% → ~88%):
  // fleet has been improving — in-maintenance + road calls trending down, PM
  // Due drifting down as overdue buses get pulled in. Running is derived as
  // the residual (fleetTotal − others) so daily sums always equal 300.

  // Generate the three smaller series independently, then derive running.
  const pmDue = generateSeries(counts["pm-due"], {
    startValue: 14, // 4 above today — trending down as ops pulls in overdue buses
    seed: 307,
    jitter: 1.5,
    min: 8,
    max: 18,
  });

  const inMaintenance = generateSeries(counts["in-maintenance"], {
    startValue: 32, // 6 above today — trending down as shop clears backlog
    seed: 401,
    jitter: 2.0,
    min: 22,
    max: 36,
  });

  const roadCall = generateSeries(counts["road-call"], {
    startValue: 12, // 3 above today — trending down
    seed: 509,
    jitter: 1.5,
    min: 5,
    max: 14,
  });

  // Running = fleet total − others. Guarantees sum = 300 every day.
  const running: StatusDataPoint[] = pmDue.map((_, i) => ({
    date: pmDue[i].date,
    value: counts.total - pmDue[i].value - inMaintenance[i].value - roadCall[i].value,
  }));

  return {
    running,
    "pm-due": pmDue,
    "in-maintenance": inMaintenance,
    "road-call": roadCall,
  };
}

export const statusHistory: Record<BusStatus, StatusDataPoint[]> =
  buildHistory();

// Per-depot histories — same shape, scoped to each garage.
function buildDepotHistory(
  garage: Garage
): Record<BusStatus, StatusDataPoint[]> {
  const depotBuses = buses.filter((b) => b.garage === garage);
  const counts = getStatusCounts(depotBuses);
  const seedOffset = garage === "north" ? 600 : 900;

  return {
    running: generateSeries(counts.running, {
      startValue: Math.round(counts.running * 0.94),
      seed: seedOffset + 11,
      jitter: 1.8,
      min: Math.round(counts.running * 0.85),
      max: Math.round(counts.running * 1.1),
    }),
    "pm-due": generateSeries(counts["pm-due"], {
      startValue: Math.max(1, counts["pm-due"] - 2),
      seed: seedOffset + 23,
      jitter: 1.4,
      min: Math.max(0, counts["pm-due"] - 5),
      max: counts["pm-due"] + 5,
    }),
    "in-maintenance": generateSeries(counts["in-maintenance"], {
      startValue: counts["in-maintenance"] + 3,
      seed: seedOffset + 37,
      jitter: 1.2,
      min: Math.max(0, counts["in-maintenance"] - 4),
      max: counts["in-maintenance"] + 6,
    }),
    "road-call": generateSeries(counts["road-call"], {
      startValue: counts["road-call"] + 2,
      seed: seedOffset + 47,
      jitter: 1.0,
      min: Math.max(0, counts["road-call"] - 3),
      max: counts["road-call"] + 4,
    }),
  };
}

export const depotStatusHistory: Record<
  Garage,
  Record<BusStatus, StatusDataPoint[]>
> = {
  north: buildDepotHistory("north"),
  south: buildDepotHistory("south"),
};

/** Convenience: yesterday's value for a given status. */
export function getYesterdayCount(
  status: BusStatus,
  garage?: Garage
): number {
  const history = garage ? depotStatusHistory[garage] : statusHistory;
  const series = history[status];
  return series[series.length - 2].value;
}
