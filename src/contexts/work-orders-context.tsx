"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { workOrders as seedWorkOrders } from "@/data/work-orders";
import type { WorkOrder, WorkOrderStage } from "@/data/types";

/**
 * Single source of truth for live work orders, shared across ops and
 * mechanic views. Previously the mechanic view owned the mutable list
 * locally and the ops view read a static module import — which meant
 * ops-initiated actions (e.g. "Schedule PM service") had no way to
 * appear on the mechanic's kanban.
 *
 * Provider lives in <AppShell> so both /fleet-overview and
 * /service-board subscribe to the same store. Session-only state —
 * reloads reset to the seeded mock data.
 */

type WorkOrderDraft = Omit<
  WorkOrder,
  "id" | "createdAt" | "stageEnteredAt"
>;

interface WorkOrdersContextValue {
  workOrders: WorkOrder[];
  addWorkOrder: (draft: WorkOrderDraft) => WorkOrder;
  updateStage: (woId: string, stage: WorkOrderStage) => void;
  completeWorkOrder: (woId: string) => void;
}

const WorkOrdersContext = createContext<WorkOrdersContextValue | null>(null);

export function WorkOrdersProvider({ children }: { children: ReactNode }) {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(seedWorkOrders);

  // Monotonic WO id counter, seeded from the max id in the initial set.
  // Using a ref (not state) so id minting is a pure side-effect of
  // addWorkOrder and isn't duplicated by StrictMode's double-invocation
  // of setState updaters.
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

  const completeWorkOrder = useCallback((woId: string) => {
    setWorkOrders((prev) => prev.filter((wo) => wo.id !== woId));
  }, []);

  return (
    <WorkOrdersContext.Provider
      value={{ workOrders, addWorkOrder, updateStage, completeWorkOrder }}
    >
      {children}
    </WorkOrdersContext.Provider>
  );
}

export function useWorkOrders(): WorkOrdersContextValue {
  const ctx = useContext(WorkOrdersContext);
  if (!ctx)
    throw new Error("useWorkOrders must be used inside <WorkOrdersProvider>");
  return ctx;
}
