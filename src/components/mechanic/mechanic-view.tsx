"use client";

import { BayStatusStrip } from "./bay-status-strip";
import { KanbanBoard } from "./kanban-board";
import { workOrders } from "@/data/work-orders";

export function MechanicView() {
  // Mechanic sees their garage's work orders. Default to North.
  const garageOrders = workOrders.filter((wo) => wo.garage === "north");

  return (
    <div style={{ padding: "24px 32px" }}>
      {/* Section header */}
      <div style={{ marginBottom: 20 }}>
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
      <KanbanBoard workOrders={garageOrders} />
    </div>
  );
}
