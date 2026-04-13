import type { Bus, BusStatus } from "./types";
import { PM_INTERVAL_MILES } from "@/lib/constants";
import { workOrders as seedWorkOrders } from "./work-orders";
import { deriveBusStatuses } from "@/lib/derive-bus-statuses";

/**
 * 300 deterministic bus records.
 * #001–#175 = North Garage, #176–#300 = South Garage
 *
 * Base status distribution (before work-order derivation):
 * ~88% running (265), ~3% PM due (10), ~0% in-maintenance (0), ~3% road-call (9)
 *
 * "In-maintenance" is derived from active work orders via deriveBusStatuses().
 * After derivation with seed WOs: ~27 in-maintenance, ~238 running, 10 PM due, 9 road-call.
 *
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

// Manually pick which bus IDs are *still on the road* with overdue PM — the
// actionable backlog the ops manager sees in the ActionCard. Shrunk from 30
// to 10 because the story is that ops (with AI triage help) has already
// scheduled most overdue buses into the shop. The stragglers that remain
// are what ops needs to pull in next.
const PM_DUE_IDS = new Set([
  3, 22, 61, 104, 142, 155, 188, 210, 240, 285,
]);

const ROAD_CALL_IDS = new Set([
  5, 33, 77, 120, 164, 207, 237, 270, 298,
]);

function generateBuses(): Bus[] {
  const rand = seededRandom(42);
  const buses: Bus[] = [];

  for (let i = 1; i <= 300; i++) {
    const garage = i <= 175 ? "north" : "south";
    const busNumber = String(i).padStart(3, "0");

    // Determine base status — in-maintenance is derived from work orders
    let status: BusStatus;
    if (ROAD_CALL_IDS.has(i)) {
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

/** Raw bus array — seed statuses only. Components should use `useFleet()` for live-reactive data. */
export const baseBuses = generateBuses();

/**
 * Seed-derived bus array: base statuses overridden by the seed work orders.
 * Used by module-scope history generators (status-history.ts,
 * availability-history.ts) that need deterministic data at import time.
 *
 * Components should use `useFleet()` instead for live-reactive data.
 */
export const buses = deriveBusStatuses(baseBuses, seedWorkOrders);
