import type { Bus, WorkOrder } from "@/data/types";

/**
 * Single source of truth for the running ↔ in-maintenance boundary.
 *
 * Any bus with an active (non-done) work order is "in-maintenance".
 * All other buses keep their base status (running, pm-due, road-call).
 * This replaces the old hardcoded ID sets in buses.ts.
 */
export function deriveBusStatuses(
  baseBuses: readonly Bus[],
  workOrders: readonly WorkOrder[]
): Bus[] {
  const activeBusIds = new Set<number>();
  for (const wo of workOrders) {
    if (wo.stage !== "done") {
      activeBusIds.add(wo.busId);
    }
  }

  return baseBuses.map((bus) => {
    if (activeBusIds.has(bus.id)) {
      return bus.status === "in-maintenance"
        ? bus
        : { ...bus, status: "in-maintenance" as const };
    }
    if (bus.status === "in-maintenance") {
      return { ...bus, status: "running" as const };
    }
    return bus;
  });
}
