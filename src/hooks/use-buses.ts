"use client";

import { useMemo } from "react";
import { baseBuses } from "@/data/buses";
import { useWorkOrders } from "@/contexts/work-orders-context";
import { deriveBusStatuses } from "@/lib/derive-bus-statuses";
import type { Bus } from "@/data/types";

/**
 * Returns the full bus array with statuses derived from live work orders.
 * Components should use this instead of importing `buses` directly so that
 * bus statuses stay in sync with the service board.
 */
export function useBuses(): Bus[] {
  const { workOrders } = useWorkOrders();
  return useMemo(
    () => deriveBusStatuses(baseBuses, workOrders),
    [workOrders]
  );
}
