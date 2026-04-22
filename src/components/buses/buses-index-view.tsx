"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type {
  Bus,
  BusHistoryEntry,
  BusStatus,
  Part,
  WorkOrder,
} from "@/data/types";
import { useFleet } from "@/contexts/fleet-context";
import { filterByDepot, useDepot } from "@/hooks/use-depot";
import { usePanelNav } from "@/hooks/use-panel-nav";
import { analytics } from "@/lib/analytics";
import { getAvailabilityRate, milesUntilPm } from "@/lib/utils";
import {
  ResponsiveSheet,
  ResponsiveSheetContent,
  ResponsiveSheetDescription,
  ResponsiveSheetTitle,
} from "@/components/ui/responsive-sheet";
import { BusPanelContent } from "@/components/bus-detail-panel";
import { WorkOrderPanelContent } from "@/components/work-order-detail-panel";
import { PartDetailPanelContent } from "@/components/part-detail-panel";
import { BusesList, type BusesSortKey } from "./buses-list";
import { BusesToolbar } from "./buses-toolbar";

type BusesPanelEntry =
  | { kind: "bus"; label: string; bus: Bus }
  | { kind: "workOrder"; label: string; workOrder: WorkOrder }
  | { kind: "historyEntry"; label: string; entry: BusHistoryEntry; bus: Bus }
  | { kind: "part"; label: string; part: Part };

const STATUS_RANK: Record<BusStatus, number> = {
  "road-call": 0,
  "in-maintenance": 1,
  "pm-due": 2,
  running: 3,
};

export function BusesIndexView() {
  const { buses, workOrders, parts } = useFleet();
  const { scope } = useDepot();
  const [query, setQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<Set<BusStatus>>(
    () => new Set()
  );
  const [sortKey, setSortKey] = useState<BusesSortKey>("number");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const nav = usePanelNav<BusesPanelEntry>();
  const current = nav.current;
  const lastEntryRef = useRef<BusesPanelEntry | null>(null);
  if (current !== null) lastEntryRef.current = current;
  const renderEntry = current ?? lastEntryRef.current;

  const toggleStatus = useCallback((status: BusStatus) => {
    setSelectedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }, []);
  const clearStatuses = useCallback(() => setSelectedStatuses(new Set()), []);

  const handleSort = useCallback((key: BusesSortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir("asc");
      return key;
    });
  }, []);

  const scopedBuses = useMemo(
    () => filterByDepot(buses, scope),
    [buses, scope]
  );

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = scopedBuses.filter((b) => {
      if (selectedStatuses.size > 0 && !selectedStatuses.has(b.status))
        return false;
      if (!needle) return true;
      return (
        b.busNumber.toLowerCase().includes(needle) ||
        b.model.toLowerCase().includes(needle) ||
        String(b.year).includes(needle)
      );
    });

    const sign = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "number":
          return sign * a.busNumber.localeCompare(b.busNumber);
        case "model":
          return (
            sign *
              (a.model.localeCompare(b.model) ||
                a.year - b.year ||
                a.busNumber.localeCompare(b.busNumber))
          );
        case "mileage":
          return (
            sign * (a.mileage - b.mileage) ||
            a.busNumber.localeCompare(b.busNumber)
          );
        case "nextPm":
          return (
            sign * (milesUntilPm(a) - milesUntilPm(b)) ||
            a.busNumber.localeCompare(b.busNumber)
          );
        case "status":
        default:
          return (
            sign * (STATUS_RANK[a.status] - STATUS_RANK[b.status]) ||
            a.busNumber.localeCompare(b.busNumber)
          );
      }
    });
  }, [scopedBuses, query, selectedStatuses, sortKey, sortDir]);

  // Match Fleet Overview's availability framing: "available" = running + pm-due
  // (overdue but still operational); "unavailable" = in-maintenance + road-call.
  // Reports the same rate the KPI strip shows so the two surfaces can't drift.
  const availabilityRate = useMemo(
    () => (scopedBuses.length > 0 ? getAvailabilityRate(scopedBuses) : 0),
    [scopedBuses]
  );
  const unavailableCount = useMemo(
    () =>
      scopedBuses.filter(
        (b) => b.status === "in-maintenance" || b.status === "road-call"
      ).length,
    [scopedBuses]
  );

  // Live panel lookups (so panel content stays fresh across context mutations).
  const livePanelBus = useMemo(() => {
    if (renderEntry?.kind === "bus") {
      return buses.find((b) => b.id === renderEntry.bus.id) ?? renderEntry.bus;
    }
    if (renderEntry?.kind === "historyEntry") {
      return (
        buses.find((b) => b.id === renderEntry.bus.id) ?? renderEntry.bus
      );
    }
    return null;
  }, [renderEntry, buses]);
  const livePanelWorkOrder = useMemo(() => {
    if (renderEntry?.kind !== "workOrder") return null;
    return (
      workOrders.find((wo) => wo.id === renderEntry.workOrder.id) ??
      renderEntry.workOrder
    );
  }, [renderEntry, workOrders]);
  const livePanelPart = useMemo(() => {
    if (renderEntry?.kind !== "part") return null;
    return parts.find((p) => p.id === renderEntry.part.id) ?? renderEntry.part;
  }, [renderEntry, parts]);

  const openBus = (bus: Bus) => {
    analytics.busDetailOpened(bus.id, "search");
    nav.open({ kind: "bus", label: `Bus #${bus.busNumber}`, bus });
  };
  const drillToWorkOrder = (wo: WorkOrder) => {
    analytics.woDetailOpened(wo.id, "drilldown");
    nav.drill({ kind: "workOrder", label: wo.id, workOrder: wo });
  };
  const drillToBus = (bus: Bus) => {
    analytics.busDetailOpened(bus.id, "history");
    nav.drill({ kind: "bus", label: `Bus #${bus.busNumber}`, bus });
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
          Buses
        </h1>
        <p className="text-sm font-medium text-text-secondary">
          {scopedBuses.length} buses · {availabilityRate.toFixed(1)}% available
          · {unavailableCount} unavailable{" "}
          {scope === "all"
            ? "across both garages"
            : `in ${scope === "north" ? "North" : "South"} garage`}
        </p>
      </div>

      <BusesToolbar
        query={query}
        onQueryChange={setQuery}
        selectedStatuses={selectedStatuses}
        onToggleStatus={toggleStatus}
        onClearStatuses={clearStatuses}
      />

      <BusesList
        buses={rows}
        onSelectBus={openBus}
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
            {renderEntry?.kind === "bus"
              ? `Bus #${renderEntry.bus.busNumber} details`
              : renderEntry?.kind === "workOrder"
                ? `Work order ${renderEntry.workOrder.id} details`
                : renderEntry?.kind === "historyEntry"
                  ? `Service history ${renderEntry.entry.id} details`
                  : renderEntry?.kind === "part"
                    ? `${renderEntry.part.name} details`
                    : "Panel"}
          </ResponsiveSheetTitle>
          <ResponsiveSheetDescription className="sr-only">
            Linked record drill-down from the Buses database.
          </ResponsiveSheetDescription>
          {renderEntry && (
            <div
              key={`${renderEntry.kind}:${renderEntry.label}`}
              className="animate-in fade-in h-full duration-150"
            >
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
              {(renderEntry.kind === "workOrder" ||
                renderEntry.kind === "historyEntry") && (
                <WorkOrderPanelContent
                  order={
                    renderEntry.kind === "workOrder" ? livePanelWorkOrder : null
                  }
                  historyEntry={
                    renderEntry.kind === "historyEntry"
                      ? renderEntry.entry
                      : null
                  }
                  bus={
                    renderEntry.kind === "workOrder"
                      ? buses.find((b) => b.id === livePanelWorkOrder?.busId) ??
                        null
                      : renderEntry.bus
                  }
                  onOpenBus={drillToBus}
                  onSelectPart={drillToPart}
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
