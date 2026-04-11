"use client";

import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { KanbanBoard } from "./kanban-board";
import { ScopeToggle } from "./scope-toggle";
import { LogRepairForm } from "./log-repair-form";
import { PmDueBanner } from "./pm-due-banner";
import { PmDueSheet } from "./pm-due-sheet";
import { SectionPill } from "@/components/section-pill";
import { BusDetailPanel } from "@/components/bus-detail-panel";
import { WorkOrderDetailPanel } from "@/components/work-order-detail-panel";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { buses } from "@/data/buses";
import { workOrders as initialWorkOrders } from "@/data/work-orders";
import { CURRENT_MECHANIC } from "@/lib/constants";
import { useDepot, filterByDepot } from "@/hooks/use-depot";
import { useOverdueCandidates } from "@/hooks/use-overdue-candidates";
import type { Bus, Garage, Severity, WorkOrder, WorkOrderStage } from "@/data/types";
import { IconWrenchScrewdriverFillDuo18 } from "nucleo-ui-fill-duo-18";

type MineScope = "mine" | "all";

// Visible header strings keyed by global depot scope.
const HEADER: Record<"all" | "north" | "south", { title: string; subtitle: string }> = {
  all: { title: "All Garages", subtitle: "active work orders in fleet" },
  north: { title: "North Garage", subtitle: "active work orders in garage" },
  south: { title: "South Garage", subtitle: "active work orders in garage" },
};

export function MechanicView() {
  const [orders, setOrders] = useState<WorkOrder[]>(initialWorkOrders);
  const [scope, setScope] = useState<MineScope>("mine");
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(
    null
  );
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isPmSheetOpen, setIsPmSheetOpen] = useState(false);
  const { scope: depotScope } = useDepot();
  const { overdue: overdueCandidates, comingDue: comingDueCandidates } =
    useOverdueCandidates();

  // Mutually exclusive: opening one right-side sheet clears the other so two
  // sheets are never stacked.
  const openBus = useCallback((bus: Bus) => {
    setSelectedWorkOrder(null);
    setSelectedBus(bus);
  }, []);
  const openWorkOrder = useCallback((wo: WorkOrder) => {
    setSelectedBus(null);
    setSelectedWorkOrder(wo);
  }, []);
  // Cross-link from WO sheet → bus sheet. Wait for the WO sheet to fully
  // close and unmount before opening the bus sheet — otherwise Radix's
  // Presence can get stuck with both sheets stacked in the DOM because the
  // first sheet's exit animation gets orphaned when the second one opens.
  // Sheet close animation is 300ms, plus a small buffer.
  const openBusFromWorkOrder = useCallback((bus: Bus) => {
    setSelectedWorkOrder(null);
    setTimeout(() => setSelectedBus(bus), 320);
  }, []);
  // Same handoff from the PM sheet → individual bus sheet. Close the PM
  // sheet first and wait for its exit animation before opening the bus
  // sheet, for the same Radix Presence reason.
  const openBusFromPmSheet = useCallback((bus: Bus) => {
    setIsPmSheetOpen(false);
    setTimeout(() => setSelectedBus(bus), 320);
  }, []);

  // When the user clicks "Log new repair", we need a concrete garage to
  // assign the new WO to. If scope is "all", default to north (the demo
  // mechanic's home garage). If scope is north/south, use that.
  const newRepairGarage: Garage = depotScope === "all" ? "north" : depotScope;

  const handleStageChange = useCallback((woId: string, newStage: WorkOrderStage) => {
    setOrders((prev) =>
      prev.map((wo) =>
        wo.id === woId
          ? { ...wo, stage: newStage, stageEnteredAt: new Date().toISOString() }
          : wo
      )
    );
  }, []);

  const handleComplete = useCallback((woId: string) => {
    setOrders((prev) => prev.filter((wo) => wo.id !== woId));
  }, []);

  const handleCreate = useCallback(
    (draft: {
      busId: number;
      busNumber: string;
      issue: string;
      severity: Severity;
      assignedTo: string | null;
    }) => {
      const now = new Date().toISOString();
      // Compute next WO id from current state so concurrent opens can't collide.
      const maxNum = orders.reduce((max, wo) => {
        const n = parseInt(wo.id.replace("WO-", ""), 10);
        return Number.isFinite(n) && n > max ? n : max;
      }, 0);
      const newId = `WO-${maxNum + 1}`;

      const newOrder: WorkOrder = {
        id: newId,
        busId: draft.busId,
        busNumber: draft.busNumber,
        issue: draft.issue,
        severity: draft.severity,
        stage: 0,
        bayNumber: null,
        garage: newRepairGarage,
        mechanicName: draft.assignedTo,
        partsStatus: "n/a",
        createdAt: now,
        stageEnteredAt: now,
      };

      setOrders((prev) => [...prev, newOrder]);
      setIsLogOpen(false);
      toast(
        <span>
          Logged as <strong style={{ fontFamily: "monospace" }}>{newId}</strong>
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
    [orders, scope, newRepairGarage]
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

  // Re-derive the open WO from `orders` state so stage advance / complete
  // updates the sheet in place. If the WO is completed (removed from orders),
  // the memo returns null and the sheet closes itself.
  const liveSelectedWorkOrder = useMemo(
    () =>
      selectedWorkOrder
        ? orders.find((wo) => wo.id === selectedWorkOrder.id) ?? null
        : null,
    [selectedWorkOrder, orders]
  );
  const liveSelectedWorkOrderBus = useMemo(
    () =>
      liveSelectedWorkOrder
        ? buses.find((b) => b.id === liveSelectedWorkOrder.busId) ?? null
        : null,
    [liveSelectedWorkOrder]
  );

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
        <div style={{ marginBottom: 10 }}>
          <SectionPill
            label="Service Board"
            color="#8b5cf6"
            bgColor="#f5f3ff"
            icon={<IconWrenchScrewdriverFillDuo18 />}
          />
        </div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#222222",
            letterSpacing: "-0.03em",
            marginBottom: 4,
          }}
        >
          {HEADER[depotScope].title}
        </h1>
        <p
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#929292",
          }}
        >
          Signed in as {CURRENT_MECHANIC} &middot; {garageOrders.length} {HEADER[depotScope].subtitle}
        </p>
      </div>

      {/* Pull In Next discovery banner — tactical surface for M-3 ("which
          buses should I pull in next for PM?"). Sits above the scope toggle
          so it's the first thing a mechanic sees when opening the page.
          Clicking expands the full planning list in a right-side drawer,
          keeping Service Board otherwise single-concept (the kanban). */}
      <PmDueBanner
        overdueCount={overdueCandidates.length}
        comingDueCount={comingDueCandidates.length}
        onClick={() => setIsPmSheetOpen(true)}
      />

      {/* Action row: scope toggle + log-new-repair CTA */}
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
        <ScopeToggle
          scope={scope}
          onChange={setScope}
          mineCount={mineCount}
          allCount={garageOrders.length}
        />
        <Button onClick={() => setIsLogOpen(true)} className="px-5">
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
        onSelectWorkOrder={openWorkOrder}
      />

      <BusDetailPanel
        bus={selectedBus}
        onClose={() => setSelectedBus(null)}
        onSelectWorkOrder={openWorkOrder}
      />
      <WorkOrderDetailPanel
        order={liveSelectedWorkOrder}
        bus={liveSelectedWorkOrderBus}
        onClose={() => setSelectedWorkOrder(null)}
        onOpenBus={openBusFromWorkOrder}
      />
      <PmDueSheet
        open={isPmSheetOpen}
        onOpenChange={setIsPmSheetOpen}
        onBusClick={openBusFromPmSheet}
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
            onCancel={() => setIsLogOpen(false)}
            onSubmit={handleCreate}
            onViewBus={(bus) => {
              // Dismiss the form and open the detail panel so the mechanic
              // can inspect the related bus's history. They can re-open the
              // form after if they still want to log the current repair.
              setIsLogOpen(false);
              setSelectedBus(bus);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
