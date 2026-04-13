"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { baseBuses } from "@/data/buses";
import { workOrders as seedWorkOrders } from "@/data/work-orders";
import { deriveBusStatuses } from "@/lib/derive-bus-statuses";
import type { Bus, WorkOrder, WorkOrderStage } from "@/data/types";

/**
 * Unified fleet state provider. Owns the mutable work-order list and derives
 * a live `buses` array where each bus's status reflects current work-order
 * state via `deriveBusStatuses`.
 *
 * Replaces the old `WorkOrdersProvider` + `useBuses` pair with a single
 * context so every view reads the same derived bus array without needing
 * two separate hook calls.
 */

type WorkOrderDraft = Omit<WorkOrder, "id" | "createdAt" | "stageEnteredAt">;

interface FleetContextValue {
  buses: Bus[];
  workOrders: WorkOrder[];
  addWorkOrder: (draft: WorkOrderDraft) => WorkOrder;
  updateStage: (woId: string, stage: WorkOrderStage) => void;
  updateWorkOrder: (woId: string, patch: Partial<WorkOrder>) => void;
  dismissWorkOrder: (woId: string) => void;
}

const FleetContext = createContext<FleetContextValue | null>(null);

export function FleetProvider({ children }: { children: ReactNode }) {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(seedWorkOrders);

  // Monotonic WO id counter — ref to avoid StrictMode double-invocation issues.
  const nextIdNumRef = useRef<number>(
    seedWorkOrders.reduce((max, wo) => {
      const n = parseInt(wo.id.replace("WO-", ""), 10);
      return Number.isFinite(n) && n > max ? n : max;
    }, 0) + 1
  );

  const addWorkOrder = useCallback((draft: WorkOrderDraft): WorkOrder => {
    const now = new Date().toISOString();
    const newId = `WO-${nextIdNumRef.current++}`;
    const created: WorkOrder = {
      ...draft,
      id: newId,
      createdAt: now,
      stageEnteredAt: now,
    };
    setWorkOrders((prev) => [...prev, created]);
    return created;
  }, []);

  const updateStage = useCallback(
    (woId: string, stage: WorkOrderStage) => {
      setWorkOrders((prev) =>
        prev.map((wo) =>
          wo.id === woId
            ? { ...wo, stage, stageEnteredAt: new Date().toISOString() }
            : wo
        )
      );
    },
    []
  );

  const updateWorkOrder = useCallback(
    (woId: string, patch: Partial<WorkOrder>) => {
      setWorkOrders((prev) =>
        prev.map((wo) => (wo.id === woId ? { ...wo, ...patch } : wo))
      );
    },
    []
  );

  const dismissWorkOrder = useCallback((woId: string) => {
    setWorkOrders((prev) => prev.filter((wo) => wo.id !== woId));
  }, []);

  const buses = useMemo(
    () => deriveBusStatuses(baseBuses, workOrders),
    [workOrders]
  );

  return (
    <FleetContext.Provider
      value={{
        buses,
        workOrders,
        addWorkOrder,
        updateStage,
        updateWorkOrder,
        dismissWorkOrder,
      }}
    >
      {children}
    </FleetContext.Provider>
  );
}

export function useFleet(): FleetContextValue {
  const ctx = useContext(FleetContext);
  if (!ctx) throw new Error("useFleet must be used inside <FleetProvider>");
  return ctx;
}
