"use client";

import { useMemo } from "react";
import { buses } from "@/data/buses";
import { workOrders } from "@/data/work-orders";
import type { Bus } from "@/data/types";
import { milesUntilPm } from "@/lib/utils";
import { useDepot, filterByDepot } from "@/hooks/use-depot";

/**
 * Single source of truth for the mechanic-side "Pull In Next" planning
 * surface (JTBD M-3). Feeds both the Service Board count banner and the
 * PM sheet drawer, so their counts never drift.
 *
 * Excludes any bus that already has an active work order — those are
 * already being worked in the kanban, so they don't belong in a "what
 * should I pull in next" list.
 */

export interface OverdueCandidate {
  bus: Bus;
  /** Miles past the PM due mileage. Always positive. */
  milesOverdue: number;
}

export interface ComingDueCandidate {
  bus: Bus;
  /** Miles remaining until PM due. Always positive, <= window. */
  milesRemaining: number;
}

/**
 * A bus enters "coming due" when it's within this many miles of its next
 * PM. Chosen at ~8% of the 6,000-mi interval — enough lead time for a
 * mechanic to plan a pull-in before the bus goes overdue on route.
 */
export const PM_COMING_DUE_WINDOW_MI = 500;

export function useOverdueCandidates(): {
  overdue: OverdueCandidate[];
  comingDue: ComingDueCandidate[];
} {
  const { scope } = useDepot();

  return useMemo(() => {
    const busesWithActiveWO = new Set(workOrders.map((wo) => wo.busId));
    const scoped = filterByDepot(buses, scope).filter(
      (bus) => !busesWithActiveWO.has(bus.id)
    );

    const overdue: OverdueCandidate[] = [];
    const comingDue: ComingDueCandidate[] = [];

    for (const bus of scoped) {
      const untilPm = milesUntilPm(bus);
      if (untilPm <= 0) {
        overdue.push({ bus, milesOverdue: -untilPm });
      } else if (untilPm <= PM_COMING_DUE_WINDOW_MI) {
        comingDue.push({ bus, milesRemaining: untilPm });
      }
    }

    // Most urgent first in each section.
    overdue.sort((a, b) => b.milesOverdue - a.milesOverdue);
    comingDue.sort((a, b) => a.milesRemaining - b.milesRemaining);

    return { overdue, comingDue };
  }, [scope]);
}
