"use client";

import { useState } from "react";
import { KpiStrip } from "./kpi-strip";
import { FleetWall } from "./fleet-wall";
import { BusDetailPanel } from "./bus-detail-panel";
import { WorkOrderTracker } from "./work-order-tracker";
import type { Bus } from "@/data/types";

export function OpsView() {
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);

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
          Fleet Overview
        </h1>
        <p
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#929292",
          }}
        >
          300 buses across 2 garages &middot; Real-time status
        </p>
      </div>

      <KpiStrip />
      <FleetWall onBusClick={setSelectedBus} />
      <WorkOrderTracker />

      <BusDetailPanel
        bus={selectedBus}
        onClose={() => setSelectedBus(null)}
      />
    </div>
  );
}
