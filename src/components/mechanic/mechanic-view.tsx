"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { LayoutGroup } from "framer-motion";
import { toast } from "sonner";
import { KanbanBoard } from "./kanban-board";
import { MyWorkOrders } from "./my-work-orders";
import { ScopeToggle, type Scope } from "./scope-toggle";
import { LogRepairForm, type LogRepairFormSnapshot } from "./log-repair-form";
import { BusPanelContent } from "@/components/bus-detail-panel";
import { WorkOrderPanelContent } from "@/components/work-order-detail-panel";
import { PartDetailPanelContent } from "@/components/part-detail-panel";
import {
  ResponsiveSheet,
  ResponsiveSheetContent,
  ResponsiveSheetTitle,
  ResponsiveSheetDescription,
} from "@/components/ui/responsive-sheet";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFleet } from "@/contexts/fleet-context";
import {
  CURRENT_MECHANIC,
  CURRENT_MECHANIC_GARAGE,
  stageIndex,
} from "@/lib/constants";
import { useDepot, filterByDepot } from "@/hooks/use-depot";
import { analytics } from "@/lib/analytics";
import { usePanelNav } from "@/hooks/use-panel-nav";
import { hasAccessibilityPart, isAccessibilityIssue } from "@/lib/accessibility";
import type {
  BlockReason,
  Bus,
  BusHistoryEntry,
  Garage,
  Part,
  PartRequirement,
  PartsStatus,
  Severity,
  WorkOrder,
  WorkOrderStage,
} from "@/data/types";

/**
 * Resolve a requested stage transition against the parts gate.
 *
 * Forward-only gate: dragging a WO into Repair while parts are unresolved
 * keeps the WO in its current stage and sets isHeld. Backward drags always
 * succeed — mechanics need to correct their own mistakes without admin help
 * (per PRODUCT_SPEC.md §2).
 */
function resolveStageTransition(
  wo: WorkOrder,
  requested: WorkOrderStage
): { stage: WorkOrderStage; isHeld?: boolean; blockReason?: BlockReason; notice?: string } {
  if (wo.stage === "done" && requested !== "done") {
    return {
      stage: "done",
      isHeld: false,
      notice: "This work order is completed. Dismiss it from the board when you're ready.",
    };
  }

  const isForward = stageIndex(requested) > stageIndex(wo.stage);
  if (!isForward) return { stage: requested, isHeld: false };

  if (requested === "repair") {
    if (wo.partsStatus === "needed") {
      return {
        stage: wo.stage,
        isHeld: true,
        blockReason: "parts-needed",
        notice: "Parts haven't been ordered — held until parts are resolved.",
      };
    }
    if (wo.partsStatus === "ordered") {
      return {
        stage: wo.stage,
        isHeld: true,
        blockReason: "parts-ordered",
        notice: "Parts on order — held until the kit arrives.",
      };
    }
  }

  return { stage: requested, isHeld: false };
}

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
  | { kind: "historyEntry"; label: string; entry: BusHistoryEntry; bus: Bus }
  | { kind: "part"; label: string; part: Part };

export function MechanicView() {
  const { buses, workOrders: orders, parts, addWorkOrder, updateWorkOrder, dismissWorkOrder } =
    useFleet();
  const [scope, setScope] = useState<Scope>("mine");
  const handleScopeChange = useCallback(
    (next: Scope) => {
      analytics.mechanicScopeToggled(scope, next);
      setScope(next);
    },
    [scope]
  );
  const [isLogOpen, setIsLogOpen] = useState(false);
  const formDraftRef = useRef<LogRepairFormSnapshot | null>(null);
  const { scope: depotScope } = useDepot();

  const nav = usePanelNav<MechanicPanelEntry>();
  const current = nav.current;
  const navClose = nav.close;

  // Root-entry opens come from the page (kanban, intake form). These
  // reset the stack so no back button is shown on the target.
  const openBusRoot = useCallback(
    (bus: Bus) => {
      analytics.busDetailOpened(bus.id, "kanban");
      if (depotScope !== "all" && bus.garage !== depotScope) {
        analytics.crossGaragePeek(bus.id, depotScope, bus.garage);
      }
      nav.open({ kind: "bus", label: `Bus #${bus.busNumber}`, bus });
    },
    [nav, depotScope]
  );
  const openWorkOrderRoot = useCallback(
    (wo: WorkOrder) => {
      analytics.woDetailOpened(wo.id, "kanban");
      nav.open({ kind: "workOrder", label: wo.id, workOrder: wo });
    },
    [nav]
  );

  // Drill-down opens come from inside an already-open panel — push on
  // top of the stack and let the hook handle the 320ms handoff + back
  // wiring.
  const drillToBus = useCallback(
    (bus: Bus) => {
      analytics.busDetailOpened(bus.id, "history");
      if (depotScope !== "all" && bus.garage !== depotScope) {
        analytics.crossGaragePeek(bus.id, depotScope, bus.garage);
      }
      nav.drill({ kind: "bus", label: `Bus #${bus.busNumber}`, bus });
    },
    [nav, depotScope]
  );
  const drillToWorkOrder = useCallback(
    (wo: WorkOrder) => {
      analytics.woDetailOpened(wo.id, "drilldown");
      nav.drill({ kind: "workOrder", label: wo.id, workOrder: wo });
    },
    [nav]
  );
  const drillToHistoryEntry = useCallback(
    (entry: BusHistoryEntry, bus: Bus) =>
      nav.drill({ kind: "historyEntry", label: entry.id, entry, bus }),
    [nav]
  );
  const drillToPart = useCallback(
    (part: Part) => {
      analytics.partDetailOpened(part.id, "wo-panel");
      nav.drill({ kind: "part", label: part.name, part });
    },
    [nav]
  );

  // When the user clicks "Log new repair", the form needs a starting garage.
  // Scoped views keep that garage selected; All Garages falls back to the
  // mechanic's home garage while still letting the mechanic change it.
  const defaultRepairGarage: Garage =
    depotScope === "all" ? CURRENT_MECHANIC_GARAGE : depotScope;

  const handleStageChange = useCallback(
    (woId: string, newStage: WorkOrderStage) => {
      const wo = orders.find((o) => o.id === woId);
      if (!wo) return;

      const { stage, isHeld, blockReason, notice } = resolveStageTransition(
        wo,
        newStage
      );

      // Always surface the notice — even when the card doesn't actually
      // move (e.g. clicking advance on a blocked card). Otherwise the
      // mechanic clicks the button and nothing happens.
      if (notice) toast(notice);

      if (stage === wo.stage && isHeld === wo.isHeld) return;

      analytics.woStageAdvanced(woId, wo.stage, stage);

      const now = new Date().toISOString();
      updateWorkOrder(woId, {
        stage,
        stageEnteredAt: stage !== wo.stage ? now : wo.stageEnteredAt,
        isHeld: isHeld ?? false,
        blockReason: isHeld ? (blockReason ?? wo.blockReason) : undefined,
        blockEta: isHeld ? wo.blockEta : undefined,
      });

      if (wo.stage !== "done" && stage === "done") {
        toast("Completion recorded — service history and stock updated.");
      }
    },
    [orders, updateWorkOrder]
  );

  const handleUpdateParts = useCallback(
    (woId: string, partsStatus: PartsStatus) => {
      // Marking parts resolved (in-stock) or not-needed unblocks any hold that
      // was set by resolveStageTransition. "not-needed" also clears the parts
      // list so the Assigned Parts section doesn't contradict the badge.
      const unblocks = partsStatus === "in-stock" || partsStatus === "not-needed";
      updateWorkOrder(woId, {
        partsStatus,
        ...(partsStatus === "not-needed" ? { parts: [] } : {}),
        ...(unblocks ? { isHeld: false, blockReason: undefined, blockEta: undefined } : {}),
      });
    },
    [updateWorkOrder]
  );

  const handleUpdatePartsList = useCallback(
    (woId: string, parts: PartRequirement[]) => {
      const wo = orders.find((o) => o.id === woId);
      if (!wo) return;
      const shouldEscalate =
        parts.length > 0 &&
        hasAccessibilityPart(parts) &&
        wo.severity !== "critical";

      // Keep partsStatus in sync with the parts list:
      // - adding the first part to an untracked WO → bump to "needed"
      // - removing all parts when not yet ordered → reset to "not-needed" and
      //   clear any hold so the WO is no longer blocked
      let reconciled: Partial<WorkOrder> = {};
      if (parts.length > 0 && wo.partsStatus === "not-needed") {
        reconciled = { partsStatus: "needed" as PartsStatus };
      } else if (parts.length === 0 && wo.partsStatus === "needed") {
        reconciled = {
          partsStatus: "not-needed" as PartsStatus,
          isHeld: false,
          blockReason: undefined,
          blockEta: undefined,
        };
      }

      updateWorkOrder(woId, {
        parts,
        ...reconciled,
        ...(shouldEscalate
          ? { severity: "critical" as Severity, autoEscalated: true }
          : {}),
      });
    },
    [orders, updateWorkOrder]
  );

  const handleDismiss = useCallback(
    (woId: string) => {
      analytics.woDismissed(woId);
      dismissWorkOrder(woId);
    },
    [dismissWorkOrder]
  );

  const handleCreate = useCallback(
    (draft: {
      busId: number;
      busNumber: string;
      garage: Garage;
      issue: string;
      severity: Severity;
      assignedTo: string | null;
    }) => {
      const shouldEscalate = isAccessibilityIssue(draft.issue);
      const newOrder = addWorkOrder({
        busId: draft.busId,
        busNumber: draft.busNumber,
        issue: draft.issue,
        severity: shouldEscalate ? "critical" : draft.severity,
        // New WOs land in Intake so the board matches the form copy and the
        // mechanic can explicitly advance the bus once it is ready for triage.
        stage: "intake",
        bayNumber: null,
        garage: draft.garage,
        mechanicName: draft.assignedTo,
        partsStatus: "not-needed",
        autoEscalated: shouldEscalate || undefined,
      });

      analytics.repairLogged(
        draft.busId,
        shouldEscalate ? "critical" : draft.severity,
        draft.garage,
        shouldEscalate,
        draft.assignedTo
      );

      setIsLogOpen(false);
      toast(
        <span>
          Logged as <strong style={{ fontFamily: "monospace" }}>{newOrder.id}</strong>
        </span>,
        scope === "mine"
          ? {
              action: {
                label: "View on Board",
                onClick: () => setScope("board"),
              },
            }
          : undefined
      );
    },
    [addWorkOrder, scope]
  );

  // Mechanic sees the work orders in their current depot scope. Defaults to
  // "all" globally; the user can scope down via the top-bar pill.
  const garageOrders = useMemo(
    () => filterByDepot(orders, depotScope),
    [orders, depotScope]
  );

  const mineOrders = useMemo(
    () => garageOrders.filter((wo) => wo.mechanicName === CURRENT_MECHANIC),
    [garageOrders]
  );

  // Snapshot the last non-null entry so the sheet keeps rendering its
  // content through the close animation after the user dismisses.
  const lastEntryRef = useRef<MechanicPanelEntry | null>(null);
  if (current !== null) lastEntryRef.current = current;
  const renderEntry = current ?? lastEntryRef.current;

  // Live WO lookup — stays reactive to stage/parts changes while the
  // panel is open. History entries are immutable so they skip this.
  const liveWo = useMemo(() => {
    if (renderEntry?.kind !== "workOrder") return null;
    return orders.find((wo) => wo.id === renderEntry.workOrder.id) ?? null;
  }, [renderEntry, orders]);

  const liveWoBus = useMemo(
    () => (liveWo ? buses.find((b) => b.id === liveWo.busId) ?? null : null),
    [buses, liveWo]
  );

  const livePanelBus = useMemo(() => {
    if (renderEntry?.kind !== "bus") return null;
    return buses.find((b) => b.id === renderEntry.bus.id) ?? renderEntry.bus;
  }, [buses, renderEntry]);

  const livePanelPart = useMemo(() => {
    if (renderEntry?.kind !== "part") return null;
    return parts.find((p) => p.id === renderEntry.part.id) ?? renderEntry.part;
  }, [parts, renderEntry]);

  // Auto-close when a WO is completed and removed from orders. This
  // preserves the existing behavior where completing a card closes the
  // panel automatically.
  useEffect(() => {
    if (current?.kind === "workOrder") {
      if (!orders.find((wo) => wo.id === current.workOrder.id)) {
        navClose();
      }
    }
  }, [current, orders, navClose]);

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
          onChange={handleScopeChange}
          mineCount={mineOrders.length}
          allCount={garageOrders.length}
        />
        <Button onClick={() => setIsLogOpen(true)} className="w-full px-5 sm:w-auto">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Log new repair
        </Button>
      </div>

      {/* LayoutGroup coordinates cross-view morph animations. */}
      <LayoutGroup>
        {scope === "mine" && (
          <MyWorkOrders
            workOrders={mineOrders}
            onStageChange={handleStageChange}
            onComplete={handleDismiss}
            onSelectWorkOrder={openWorkOrderRoot}
            onUpdateParts={handleUpdateParts}
            layoutPrefix="wo"
          />
        )}

        {scope === "board" && (
          <KanbanBoard
            workOrders={garageOrders}
            onStageChange={handleStageChange}
            onComplete={handleDismiss}
            onSelectWorkOrder={openWorkOrderRoot}
            onUpdateParts={handleUpdateParts}
            layoutPrefix="wo"
          />
        )}
      </LayoutGroup>

      {/* Single sheet — stays open throughout navigation so content
          transitions in-place instead of closing and reopening. */}
      <ResponsiveSheet
        open={current !== null}
        onOpenChange={(open) => !open && nav.close()}
      >
        <ResponsiveSheetContent side="right" className="p-0">
          <ResponsiveSheetTitle className="sr-only">
            {renderEntry?.kind === "bus"
              ? `Bus #${renderEntry.bus.busNumber} details`
              : renderEntry?.kind === "workOrder"
                ? `Work order ${renderEntry.workOrder.id} details`
                : renderEntry?.kind === "historyEntry"
                  ? `Service history ${renderEntry.entry.id} details`
                  : renderEntry?.kind === "part"
                    ? `${renderEntry.part.name} details`
                    : "Panel"}
          </ResponsiveSheetTitle>
          <ResponsiveSheetDescription className="sr-only">
            {renderEntry?.kind === "bus"
              ? "Vehicle info, preventive maintenance status, active work orders, and service history."
              : renderEntry?.kind === "part"
                ? "Stock levels, consumption rate, lead time, and active work orders using this part."
                : "Issue, stage progress, assignment, timeline, and the bus this work order is attached to."}
          </ResponsiveSheetDescription>
          {renderEntry && (
            <div
              key={`${renderEntry.kind}:${renderEntry.label}`}
              className="animate-in fade-in duration-150 h-full"
            >
              {renderEntry.kind === "bus" && (
                <BusPanelContent
                  bus={livePanelBus ?? renderEntry.bus}
                  onSelectWorkOrder={drillToWorkOrder}
                  onSelectHistoryEntry={(entry) =>
                    drillToHistoryEntry(entry, livePanelBus ?? renderEntry.bus)
                  }
                  backLabel={nav.backButton?.label}
                  onBack={nav.backButton?.onBack}
                />
              )}
              {(renderEntry.kind === "workOrder" ||
                renderEntry.kind === "historyEntry") && (
                <WorkOrderPanelContent
                  order={
                    renderEntry.kind === "workOrder" ? liveWo : null
                  }
                  historyEntry={
                    renderEntry.kind === "historyEntry"
                      ? renderEntry.entry
                      : null
                  }
                  bus={
                    renderEntry.kind === "workOrder"
                      ? liveWoBus
                      : renderEntry.bus
                  }
                  onOpenBus={drillToBus}
                  backLabel={nav.backButton?.label}
                  onBack={nav.backButton?.onBack}
                  onUpdateParts={handleUpdatePartsList}
                  onStageChange={handleStageChange}
                  onSelectPart={drillToPart}
                />
              )}
              {renderEntry.kind === "part" && livePanelPart && (
                <PartDetailPanelContent
                  part={livePanelPart}
                  onSelectWorkOrder={drillToWorkOrder}
                  backLabel={nav.backButton?.label}
                  onBack={nav.backButton?.onBack}
                />
              )}
            </div>
          )}
        </ResponsiveSheetContent>
      </ResponsiveSheet>
      <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
        <DialogContent
          showCloseButton={false}
          aria-describedby={undefined}
          className="p-0"
        >
          <DialogTitle className="sr-only">Log new repair</DialogTitle>
          <LogRepairForm
            defaultGarage={defaultRepairGarage}
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
