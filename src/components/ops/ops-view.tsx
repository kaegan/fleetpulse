"use client";

import { toast } from "sonner";
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
import { PartsRiskPanel } from "./parts-risk-panel";
import { WorkOrderTracker } from "./work-order-tracker";
import { buses } from "@/data/buses";
import { useWorkOrders } from "@/contexts/work-orders-context";
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
  const { addWorkOrder } = useWorkOrders();

  // Ops-side action: scheduling a PM pulls a bus off the road and into
  // the mechanic's Intake column as a routine WO. Mechanic view leaves
  // `onSchedulePm` undefined on BusDetailPanel so the CTA hides itself
  // there — scheduling is an ops decision, not a wrench-turning decision.
  const handleSchedulePm = (bus: Bus) => {
    const created = addWorkOrder({
      busId: bus.id,
      busNumber: bus.busNumber,
      issue: "Preventive maintenance — A service",
      severity: "routine",
      stage: "triage",
      bayNumber: null,
      garage: bus.garage,
      mechanicName: null,
      partsStatus: "not-needed",
    });
    toast(
      <span>
        Scheduled — Bus #{bus.busNumber} added to Service Board intake as{" "}
        <strong style={{ fontFamily: "monospace" }}>{created.id}</strong>
      </span>
    );
    nav.close();
  };

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
    <div className="px-4 py-6 sm:px-6 lg:px-10">
      {/* Section header */}
      <div style={{ marginBottom: 28 }}>
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

      <KpiStrip onOpenStatusList={openBusList} />
      <div className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-[5fr_7fr] xl:gap-6">
        <ActionCard
          onBusClick={openBusRoot}
          onViewAll={() => openBusList("overdue")}
        />
        <FleetHealthChart onBusClick={openBusRoot} />
      </div>
      <div className="mb-6">
        <PartsRiskPanel />
      </div>
      <WorkOrderTracker onSelectWorkOrder={openWorkOrderRoot} />

      <BusDetailPanel
        bus={currentBus}
        onClose={nav.close}
        onSelectWorkOrder={drillToWorkOrder}
        onSchedulePm={handleSchedulePm}
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
