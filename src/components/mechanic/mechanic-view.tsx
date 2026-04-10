"use client";

import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { KanbanBoard } from "./kanban-board";
import { ScopeToggle } from "./scope-toggle";
import { LogRepairForm } from "./log-repair-form";
import { SectionPill } from "@/components/section-pill";
import { BusDetailPanel } from "@/components/bus-detail-panel";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { workOrders as initialWorkOrders } from "@/data/work-orders";
import { CURRENT_MECHANIC } from "@/lib/constants";
import type { Bus, Garage, Severity, WorkOrder, WorkOrderStage } from "@/data/types";
import { IconWrenchScrewdriverFillDuo18 } from "nucleo-ui-fill-duo-18";

type Scope = "mine" | "all";

// Mechanic is hardcoded to North Garage for the V1 demo.
const CURRENT_GARAGE: Garage = "north";

export function MechanicView() {
  const [orders, setOrders] = useState<WorkOrder[]>(initialWorkOrders);
  const [scope, setScope] = useState<Scope>("mine");
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [isLogOpen, setIsLogOpen] = useState(false);

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
    (draft: { busId: number; busNumber: string; issue: string; severity: Severity }) => {
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
        garage: CURRENT_GARAGE,
        mechanicName: null,
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
    [orders, scope]
  );

  // Mechanic sees their garage's work orders.
  const garageOrders = useMemo(
    () => orders.filter((wo) => wo.garage === CURRENT_GARAGE),
    [orders]
  );

  const mineCount = useMemo(
    () => garageOrders.filter((wo) => wo.mechanicName === CURRENT_MECHANIC).length,
    [garageOrders]
  );

  const visibleOrders =
    scope === "mine"
      ? garageOrders.filter((wo) => wo.mechanicName === CURRENT_MECHANIC)
      : garageOrders;

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
            label="Mechanic"
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
          North Garage
        </h1>
        <p
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#929292",
          }}
        >
          Signed in as {CURRENT_MECHANIC} &middot; {garageOrders.length} active work orders in garage
        </p>
      </div>

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
        onSelectBus={setSelectedBus}
      />

      <BusDetailPanel
        bus={selectedBus}
        onClose={() => setSelectedBus(null)}
      />

      <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
        <DialogContent
          showCloseButton={false}
          aria-describedby={undefined}
          className="p-0"
        >
          <DialogTitle className="sr-only">Log new repair</DialogTitle>
          <LogRepairForm
            garage={CURRENT_GARAGE}
            recentBusNumbers={recentBusNumbers}
            onCancel={() => setIsLogOpen(false)}
            onSubmit={handleCreate}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
