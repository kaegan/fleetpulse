import type { Bay } from "./types";
import { workOrders } from "./work-orders";

/**
 * 8 bays per garage (16 total).
 * Bay occupancy is derived from work orders that have a bayNumber assigned.
 */

function generateBays(): Bay[] {
  const bays: Bay[] = [];

  // North Garage — Bays 1-8
  for (let i = 1; i <= 8; i++) {
    const occupant = workOrders.find(
      (wo) => wo.bayNumber === i && wo.garage === "north"
    );
    bays.push({
      number: i,
      garage: "north",
      workOrderId: occupant?.id ?? null,
    });
  }

  // South Garage — Bays 1-8
  for (let i = 1; i <= 8; i++) {
    const occupant = workOrders.find(
      (wo) => wo.bayNumber === i && wo.garage === "south"
    );
    bays.push({
      number: i,
      garage: "south",
      workOrderId: occupant?.id ?? null,
    });
  }

  return bays;
}

export const bays = generateBays();
