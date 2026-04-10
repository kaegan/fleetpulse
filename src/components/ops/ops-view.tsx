"use client";

import { useState } from "react";
import { KpiStrip } from "./kpi-strip";
import { FleetWall } from "./fleet-wall";
import { BusDetailPanel } from "./bus-detail-panel";
import { WorkOrderTracker } from "./work-order-tracker";
import { SectionPill } from "@/components/section-pill";
import type { Bus } from "@/data/types";
import { IconRadarFillDuo18 } from "nucleo-ui-fill-duo-18";

export function OpsView() {
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);

  return (
    <div style={{ padding: "32px 40px" }}>
      {/* Section header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ marginBottom: 10 }}>
          <SectionPill
            label="Operations"
            color="#3b82f6"
            bgColor="#eff6ff"
            icon={<IconRadarFillDuo18 />}
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
