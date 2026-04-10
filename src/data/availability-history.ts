import { buses } from "./buses";
import { getAvailabilityRate } from "@/lib/utils";

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

function generateAvailabilityHistory(): AvailabilityDataPoint[] {
  const rand = seededRandom(137);
  const todayRate = getAvailabilityRate(buses);
  const days = 30;

  // Story: fleet started at ~84% (industry average) and has been
  // improving toward the 95% target over the past month.
  const startRate = 84.2;
  const dailyDrift = (todayRate - startRate) / (days - 1);

  const values: number[] = [];
  let current = startRate;

  for (let i = 0; i < days - 1; i++) {
    values.push(current);

    // Upward drift toward today's rate
    let delta = dailyDrift;

    // Random daily noise
    delta += (rand() - 0.5) * 0.8;

    // Small dip around day 10-12 (a bad week — road calls spiked)
    if (i >= 9 && i <= 11) {
      delta -= 0.8 + rand() * 0.5;
    }
    // Recovery after dip
    if (i >= 12 && i <= 14) {
      delta += 0.5 + rand() * 0.3;
    }

    current = Math.max(80, Math.min(96, current + delta));
    current = Math.round(current * 10) / 10;
  }

  // Pin final value to live rate
  values.push(Math.round(todayRate * 10) / 10);

  // Generate date strings (midnight-anchored to avoid hydration issues)
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

export const availabilityHistory = generateAvailabilityHistory();
