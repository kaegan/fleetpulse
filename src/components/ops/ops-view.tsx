"use client";

import { KpiStrip } from "./kpi-strip";
import { ActionCard } from "./action-card";
import { FleetHealthChart } from "./fleet-health-chart";
import { BusDetailPanel } from "@/components/bus-detail-panel";
import { WorkOrderDetailPanel } from "@/components/work-order-detail-panel";
import {
  StatusBusListPanel,
  getBusListPillLabel,
  type BusListKind,
} from "@/components/status-bus-list-panel";
import { WorkOrderTracker } from "./work-order-tracker";
import { buses } from "@/data/buses";
import { usePanelNav } from "@/hooks/use-panel-nav";
import type { Bus, BusHistoryEntry, WorkOrder } from "@/data/types";

// Panels on Fleet Overview form a drill-down graph (list → bus → WO,
// bus → history entry, WO → bus, etc.). Each entry carries a short
// destination label that the next panel in the chain renders as
// `Back to {label}`. See src/hooks/use-panel-nav.ts for the stack
// machinery.
type OpsPanelEntry =
  | { kind: "busList"; label: string; busListKind: BusListKind }
  | { kind: "bus"; label: string; bus: Bus }
  | { kind: "workOrder"; label: string; workOrder: WorkOrder }
  | { kind: "historyEntry"; label: string; entry: BusHistoryEntry; bus: Bus };

export function OpsView() {
  const nav = usePanelNav<OpsPanelEntry>();
  const current = nav.current;

  // Root-entry callbacks: the click originates from the page (KPI strip,
  // action card row, fleet chart, tracker), not from inside another
  // panel. These `open` the nav with a fresh single-entry stack so no
  // back button is shown.
  const openBusList = (busListKind: BusListKind) =>
    nav.open({
      kind: "busList",
      label: getBusListPillLabel(busListKind),
      busListKind,
    });
  const openBusRoot = (bus: Bus) =>
    nav.open({ kind: "bus", label: `Bus #${bus.busNumber}`, bus });
  const openWorkOrderRoot = (wo: WorkOrder) =>
    nav.open({ kind: "workOrder", label: wo.id, workOrder: wo });

  // Drill-down callbacks: the click originates from inside an already-
  // open panel, so we `drill` to push a new entry on top. The hook
  // handles the 320ms Radix Presence handoff and wires the back button
  // for the new panel automatically.
  const drillToBus = (bus: Bus) =>
    nav.drill({ kind: "bus", label: `Bus #${bus.busNumber}`, bus });
  const drillToWorkOrder = (wo: WorkOrder) =>
    nav.drill({ kind: "workOrder", label: wo.id, workOrder: wo });
  const drillToHistoryEntry = (entry: BusHistoryEntry, bus: Bus) =>
    nav.drill({ kind: "historyEntry", label: entry.id, entry, bus });

  // Derive props for each panel from `current`. A panel is "open" only
  // when `current` matches its kind — everything else reads null and
  // stays closed.
  const currentBus = current?.kind === "bus" ? current.bus : null;
  const currentWorkOrder =
    current?.kind === "workOrder" ? current.workOrder : null;
  const currentWorkOrderBus = currentWorkOrder
    ? buses.find((b) => b.id === currentWorkOrder.busId) ?? null
    : null;
  const currentHistoryEntry =
    current?.kind === "historyEntry" ? current.entry : null;
  const currentHistoryEntryBus =
    current?.kind === "historyEntry" ? current.bus : null;
  const currentBusListKind =
    current?.kind === "busList" ? current.busListKind : null;

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-7 lg:px-10 lg:py-8">
      {/* Section header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "var(--color-text-primary)",
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
            color: "var(--color-text-muted)",
          }}
        >
          300 buses across 2 garages &middot; Real-time status
        </p>
      </div>

      <KpiStrip onOpenStatusList={openBusList} />
      <ActionCard
        onBusClick={openBusRoot}
        onViewAll={() => openBusList("overdue")}
      />
      <FleetHealthChart onBusClick={openBusRoot} />
      <WorkOrderTracker onSelectWorkOrder={openWorkOrderRoot} />

      <BusDetailPanel
        bus={currentBus}
        onClose={nav.close}
        onSelectWorkOrder={drillToWorkOrder}
        onSelectHistoryEntry={(entry) =>
          drillToHistoryEntry(entry, currentBus!)
        }
        backLabel={currentBus ? nav.backButton?.label : undefined}
        onBack={currentBus ? nav.backButton?.onBack : undefined}
      />
      <WorkOrderDetailPanel
        order={currentWorkOrder}
        historyEntry={currentHistoryEntry}
        bus={currentWorkOrderBus ?? currentHistoryEntryBus}
        onClose={nav.close}
        onOpenBus={drillToBus}
        backLabel={
          currentWorkOrder || currentHistoryEntry
            ? nav.backButton?.label
            : undefined
        }
        onBack={
          currentWorkOrder || currentHistoryEntry
            ? nav.backButton?.onBack
            : undefined
        }
      />
      <StatusBusListPanel
        kind={currentBusListKind}
        onClose={nav.close}
        onSelectBus={drillToBus}
      />
    </div>
  );
}
