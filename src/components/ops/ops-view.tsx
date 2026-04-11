"use client";

import { useState } from "react";
import { KpiStrip } from "./kpi-strip";
import { ActionCard } from "./action-card";
import { FleetHealthChart } from "./fleet-health-chart";
import { BusDetailPanel } from "@/components/bus-detail-panel";
import { WorkOrderDetailPanel } from "@/components/work-order-detail-panel";
import { StatusBusListPanel } from "@/components/status-bus-list-panel";
import { WorkOrderTracker } from "./work-order-tracker";
import { SectionPill } from "@/components/section-pill";
import { buses } from "@/data/buses";
import type { Bus, BusStatus, WorkOrder } from "@/data/types";
import { IconRadarFillDuo18 } from "nucleo-ui-fill-duo-18";

export function OpsView() {
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(
    null
  );
  const [statusListKind, setStatusListKind] = useState<BusStatus | null>(null);

  // Mutually exclusive: opening one detail panel clears the others so two
  // right-side sheets are never stacked.
  const openBus = (bus: Bus) => {
    setSelectedWorkOrder(null);
    setStatusListKind(null);
    setSelectedBus(bus);
  };
  const openWorkOrder = (wo: WorkOrder) => {
    setSelectedBus(null);
    setStatusListKind(null);
    setSelectedWorkOrder(wo);
  };
  const openStatusList = (status: BusStatus) => {
    setSelectedBus(null);
    setSelectedWorkOrder(null);
    setStatusListKind(status);
  };
  // Cross-link from WO sheet → bus sheet. Wait for the WO sheet to fully
  // close and unmount before opening the bus sheet — otherwise Radix's
  // Presence can get stuck with both sheets stacked in the DOM because the
  // first sheet's exit animation gets orphaned when the second one opens.
  // Sheet close animation is 300ms, plus a small buffer.
  const openBusFromWorkOrder = (bus: Bus) => {
    setSelectedWorkOrder(null);
    setTimeout(() => setSelectedBus(bus), 320);
  };
  // Same handoff from the status-list sheet → the individual bus sheet.
  const openBusFromStatusList = (bus: Bus) => {
    setStatusListKind(null);
    setTimeout(() => setSelectedBus(bus), 320);
  };

  const selectedWorkOrderBus = selectedWorkOrder
    ? buses.find((b) => b.id === selectedWorkOrder.busId) ?? null
    : null;

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-7 lg:px-10 lg:py-8">
      {/* Section header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ marginBottom: 10 }}>
          <SectionPill
            label="Fleet Overview"
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

      <KpiStrip onOpenStatusList={openStatusList} />
      <ActionCard onBusClick={openBus} />
      <FleetHealthChart onBusClick={openBus} />
      <WorkOrderTracker onSelectWorkOrder={openWorkOrder} />

      <BusDetailPanel
        bus={selectedBus}
        onClose={() => setSelectedBus(null)}
        onSelectWorkOrder={openWorkOrder}
      />
      <WorkOrderDetailPanel
        order={selectedWorkOrder}
        bus={selectedWorkOrderBus}
        onClose={() => setSelectedWorkOrder(null)}
        onOpenBus={openBusFromWorkOrder}
      />
      <StatusBusListPanel
        status={statusListKind}
        onClose={() => setStatusListKind(null)}
        onSelectBus={openBusFromStatusList}
      />
    </div>
  );
}
