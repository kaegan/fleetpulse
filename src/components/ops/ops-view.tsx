"use client";

import { useMemo, useRef } from "react";
import { toast } from "sonner";
import { KpiStrip } from "./kpi-strip";
import { FleetHealthChart } from "./fleet-health-chart";
import { BusPanelContent } from "@/components/bus-detail-panel";
import { WorkOrderPanelContent } from "@/components/work-order-detail-panel";
import {
  BusListPanelContent,
  getBusListPillLabel,
  type BusListKind,
} from "@/components/status-bus-list-panel";
import { HeldRepairsPanelContent } from "./held-repairs-panel";
import { PartsRiskPanel } from "./parts-risk-panel";
import { WorkOrderTracker } from "./work-order-tracker";
import {
  ResponsiveSheet,
  ResponsiveSheetContent,
  ResponsiveSheetTitle,
  ResponsiveSheetDescription,
} from "@/components/ui/responsive-sheet";
import { useFleet } from "@/contexts/fleet-context";
import { usePanelNav } from "@/hooks/use-panel-nav";
import { useDepot } from "@/hooks/use-depot";
import { milesUntilPm } from "@/lib/utils";
import { analytics } from "@/lib/analytics";
import type { Bus, BusHistoryEntry, WorkOrder } from "@/data/types";

// Panels on Fleet Overview form a drill-down graph (list → bus → WO,
// bus → history entry, WO → bus, etc.). Each entry carries a short
// destination label that the next panel in the chain renders as
// `Back to {label}`. See src/hooks/use-panel-nav.ts for the stack
// machinery.
type OpsPanelEntry =
  | { kind: "busList"; label: string; busListKind: BusListKind }
  | { kind: "heldList"; label: string }
  | { kind: "bus"; label: string; bus: Bus }
  | { kind: "workOrder"; label: string; workOrder: WorkOrder }
  | { kind: "historyEntry"; label: string; entry: BusHistoryEntry; bus: Bus };

export function OpsView() {
  const nav = usePanelNav<OpsPanelEntry>();
  const current = nav.current;
  const { buses, workOrders, addWorkOrder } = useFleet();
  const { scope: depotScope } = useDepot();

  // Snapshot the last non-null entry so the sheet keeps rendering its
  // content through the close animation after the user dismisses.
  const lastEntryRef = useRef<OpsPanelEntry | null>(null);
  if (current !== null) lastEntryRef.current = current;
  const renderEntry = current ?? lastEntryRef.current;

  const livePanelBus = useMemo(() => {
    if (renderEntry?.kind !== "bus") return null;
    return buses.find((b) => b.id === renderEntry.bus.id) ?? renderEntry.bus;
  }, [buses, renderEntry]);

  const livePanelWorkOrder = useMemo(() => {
    if (renderEntry?.kind !== "workOrder") return null;
    return (
      workOrders.find((wo) => wo.id === renderEntry.workOrder.id) ??
      renderEntry.workOrder
    );
  }, [renderEntry, workOrders]);

  // Ops-side action: scheduling a PM pulls a bus off the road and into
  // the mechanic's Intake column as a routine WO. Mechanic view leaves
  // `onSchedulePm` undefined on BusPanelContent so the CTA hides itself
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
    analytics.pmServiceScheduled(bus.id, Math.abs(milesUntilPm(bus)));
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
  const openBusList = (busListKind: BusListKind) => {
    analytics.kpiDrilldownOpened(busListKind);
    nav.open({
      kind: "busList",
      label: getBusListPillLabel(busListKind),
      busListKind,
    });
  };
  const openHeldList = () => {
    analytics.kpiDrilldownOpened("held");
    nav.open({ kind: "heldList", label: "Repairs on Hold" });
  };
  const openBusRoot = (bus: Bus) => {
    analytics.busDetailOpened(bus.id, "chart");
    if (depotScope !== "all" && bus.garage !== depotScope) {
      analytics.crossGaragePeek(bus.id, depotScope, bus.garage);
    }
    nav.open({ kind: "bus", label: `Bus #${bus.busNumber}`, bus });
  };
  const openWorkOrderRoot = (wo: WorkOrder) => {
    analytics.woDetailOpened(wo.id, "tracker");
    nav.open({ kind: "workOrder", label: wo.id, workOrder: wo });
  };

  // Drill-down callbacks: the click originates from inside the open
  // panel, so we `drill` to push a new entry on top. The hook handles
  // stack management and wires the back button automatically.
  const drillToBus = (bus: Bus) => {
    analytics.busDetailOpened(bus.id, "history");
    if (depotScope !== "all" && bus.garage !== depotScope) {
      analytics.crossGaragePeek(bus.id, depotScope, bus.garage);
    }
    nav.drill({ kind: "bus", label: `Bus #${bus.busNumber}`, bus });
  };
  const drillToWorkOrder = (wo: WorkOrder) => {
    analytics.woDetailOpened(wo.id, "drilldown");
    nav.drill({ kind: "workOrder", label: wo.id, workOrder: wo });
  };
  const drillToHistoryEntry = (entry: BusHistoryEntry, bus: Bus) =>
    nav.drill({ kind: "historyEntry", label: entry.id, entry, bus });

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
          300 buses across 2 garages
        </p>
      </div>

      <KpiStrip onOpenStatusList={openBusList} onOpenHeldList={openHeldList} />
      <div className="mb-6">
        <FleetHealthChart onBusClick={openBusRoot} />
      </div>
      <div className="mb-6">
        <PartsRiskPanel />
      </div>
      <WorkOrderTracker onSelectWorkOrder={openWorkOrderRoot} />

      {/* Single sheet — stays open throughout navigation so content
          transitions in-place instead of closing and reopening. The
          key on the inner div triggers a fade-in whenever the entry
          changes (kind or record). */}
      <ResponsiveSheet
        open={current !== null}
        onOpenChange={(open) => !open && nav.close()}
      >
        <ResponsiveSheetContent side="right" className="p-0">
          <ResponsiveSheetTitle className="sr-only">
            {renderEntry?.kind === "busList"
              ? "Bus list"
              : renderEntry?.kind === "heldList"
                ? "Repairs on hold"
                : renderEntry?.kind === "bus"
                  ? `Bus #${renderEntry.bus.busNumber} details`
                  : renderEntry?.kind === "workOrder"
                    ? `Work order ${renderEntry.workOrder.id} details`
                    : renderEntry?.kind === "historyEntry"
                      ? `Service history ${renderEntry.entry.id} details`
                      : "Panel"}
          </ResponsiveSheetTitle>
          <ResponsiveSheetDescription className="sr-only">
            {renderEntry?.kind === "busList"
              ? "Filtered list of buses matching the selected fleet status."
              : renderEntry?.kind === "heldList"
                ? "Work orders currently blocked, sorted by time in shop."
                : renderEntry?.kind === "bus"
                  ? "Vehicle info, preventive maintenance status, active work orders, and service history."
                  : "Issue, stage progress, assignment, timeline, and the bus this work order is attached to."}
          </ResponsiveSheetDescription>
          {renderEntry && (
            <div
              key={`${renderEntry.kind}:${renderEntry.label}`}
              className="animate-in fade-in duration-150 h-full"
            >
              {renderEntry.kind === "busList" && (
                <BusListPanelContent
                  kind={renderEntry.busListKind}
                  onSelectBus={drillToBus}
                />
              )}
              {renderEntry.kind === "heldList" && (
                <HeldRepairsPanelContent
                  onSelectWorkOrder={drillToWorkOrder}
                />
              )}
              {renderEntry.kind === "bus" && (
                <BusPanelContent
                  bus={livePanelBus ?? renderEntry.bus}
                  onSelectWorkOrder={drillToWorkOrder}
                  onSchedulePm={handleSchedulePm}
                  onSelectHistoryEntry={(entry) =>
                    drillToHistoryEntry(entry, livePanelBus ?? renderEntry.bus)
                  }
                  backLabel={nav.backButton?.label}
                  onBack={nav.backButton?.onBack}
                />
              )}
              {(renderEntry.kind === "workOrder" ||
                renderEntry.kind === "historyEntry") && (
                <WorkOrderPanelContent
                  order={
                    renderEntry.kind === "workOrder"
                      ? livePanelWorkOrder
                      : null
                  }
                  historyEntry={
                    renderEntry.kind === "historyEntry"
                      ? renderEntry.entry
                      : null
                  }
                  bus={
                    renderEntry.kind === "workOrder"
                      ? (buses.find(
                          (b) => b.id === livePanelWorkOrder?.busId
                        ) ?? null)
                      : renderEntry.bus
                  }
                  onOpenBus={drillToBus}
                  backLabel={nav.backButton?.label}
                  onBack={nav.backButton?.onBack}
                />
              )}
            </div>
          )}
        </ResponsiveSheetContent>
      </ResponsiveSheet>
    </div>
  );
}
