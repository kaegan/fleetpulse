"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";
import { KanbanBoard } from "./kanban-board";
import { ScopeToggle } from "./scope-toggle";
import { LogRepairForm, type LogRepairFormSnapshot } from "./log-repair-form";
import { BusDetailPanel } from "@/components/bus-detail-panel";
import { WorkOrderDetailPanel } from "@/components/work-order-detail-panel";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { buses } from "@/data/buses";
import { useWorkOrders } from "@/contexts/work-orders-context";
import { CURRENT_MECHANIC, stageIndex } from "@/lib/constants";
import { useDepot, filterByDepot } from "@/hooks/use-depot";
import { usePanelNav } from "@/hooks/use-panel-nav";
import type {
  BlockReason,
  Bus,
  BusHistoryEntry,
  Garage,
  PartRequirement,
  PartsStatus,
  Severity,
  WorkOrder,
  WorkOrderStage,
} from "@/data/types";

/**
 * Resolve a requested stage transition against the parts gate.
 *
 * Forward-only gate: dragging a WO into Repairing while parts are unresolved
 * auto-routes to Held with the matching blocker reason. Backward drags always
 * succeed — mechanics need to correct their own mistakes without admin help
 * (per PRODUCT_SPEC.md §2). Held → Repairing still has to pass through the
 * parts gate like any other forward move.
 */
function resolveStageTransition(
  wo: WorkOrder,
  requested: WorkOrderStage
): { stage: WorkOrderStage; blockReason?: BlockReason; notice?: string } {
  const isForward = stageIndex(requested) > stageIndex(wo.stage);
  if (!isForward) return { stage: requested };

  if (requested === "repairing") {
    if (wo.partsStatus === "needed") {
      return {
        stage: "held",
        blockReason: "parts-needed",
        notice: "Parts haven't been ordered — parked in Held.",
      };
    }
    if (wo.partsStatus === "ordered") {
      return {
        stage: "held",
        blockReason: "parts-ordered",
        notice: "Parts on order — parked in Held until the kit arrives.",
      };
    }
  }

  return { stage: requested };
}

type MineScope = "mine" | "all";

// Subtitle suffix keyed by global depot scope. The h1 stays "Service Board";
// garage context comes from the top-bar dropdown, not the page header.
const SUBTITLE: Record<"all" | "north" | "south", string> = {
  all: "active work orders in fleet",
  north: "active work orders in garage",
  south: "active work orders in garage",
};

// Panels on Service Board: kanban → WO, WO ↔ bus drill-downs, bus →
// history entry. PM scheduling lives on ops — see ops-view.tsx's
// handleSchedulePm — so the mechanic no longer has a PM queue surface.
type MechanicPanelEntry =
  | { kind: "bus"; label: string; bus: Bus }
  | { kind: "workOrder"; label: string; workOrder: WorkOrder }
  | { kind: "historyEntry"; label: string; entry: BusHistoryEntry; bus: Bus };

export function MechanicView() {
  const { workOrders: orders, addWorkOrder, updateWorkOrder, completeWorkOrder } =
    useWorkOrders();
  const [scope, setScope] = useState<MineScope>("mine");
  const [isLogOpen, setIsLogOpen] = useState(false);
  const formDraftRef = useRef<LogRepairFormSnapshot | null>(null);
  const { scope: depotScope } = useDepot();

  const nav = usePanelNav<MechanicPanelEntry>();
  const current = nav.current;

  // Root-entry opens come from the page (kanban, intake form). These
  // reset the stack so no back button is shown on the target.
  const openBusRoot = useCallback(
    (bus: Bus) =>
      nav.open({ kind: "bus", label: `Bus #${bus.busNumber}`, bus }),
    [nav]
  );
  const openWorkOrderRoot = useCallback(
    (wo: WorkOrder) => nav.open({ kind: "workOrder", label: wo.id, workOrder: wo }),
    [nav]
  );

  // Drill-down opens come from inside an already-open panel — push on
  // top of the stack and let the hook handle the 320ms handoff + back
  // wiring.
  const drillToBus = useCallback(
    (bus: Bus) =>
      nav.drill({ kind: "bus", label: `Bus #${bus.busNumber}`, bus }),
    [nav]
  );
  const drillToWorkOrder = useCallback(
    (wo: WorkOrder) => nav.drill({ kind: "workOrder", label: wo.id, workOrder: wo }),
    [nav]
  );
  const drillToHistoryEntry = useCallback(
    (entry: BusHistoryEntry, bus: Bus) =>
      nav.drill({ kind: "historyEntry", label: entry.id, entry, bus }),
    [nav]
  );

  // When the user clicks "Log new repair", we need a concrete garage to
  // assign the new WO to. If scope is "all", default to north (the demo
  // mechanic's home garage). If scope is north/south, use that.
  const newRepairGarage: Garage = depotScope === "all" ? "north" : depotScope;

  const handleStageChange = useCallback(
    (woId: string, newStage: WorkOrderStage) => {
      const wo = orders.find((o) => o.id === woId);
      if (!wo) return;

      const { stage, blockReason, notice } = resolveStageTransition(
        wo,
        newStage
      );

      // Always surface the notice — even when the card doesn't actually
      // move (e.g. clicking advance on a blocked Held card). Otherwise
      // the mechanic clicks the button and nothing happens.
      if (notice) toast(notice);

      if (stage === wo.stage) return;

      const now = new Date().toISOString();
      updateWorkOrder(woId, {
        stage,
        stageEnteredAt: now,
        // Preserve blockReason when landing in Held, clear it otherwise.
        blockReason:
          stage === "held" ? blockReason ?? wo.blockReason : undefined,
        blockEta: stage === "held" ? wo.blockEta : undefined,
      });
    },
    [orders, updateWorkOrder]
  );

  const handleUpdateParts = useCallback(
    (woId: string, partsStatus: PartsStatus) => {
      updateWorkOrder(woId, { partsStatus });
    },
    [updateWorkOrder]
  );

  const handleUpdatePartsList = useCallback(
    (woId: string, parts: PartRequirement[]) => {
      updateWorkOrder(woId, { parts });
    },
    [updateWorkOrder]
  );

  const handleComplete = useCallback(
    (woId: string) => {
      completeWorkOrder(woId);
    },
    [completeWorkOrder]
  );

  const handleCreate = useCallback(
    (draft: {
      busId: number;
      busNumber: string;
      issue: string;
      severity: Severity;
      assignedTo: string | null;
    }) => {
      const newOrder = addWorkOrder({
        busId: draft.busId,
        busNumber: draft.busNumber,
        issue: draft.issue,
        severity: draft.severity,
        // New WOs land in Triage — the mechanic has the bus in the yard
        // and still needs to do the walk-around before Diagnosing.
        stage: "triage",
        bayNumber: null,
        garage: newRepairGarage,
        mechanicName: draft.assignedTo,
        partsStatus: "not-needed",
      });

      setIsLogOpen(false);
      toast(
        <span>
          Logged as <strong style={{ fontFamily: "monospace" }}>{newOrder.id}</strong>
        </span>,
        scope === "mine"
          ? {
              action: {
                label: "View in All →",
                onClick: () => setScope("all"),
              },
            }
          : undefined
      );
    },
    [addWorkOrder, scope, newRepairGarage]
  );

  // Mechanic sees the work orders in their current depot scope. Defaults to
  // "all" globally; the user can scope down via the top-bar pill.
  const garageOrders = useMemo(
    () => filterByDepot(orders, depotScope),
    [orders, depotScope]
  );

  const mineCount = useMemo(
    () => garageOrders.filter((wo) => wo.mechanicName === CURRENT_MECHANIC).length,
    [garageOrders]
  );

  const visibleOrders =
    scope === "mine"
      ? garageOrders.filter((wo) => wo.mechanicName === CURRENT_MECHANIC)
      : garageOrders;

  // Derive per-panel props from `current`. Each panel opens only when
  // `current` matches its kind; everything else reads null and stays
  // closed. The WO is re-looked-up in `orders` so stage-advance /
  // complete updates the sheet in place, and the sheet auto-closes
  // if the WO is completed (removed from orders).
  const currentBus = current?.kind === "bus" ? current.bus : null;
  const liveSelectedWorkOrder = useMemo(() => {
    if (current?.kind !== "workOrder") return null;
    return orders.find((wo) => wo.id === current.workOrder.id) ?? null;
  }, [current, orders]);
  const liveSelectedWorkOrderBus = useMemo(
    () =>
      liveSelectedWorkOrder
        ? buses.find((b) => b.id === liveSelectedWorkOrder.busId) ?? null
        : null,
    [liveSelectedWorkOrder]
  );
  // History entries are immutable, so they bypass the live re-lookup
  // pattern used for active WOs. The bus is carried inside the entry.
  const currentHistoryEntry =
    current?.kind === "historyEntry" ? current.entry : null;
  const currentHistoryEntryBus =
    current?.kind === "historyEntry" ? current.bus : null;

  // Most-recently-created unique bus numbers in this garage, for the form's
  // "Recent" chip row.
  const recentBusNumbers = useMemo(() => {
    const sorted = [...garageOrders].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
    const seen = new Set<string>();
    const result: string[] = [];
    for (const wo of sorted) {
      if (seen.has(wo.busNumber)) continue;
      seen.add(wo.busNumber);
      result.push(wo.busNumber);
      if (result.length >= 4) break;
    }
    return result;
  }, [garageOrders]);

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-7 lg:px-10 lg:py-8">
      {/* Section header */}
      <div style={{ marginBottom: 22 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#222222",
            letterSpacing: "-0.03em",
            marginBottom: 4,
          }}
        >
          Service Board
        </h1>
        <p
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#929292",
          }}
        >
          Signed in as {CURRENT_MECHANIC} &middot; {garageOrders.length} {SUBTITLE[depotScope]}
        </p>
      </div>

      {/* Action row: scope toggle + log-new-repair CTA */}
      <div className="mb-[18px] flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <ScopeToggle
          scope={scope}
          onChange={setScope}
          mineCount={mineCount}
          allCount={garageOrders.length}
        />
        <Button onClick={() => setIsLogOpen(true)} className="w-full px-5 sm:w-auto">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Log new repair
        </Button>
      </div>

      <KanbanBoard
        workOrders={visibleOrders}
        onStageChange={handleStageChange}
        onComplete={handleComplete}
        onSelectWorkOrder={openWorkOrderRoot}
        onUpdateParts={handleUpdateParts}
      />

      <BusDetailPanel
        bus={currentBus}
        onClose={nav.close}
        onSelectWorkOrder={drillToWorkOrder}
        onSelectHistoryEntry={(entry) =>
          drillToHistoryEntry(entry, currentBus!)
        }
        backLabel={currentBus ? nav.backButton?.label : undefined}
        onBack={currentBus ? nav.backButton?.onBack : undefined}
      />
      <WorkOrderDetailPanel
        order={liveSelectedWorkOrder}
        historyEntry={currentHistoryEntry}
        bus={liveSelectedWorkOrderBus ?? currentHistoryEntryBus}
        onClose={nav.close}
        onOpenBus={drillToBus}
        backLabel={
          liveSelectedWorkOrder || currentHistoryEntry
            ? nav.backButton?.label
            : undefined
        }
        onBack={
          liveSelectedWorkOrder || currentHistoryEntry
            ? nav.backButton?.onBack
            : undefined
        }
        onUpdateParts={handleUpdatePartsList}
      />
      <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
        <DialogContent
          showCloseButton={false}
          aria-describedby={undefined}
          className="p-0"
        >
          <DialogTitle className="sr-only">Log new repair</DialogTitle>
          <LogRepairForm
            garage={newRepairGarage}
            recentBusNumbers={recentBusNumbers}
            initialSnapshot={formDraftRef.current}
            onCancel={() => {
              formDraftRef.current = null;
              setIsLogOpen(false);
            }}
            onSubmit={(draft) => {
              formDraftRef.current = null;
              handleCreate(draft);
            }}
            onViewBus={(bus, snapshot) => {
              // Save the in-progress form state so it can be restored when
              // the mechanic re-opens "Log new repair" after reviewing.
              formDraftRef.current = snapshot;
              setIsLogOpen(false);
              openBusRoot(bus);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
