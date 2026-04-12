import { buses } from "./buses";
import { getAvailabilityRate } from "@/lib/utils";
import type { Garage } from "./types";

export interface AvailabilityDataPoint {
  date: string; // "YYYY-MM-DD"
  value: number; // availability percentage, e.g. 89.0
}

// Seeded pseudo-random (same LCG as buses.ts, different seed)
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateHistory(
  todayRate: number,
  startRate: number,
  seed: number
): AvailabilityDataPoint[] {
  const rand = seededRandom(seed);
  const days = 30;
  const dailyDrift = (todayRate - startRate) / (days - 1);

  const values: number[] = [];
  let current = startRate;

  for (let i = 0; i < days - 1; i++) {
    values.push(current);

    let delta = dailyDrift;
    delta += (rand() - 0.5) * 0.8;

    if (i >= 9 && i <= 11) {
      delta -= 0.8 + rand() * 0.5;
    }
    if (i >= 12 && i <= 14) {
      delta += 0.5 + rand() * 0.3;
    }

    current = Math.max(80, Math.min(96, current + delta));
    current = Math.round(current * 10) / 10;
  }

  values.push(Math.round(todayRate * 10) / 10);

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

// Fleet-wide
export const availabilityHistory = generateHistory(
  getAvailabilityRate(buses),
  84.2,
  137
);

// Per-depot — each garage gets its own trendline so the sparkline stays
// meaningful when the depot dropdown narrows the scope.
const northBuses = buses.filter((b) => b.garage === "north");
const southBuses = buses.filter((b) => b.garage === "south");

export const depotAvailabilityHistory: Record<Garage, AvailabilityDataPoint[]> =
  {
    north: generateHistory(getAvailabilityRate(northBuses), 83.5, 173),
    south: generateHistory(getAvailabilityRate(southBuses), 85.0, 251),
  };
