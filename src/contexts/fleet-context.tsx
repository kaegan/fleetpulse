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
import { parts as seedParts } from "@/data/parts";
import { busHistory as seedBusHistory } from "@/data/bus-history";
import { deriveBusStatuses } from "@/lib/derive-bus-statuses";
import { PM_INTERVAL_MILES } from "@/lib/constants";
import type {
  Bus,
  BusHistoryEntry,
  CompletedWorkOrder,
  Part,
  WorkOrder,
  WorkOrderStage,
} from "@/data/types";

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
  completedWorkOrders: CompletedWorkOrder[];
  parts: Part[];
  getBusHistory: (busId: number) => BusHistoryEntry[];
  addWorkOrder: (draft: WorkOrderDraft) => WorkOrder;
  updateStage: (woId: string, stage: WorkOrderStage) => void;
  updateWorkOrder: (woId: string, patch: Partial<WorkOrder>) => void;
  dismissWorkOrder: (woId: string) => void;
}

const FleetContext = createContext<FleetContextValue | null>(null);

function cloneBusHistory(): Record<number, BusHistoryEntry[]> {
  return Object.fromEntries(
    Object.entries(seedBusHistory).map(([busId, entries]) => [
      Number(busId),
      entries.map((entry) => ({ ...entry })),
    ])
  ) as Record<number, BusHistoryEntry[]>;
}

function isPmWorkOrder(wo: WorkOrder): boolean {
  return /\bpreventive maintenance\b|\bPM[-\s]?[AB]\b/i.test(wo.issue);
}

function makeHistoryEntry(
  wo: WorkOrder,
  completedAt: string
): BusHistoryEntry {
  return {
    id: wo.id,
    date: completedAt,
    garage: wo.garage,
    issue: wo.issue,
    severity: wo.severity,
    mechanicName: wo.mechanicName ?? "Unassigned",
    outcome: "completed",
  };
}

function consumePartsStock(parts: readonly Part[], wo: WorkOrder): Part[] {
  const requirements = wo.parts ?? [];
  if (requirements.length === 0) return [...parts];

  const localKey = wo.garage === "north" ? "stockNorth" : "stockSouth";
  const otherKey = wo.garage === "north" ? "stockSouth" : "stockNorth";

  return parts.map((part) => {
    const matching = requirements.filter((req) => req.partId === part.id);
    if (matching.length === 0) return part;

    let localStock = part[localKey];
    let otherStock = part[otherKey];

    for (const req of matching) {
      const localUsed = Math.min(localStock, req.qty);
      localStock -= localUsed;

      const remaining = req.qty - localUsed;
      if (remaining > 0 && req.transferRequested) {
        otherStock = Math.max(0, otherStock - remaining);
      }
    }

    return {
      ...part,
      [localKey]: localStock,
      [otherKey]: otherStock,
    };
  });
}

export function FleetProvider({ children }: { children: ReactNode }) {
  const [baseFleetBuses, setBaseFleetBuses] = useState<Bus[]>(baseBuses);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(seedWorkOrders);
  const [completedWorkOrders, setCompletedWorkOrders] = useState<
    CompletedWorkOrder[]
  >([]);
  const [parts, setParts] = useState<Part[]>(seedParts);
  const [serviceHistory, setServiceHistory] =
    useState<Record<number, BusHistoryEntry[]>>(cloneBusHistory);

  const workOrdersRef = useRef<WorkOrder[]>(seedWorkOrders);
  const completedIdsRef = useRef<Set<string>>(new Set());

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
    const next = [...workOrdersRef.current, created];
    workOrdersRef.current = next;
    setWorkOrders(next);
    return created;
  }, []);

  const recordCompletion = useCallback((wo: WorkOrder): void => {
    if (completedIdsRef.current.has(wo.id)) return;

    const completedAt =
      wo.stage === "done" ? wo.stageEnteredAt : new Date().toISOString();
    const completed: CompletedWorkOrder = {
      ...wo,
      stage: "done",
      stageEnteredAt: completedAt,
      completedAt,
    };
    const pmJob = isPmWorkOrder(completed);
    const serviceDate = completedAt.split("T")[0];

    completedIdsRef.current.add(completed.id);
    setCompletedWorkOrders((prev) => [completed, ...prev]);
    setServiceHistory((prev) => {
      const existing = prev[completed.busId] ?? [];
      if (existing.some((entry) => entry.id === completed.id)) return prev;
      return {
        ...prev,
        [completed.busId]: [makeHistoryEntry(completed, completedAt), ...existing],
      };
    });
    setParts((prev) => consumePartsStock(prev, completed));
    setBaseFleetBuses((prev) =>
      prev.map((bus) => {
        if (bus.id !== completed.busId) return bus;

        if (pmJob) {
          return {
            ...bus,
            status: bus.status === "pm-due" ? "running" : bus.status,
            lastPmMileage: bus.mileage,
            nextPmDueMileage: bus.mileage + PM_INTERVAL_MILES,
            lastPmDate: serviceDate,
          };
        }

        if (bus.status === "road-call") {
          return { ...bus, status: "running" };
        }

        return bus;
      })
    );
  }, []);

  const updateStage = useCallback(
    (woId: string, stage: WorkOrderStage) => {
      const existing = workOrdersRef.current.find((wo) => wo.id === woId);
      if (!existing) return;

      const now = new Date().toISOString();
      const updated: WorkOrder = { ...existing, stage, stageEnteredAt: now };
      const next = workOrdersRef.current.map((wo) =>
        wo.id === woId ? updated : wo
      );

      workOrdersRef.current = next;
      setWorkOrders(next);
      if (existing.stage !== "done" && stage === "done") {
        recordCompletion(updated);
      }
    },
    [recordCompletion]
  );

  const updateWorkOrder = useCallback(
    (woId: string, patch: Partial<WorkOrder>) => {
      const existing = workOrdersRef.current.find((wo) => wo.id === woId);
      if (!existing) return;

      const stageChanged =
        patch.stage !== undefined && patch.stage !== existing.stage;
      const now = new Date().toISOString();
      const updated: WorkOrder = {
        ...existing,
        ...patch,
        ...(stageChanged && !patch.stageEnteredAt
          ? { stageEnteredAt: now }
          : {}),
      };
      const next = workOrdersRef.current.map((wo) =>
        wo.id === woId ? updated : wo
      );

      workOrdersRef.current = next;
      setWorkOrders(next);
      if (existing.stage !== "done" && updated.stage === "done") {
        recordCompletion(updated);
      }
    },
    [recordCompletion]
  );

  const dismissWorkOrder = useCallback(
    (woId: string) => {
      const existing = workOrdersRef.current.find((wo) => wo.id === woId);
      if (existing?.stage === "done") recordCompletion(existing);

      const dismissedAt = new Date().toISOString();
      const next = workOrdersRef.current.filter((wo) => wo.id !== woId);
      workOrdersRef.current = next;
      setWorkOrders(next);
      setCompletedWorkOrders((prev) =>
        prev.map((wo) => (wo.id === woId ? { ...wo, dismissedAt } : wo))
      );
    },
    [recordCompletion]
  );

  const buses = useMemo(
    () => deriveBusStatuses(baseFleetBuses, workOrders),
    [baseFleetBuses, workOrders]
  );

  const getBusHistory = useCallback(
    (busId: number): BusHistoryEntry[] => {
      const entries = serviceHistory[busId] ?? [];
      return [...entries].sort((a, b) => b.date.localeCompare(a.date));
    },
    [serviceHistory]
  );

  return (
    <FleetContext.Provider
      value={{
        buses,
        workOrders,
        completedWorkOrders,
        parts,
        getBusHistory,
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
