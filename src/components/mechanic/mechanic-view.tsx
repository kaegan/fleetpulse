"use client";

import { useState, useCallback, useMemo } from "react";
import { KanbanBoard } from "./kanban-board";
import { ScopeToggle } from "./scope-toggle";
import { SectionPill } from "@/components/section-pill";
import { workOrders as initialWorkOrders } from "@/data/work-orders";
import { CURRENT_MECHANIC } from "@/lib/constants";
import type { WorkOrder, WorkOrderStage } from "@/data/types";
import { IconWrenchScrewdriverFillDuo18 } from "nucleo-ui-fill-duo-18";

type Scope = "mine" | "all";

export function MechanicView() {
  const [orders, setOrders] = useState<WorkOrder[]>(initialWorkOrders);
  const [scope, setScope] = useState<Scope>("mine");

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

  // Mechanic sees their garage's work orders. Default to North.
  const garageOrders = useMemo(
    () => orders.filter((wo) => wo.garage === "north"),
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

  return (
    <div style={{ padding: "32px 40px" }}>
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

      {/* Scope toggle */}
      <div style={{ marginBottom: 18 }}>
        <ScopeToggle
          scope={scope}
          onChange={setScope}
          mineCount={mineCount}
          allCount={garageOrders.length}
        />
      </div>

      <KanbanBoard
        workOrders={visibleOrders}
        onStageChange={handleStageChange}
        onComplete={handleComplete}
      />
    </div>
  );
}
