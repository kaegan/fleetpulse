"use client";

import { useState } from "react";
import { KpiStrip } from "./kpi-strip";
import { ActionCard } from "./action-card";
import { FleetHealthChart } from "./fleet-health-chart";
import { BusDetailPanel } from "@/components/bus-detail-panel";
import { WorkOrderTracker } from "./work-order-tracker";
import { SectionPill } from "@/components/section-pill";
import { BusListSheet, type DrillDownCategory } from "./bus-list-sheet";
import type { Bus } from "@/data/types";
import { IconRadarFillDuo18 } from "nucleo-ui-fill-duo-18";

export function OpsView() {
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [listCategory, setListCategory] = useState<DrillDownCategory | null>(
    null
  );

  // Drill-down hand-off: closing the list and opening the bus detail keeps
  // the focus on one panel at a time. The user can re-open the list from the
  // KPI strip if they want to keep triaging.
  const handleBusClickFromList = (bus: Bus) => {
    setListCategory(null);
    setSelectedBus(bus);
  };

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-7 lg:px-10 lg:py-8">
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

      <KpiStrip onCategoryClick={setListCategory} />
      <ActionCard
        onBusClick={setSelectedBus}
        onSeeMoreClick={() => setListCategory("pm-due")}
      />
      <FleetHealthChart onBusClick={setSelectedBus} />
      <WorkOrderTracker onSelectBus={setSelectedBus} />

      <BusDetailPanel
        bus={selectedBus}
        onClose={() => setSelectedBus(null)}
      />
      <BusListSheet
        category={listCategory}
        onClose={() => setListCategory(null)}
        onBusClick={handleBusClickFromList}
      />
    </div>
  );
}
