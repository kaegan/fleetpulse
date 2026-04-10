"use client";

import { useState, useCallback } from "react";
import { BayStatusStrip } from "./bay-status-strip";
import { KanbanBoard } from "./kanban-board";
import { SectionPill } from "@/components/section-pill";
import { workOrders as initialWorkOrders } from "@/data/work-orders";
import type { WorkOrder, WorkOrderStage } from "@/data/types";
import { IconWrenchScrewdriverFillDuo18 } from "nucleo-ui-fill-duo-18";

export function MechanicView() {
  const [orders, setOrders] = useState<WorkOrder[]>(initialWorkOrders);

  const handleAdvance = useCallback((woId: string) => {
    setOrders((prev) =>
      prev
        .map((wo) =>
          wo.id === woId
            ? { ...wo, stage: (wo.stage + 1) as WorkOrderStage, stageEnteredAt: new Date().toISOString() }
            : wo
        )
        .filter((wo) => wo.stage <= 4)
    );
  }, []);

  // Mechanic sees their garage's work orders. Default to North.
  const garageOrders = orders.filter((wo) => wo.garage === "north");

  return (
    <div style={{ padding: "32px 40px" }}>
      {/* Section header */}
      <div style={{ marginBottom: 28 }}>
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
          8 maintenance bays &middot; {garageOrders.length} active work orders
        </p>
      </div>

      <BayStatusStrip garage="north" />
      <KanbanBoard workOrders={garageOrders} onAdvance={handleAdvance} />
    </div>
  );
}
