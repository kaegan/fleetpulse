"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type {
  Bus,
  BusHistoryEntry,
  Part,
  Severity,
  WorkOrder,
  WorkOrderStage,
} from "@/data/types";
import { useFleet } from "@/contexts/fleet-context";
import { filterByDepot, useDepot } from "@/hooks/use-depot";
import { usePanelNav } from "@/hooks/use-panel-nav";
import { analytics } from "@/lib/analytics";
import { stageIndex } from "@/lib/constants";
import {
  ResponsiveSheet,
  ResponsiveSheetContent,
  ResponsiveSheetDescription,
  ResponsiveSheetTitle,
} from "@/components/ui/responsive-sheet";
import { BusPanelContent } from "@/components/bus-detail-panel";
import { WorkOrderPanelContent } from "@/components/work-order-detail-panel";
import { PartDetailPanelContent } from "@/components/part-detail-panel";
import {
  WorkOrdersList,
  type WorkOrdersSortKey,
} from "./work-orders-list";
import {
  WorkOrdersToolbar,
  type WorkOrdersFilter,
} from "./work-orders-toolbar";

type WorkOrdersPanelEntry =
  | { kind: "workOrder"; label: string; workOrder: WorkOrder }
  | { kind: "bus"; label: string; bus: Bus }
  | { kind: "historyEntry"; label: string; entry: BusHistoryEntry; bus: Bus }
  | { kind: "part"; label: string; part: Part };

const SEVERITY_RANK: Record<Severity, number> = {
  critical: 0,
  high: 1,
  routine: 2,
};

export function WorkOrdersIndexView() {
  const { buses, workOrders, parts } = useFleet();
  const { scope } = useDepot();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<WorkOrdersFilter>("all");
  const [selectedStages, setSelectedStages] = useState<Set<WorkOrderStage>>(
    () => new Set()
  );
  const [selectedSeverities, setSelectedSeverities] = useState<Set<Severity>>(
    () => new Set()
  );
  const [selectedMechanics, setSelectedMechanics] = useState<Set<string>>(
    () => new Set()
  );
  const [sortKey, setSortKey] = useState<WorkOrdersSortKey>("severity");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const nav = usePanelNav<WorkOrdersPanelEntry>();
  const current = nav.current;
  const lastEntryRef = useRef<WorkOrdersPanelEntry | null>(null);
  if (current !== null) lastEntryRef.current = current;
  const renderEntry = current ?? lastEntryRef.current;

  const toggleStage = useCallback((stage: WorkOrderStage) => {
    setSelectedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stage)) next.delete(stage);
      else next.add(stage);
      return next;
    });
  }, []);
  const clearStages = useCallback(() => setSelectedStages(new Set()), []);

  const toggleSeverity = useCallback((severity: Severity) => {
    setSelectedSeverities((prev) => {
      const next = new Set(prev);
      if (next.has(severity)) next.delete(severity);
      else next.add(severity);
      return next;
    });
  }, []);
  const clearSeverities = useCallback(
    () => setSelectedSeverities(new Set()),
    []
  );

  const toggleMechanic = useCallback((mechanic: string) => {
    setSelectedMechanics((prev) => {
      const next = new Set(prev);
      if (next.has(mechanic)) next.delete(mechanic);
      else next.add(mechanic);
      return next;
    });
  }, []);
  const clearMechanics = useCallback(() => setSelectedMechanics(new Set()), []);

  const handleSort = useCallback((key: WorkOrdersSortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir("asc");
      return key;
    });
  }, []);

  const scopedOrders = useMemo(
    () => filterByDepot(workOrders, scope),
    [workOrders, scope]
  );

  const heldCount = useMemo(
    () => scopedOrders.filter((wo) => wo.isHeld).length,
    [scopedOrders]
  );

  const mechanicOptions = useMemo(() => {
    const names = new Set<string>();
    for (const wo of scopedOrders) {
      if (wo.mechanicName) names.add(wo.mechanicName);
    }
    const sorted = Array.from(names).sort((a, b) => a.localeCompare(b));
    return [
      ...sorted.map((n) => ({ value: n, label: n })),
      { value: "__unassigned__", label: "Unassigned" },
    ];
  }, [scopedOrders]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = scopedOrders.filter((wo) => {
      if (filter === "held" && !wo.isHeld) return false;
      if (selectedStages.size > 0 && !selectedStages.has(wo.stage)) return false;
      if (selectedSeverities.size > 0 && !selectedSeverities.has(wo.severity))
        return false;
      if (selectedMechanics.size > 0) {
        const key = wo.mechanicName ?? "__unassigned__";
        if (!selectedMechanics.has(key)) return false;
      }
      if (!needle) return true;
      return (
        wo.id.toLowerCase().includes(needle) ||
        wo.issue.toLowerCase().includes(needle) ||
        wo.busNumber.toLowerCase().includes(needle) ||
        (wo.mechanicName?.toLowerCase().includes(needle) ?? false)
      );
    });

    const sign = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "id":
          return sign * a.id.localeCompare(b.id);
        case "bus":
          return sign * a.busNumber.localeCompare(b.busNumber);
        case "mechanic": {
          const am = a.mechanicName ?? "\uffff"; // unassigned sort last in asc
          const bm = b.mechanicName ?? "\uffff";
          return sign * am.localeCompare(bm) || a.id.localeCompare(b.id);
        }
        case "opened":
          return (
            sign * a.createdAt.localeCompare(b.createdAt) ||
            a.id.localeCompare(b.id)
          );
        case "stage":
          return (
            sign * (stageIndex(a.stage) - stageIndex(b.stage)) ||
            b.createdAt.localeCompare(a.createdAt)
          );
        case "severity":
        default:
          return (
            sign * (SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]) ||
            b.createdAt.localeCompare(a.createdAt)
          );
      }
    });
  }, [
    scopedOrders,
    query,
    filter,
    selectedStages,
    selectedSeverities,
    selectedMechanics,
    sortKey,
    sortDir,
  ]);

  const livePanelWo = useMemo(() => {
    if (renderEntry?.kind !== "workOrder") return null;
    return (
      workOrders.find((wo) => wo.id === renderEntry.workOrder.id) ??
      renderEntry.workOrder
    );
  }, [renderEntry, workOrders]);
  const livePanelBus = useMemo(() => {
    if (renderEntry?.kind === "bus") {
      return buses.find((b) => b.id === renderEntry.bus.id) ?? renderEntry.bus;
    }
    if (renderEntry?.kind === "historyEntry") {
      return buses.find((b) => b.id === renderEntry.bus.id) ?? renderEntry.bus;
    }
    return null;
  }, [renderEntry, buses]);
  const livePanelPart = useMemo(() => {
    if (renderEntry?.kind !== "part") return null;
    return parts.find((p) => p.id === renderEntry.part.id) ?? renderEntry.part;
  }, [renderEntry, parts]);

  const openWorkOrder = (wo: WorkOrder) => {
    analytics.woDetailOpened(wo.id, "tracker");
    nav.open({ kind: "workOrder", label: wo.id, workOrder: wo });
  };
  const drillToBus = (bus: Bus) => {
    analytics.busDetailOpened(bus.id, "history");
    nav.drill({ kind: "bus", label: `Bus #${bus.busNumber}`, bus });
  };
  const drillToWorkOrder = (wo: WorkOrder) => {
    analytics.woDetailOpened(wo.id, "drilldown");
    nav.drill({ kind: "workOrder", label: wo.id, workOrder: wo });
  };
  const drillToHistoryEntry = (entry: BusHistoryEntry, bus: Bus) =>
    nav.drill({ kind: "historyEntry", label: entry.id, entry, bus });
  const drillToPart = (part: Part) => {
    analytics.partDetailOpened(part.id, "wo-panel");
    nav.drill({ kind: "part", label: part.name, part });
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-10">
      <div className="mb-6">
        <h1 className="mb-1 text-[22px] font-bold tracking-[-0.03em] text-foreground">
          Work Orders
        </h1>
        <p className="text-sm font-medium text-text-secondary">
          {scopedOrders.length} work orders · {heldCount} held{" "}
          {scope === "all"
            ? "across both garages"
            : `in ${scope === "north" ? "North" : "South"} garage`}
        </p>
      </div>

      <WorkOrdersToolbar
        query={query}
        onQueryChange={setQuery}
        filter={filter}
        onFilterChange={setFilter}
        heldCount={heldCount}
        selectedStages={selectedStages}
        onToggleStage={toggleStage}
        onClearStages={clearStages}
        selectedSeverities={selectedSeverities}
        onToggleSeverity={toggleSeverity}
        onClearSeverities={clearSeverities}
        mechanicOptions={mechanicOptions}
        selectedMechanics={selectedMechanics}
        onToggleMechanic={toggleMechanic}
        onClearMechanics={clearMechanics}
      />

      <WorkOrdersList
        orders={rows}
        onSelectOrder={openWorkOrder}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
      />

      <ResponsiveSheet
        open={current !== null}
        onOpenChange={(open) => !open && nav.close()}
      >
        <ResponsiveSheetContent side="right" className="p-0">
          <ResponsiveSheetTitle className="sr-only">
            {renderEntry?.kind === "workOrder"
              ? `Work order ${renderEntry.workOrder.id} details`
              : renderEntry?.kind === "bus"
                ? `Bus #${renderEntry.bus.busNumber} details`
                : renderEntry?.kind === "historyEntry"
                  ? `Service history ${renderEntry.entry.id} details`
                  : renderEntry?.kind === "part"
                    ? `${renderEntry.part.name} details`
                    : "Panel"}
          </ResponsiveSheetTitle>
          <ResponsiveSheetDescription className="sr-only">
            Linked record drill-down from the Work Orders database.
          </ResponsiveSheetDescription>
          {renderEntry && (
            <div
              key={`${renderEntry.kind}:${renderEntry.label}`}
              className="animate-in fade-in h-full duration-150"
            >
              {(renderEntry.kind === "workOrder" ||
                renderEntry.kind === "historyEntry") && (
                <WorkOrderPanelContent
                  order={
                    renderEntry.kind === "workOrder" ? livePanelWo : null
                  }
                  historyEntry={
                    renderEntry.kind === "historyEntry"
                      ? renderEntry.entry
                      : null
                  }
                  bus={
                    renderEntry.kind === "workOrder"
                      ? buses.find((b) => b.id === livePanelWo?.busId) ?? null
                      : renderEntry.bus
                  }
                  onOpenBus={drillToBus}
                  onSelectPart={drillToPart}
                  backLabel={nav.backButton?.label}
                  onBack={nav.backButton?.onBack}
                />
              )}
              {renderEntry.kind === "bus" && livePanelBus && (
                <BusPanelContent
                  bus={livePanelBus}
                  onSelectWorkOrder={drillToWorkOrder}
                  onSelectHistoryEntry={(entry) =>
                    drillToHistoryEntry(entry, livePanelBus)
                  }
                  backLabel={nav.backButton?.label}
                  onBack={nav.backButton?.onBack}
                />
              )}
              {renderEntry.kind === "part" && livePanelPart && (
                <PartDetailPanelContent
                  part={livePanelPart}
                  onSelectWorkOrder={drillToWorkOrder}
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
