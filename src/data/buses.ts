import type { Bus, BusStatus } from "./types";
import { PM_INTERVAL_MILES } from "@/lib/constants";

/**
 * 300 deterministic bus records.
 * #001–#175 = North Garage, #176–#300 = South Garage
 *
 * Status distribution (fixed, not random):
 * ~73% running (219), ~10% PM due (30), ~10% in-maintenance (30), ~7% road-call (21)
 *
 * Buses with active work orders are explicitly set to "in-maintenance".
 * PM-due buses genuinely have mileage > nextPmDueMileage (usage-based triggers).
 */

const BUS_MODELS = [
  "Gillig Low Floor 35'",
  "New Flyer Xcelsior XDE40",
  "ElDorado Axess",
  "Starcraft Allstar",
  "Champion Challenger",
] as const;

// Seeded pseudo-random for deterministic output
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// IDs of buses that have active work orders — always "in-maintenance"
const WO_BUS_IDS = new Set([147, 203, 89, 56, 78, 195, 267, 41, 182, 112]);

// Additional buses in maintenance (in the shop but no featured work order).
// Combined with WO_BUS_IDS this gives us ~30 in maintenance total (20-30 per brief).
const ADDITIONAL_MAINTENANCE_IDS = new Set([
  10, 24, 37, 49, 62, 75, 99, 115, 131, 145,
  185, 199, 215, 230, 245, 255, 275, 290, 295, 300,
]);

// Manually pick which bus IDs get non-running statuses for a realistic distribution.
// This ensures consistent data across renders.
const PM_DUE_IDS = new Set([
  3, 7, 14, 22, 28, 35, 44, 52, 61, 68, 73, 81, 88, 96, 104, 110, 119, 128,
  136, 142, 155, 163, 170, 180, 188, 197, 210, 240, 260, 285,
]);

const ROAD_CALL_IDS = new Set([
  5, 19, 33, 47, 63, 77, 91, 105, 120, 134, 150, 164, 179, 193, 207, 222,
  237, 252, 270, 288, 298,
]);

function generateBuses(): Bus[] {
  const rand = seededRandom(42);
  const buses: Bus[] = [];

  for (let i = 1; i <= 300; i++) {
    const garage = i <= 175 ? "north" : "south";
    const busNumber = String(i).padStart(3, "0");

    // Determine status
    let status: BusStatus;
    if (WO_BUS_IDS.has(i) || ADDITIONAL_MAINTENANCE_IDS.has(i)) {
      status = "in-maintenance";
    } else if (ROAD_CALL_IDS.has(i)) {
      status = "road-call";
    } else if (PM_DUE_IDS.has(i)) {
      status = "pm-due";
    } else {
      status = "running";
    }

    // Mileage: 45,000 to 165,000 — seeded per bus
    const baseMileage = 45000 + Math.floor(rand() * 120000);

    // PM data: last PM was at some prior mileage, next due 6000 miles later
    const milesSinceLastPm =
      status === "pm-due"
        ? PM_INTERVAL_MILES + Math.floor(rand() * 2000) // overdue by up to 2000 mi
        : Math.floor(rand() * PM_INTERVAL_MILES); // within interval

    const lastPmMileage = baseMileage - milesSinceLastPm;
    const nextPmDueMileage = lastPmMileage + PM_INTERVAL_MILES;

    // Last PM date: rough approximation
    const daysAgo = Math.floor(milesSinceLastPm / 120); // ~120 miles/day for transit
    const lastPmDate = new Date(
      Date.now() - daysAgo * 86400_000
    ).toISOString().split("T")[0];

    const year = 2018 + Math.floor(rand() * 6); // 2018-2023
    const modelIndex = Math.floor(rand() * BUS_MODELS.length);

    buses.push({
      id: i,
      busNumber,
      garage,
      status,
      mileage: baseMileage,
      lastPmMileage,
      nextPmDueMileage,
      lastPmDate,
      model: BUS_MODELS[modelIndex],
      year,
    });
  }

  return buses;
}

export const buses = generateBuses();
