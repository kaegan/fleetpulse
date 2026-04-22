"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { Part, WorkOrder } from "@/data/types";
import { useFleet } from "@/contexts/fleet-context";
import { useDepot } from "@/hooks/use-depot";
import { usePanelNav } from "@/hooks/use-panel-nav";
import { analytics } from "@/lib/analytics";
import { classifyPart, isAtRisk } from "@/lib/parts-urgency";
import {
  ResponsiveSheet,
  ResponsiveSheetContent,
  ResponsiveSheetDescription,
  ResponsiveSheetTitle,
} from "@/components/ui/responsive-sheet";
import { PartDetailPanelContent } from "@/components/part-detail-panel";
import { WorkOrderPanelContent } from "@/components/work-order-detail-panel";
import { PartsList, type PartsSortKey, type SortDirection } from "./parts-list";
import { PartsToolbar, type PartsFilter } from "./parts-toolbar";

type PartsPanelEntry =
  | { kind: "part"; label: string; part: Part }
  | { kind: "workOrder"; label: string; workOrder: WorkOrder };

const URGENCY_SORT_RANK: Record<string, number> = {
  stockout: 0,
  "at-reorder": 1,
  "at-risk-soon": 2,
  healthy: 3,
};

export function PartsIndexView() {
  const { parts, workOrders, buses } = useFleet();
  const { scope } = useDepot();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<PartsFilter>("all");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    () => new Set()
  );
  const [sortKey, setSortKey] = useState<PartsSortKey>("status");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  const nav = usePanelNav<PartsPanelEntry>();
  const current = nav.current;
  const lastEntryRef = useRef<PartsPanelEntry | null>(null);
  if (current !== null) lastEntryRef.current = current;
  const renderEntry = current ?? lastEntryRef.current;

  const categories = useMemo(
    () => Array.from(new Set(parts.map((p) => p.category))).sort(),
    [parts]
  );

  const atRiskCount = useMemo(
    () => parts.filter((p) => isAtRisk(p, scope)).length,
    [parts, scope]
  );

  const toggleCategory = useCallback((cat: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const clearCategories = useCallback(() => setSelectedCategories(new Set()), []);

  const handleSort = useCallback((key: PartsSortKey) => {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prevKey;
      }
      // New column — sensible default direction by kind.
      setSortDir(
        key === "stockNorth" || key === "stockSouth" ? "asc" : "asc"
      );
      return key;
    });
  }, []);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = parts.filter((p) => {
      if (filter === "at-risk" && !isAtRisk(p, scope)) return false;
      if (selectedCategories.size > 0 && !selectedCategories.has(p.category))
        return false;
      if (!needle) return true;
      return (
        p.name.toLowerCase().includes(needle) ||
        p.category.toLowerCase().includes(needle)
      );
    });

    const sign = sortDir === "asc" ? 1 : -1;
    const sorted = [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "name":
          return sign * a.name.localeCompare(b.name);
        case "category": {
          const c = a.category.localeCompare(b.category);
          return c !== 0 ? sign * c : a.name.localeCompare(b.name);
        }
        case "stockNorth":
          return sign * (a.stockNorth - b.stockNorth) ||
            a.name.localeCompare(b.name);
        case "stockSouth":
          return sign * (a.stockSouth - b.stockSouth) ||
            a.name.localeCompare(b.name);
        case "status":
        default: {
          const rankDiff =
            URGENCY_SORT_RANK[classifyPart(a, scope).level] -
            URGENCY_SORT_RANK[classifyPart(b, scope).level];
          if (rankDiff !== 0) return sign * rankDiff;
          return a.name.localeCompare(b.name);
        }
      }
    });
    return sorted;
  }, [parts, scope, filter, query, selectedCategories, sortKey, sortDir]);

  const livePart = useMemo(() => {
    if (renderEntry?.kind !== "part") return null;
    return parts.find((p) => p.id === renderEntry.part.id) ?? renderEntry.part;
  }, [renderEntry, parts]);

  const liveWorkOrder = useMemo(() => {
    if (renderEntry?.kind !== "workOrder") return null;
    return (
      workOrders.find((wo) => wo.id === renderEntry.workOrder.id) ??
      renderEntry.workOrder
    );
  }, [renderEntry, workOrders]);

  const openPart = (part: Part) => {
    analytics.partDetailOpened(part.id, "parts-index");
    nav.open({ kind: "part", label: part.name, part });
  };
  const drillToWorkOrder = (wo: WorkOrder) => {
    analytics.woDetailOpened(wo.id, "part-panel");
    nav.drill({ kind: "workOrder", label: wo.id, workOrder: wo });
  };
  const drillToPart = (part: Part) => {
    analytics.partDetailOpened(part.id, "wo-panel");
    nav.drill({ kind: "part", label: part.name, part });
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-10">
      <div className="mb-6">
        <h1 className="mb-1 text-[22px] font-bold tracking-[-0.03em] text-foreground">
          Parts
        </h1>
        <p className="text-sm font-medium text-text-secondary">
          {parts.length} parts · {atRiskCount} at risk{" "}
          {scope === "all"
            ? "across both garages"
            : `in ${scope === "north" ? "North" : "South"} garage`}
        </p>
      </div>

      <PartsToolbar
        query={query}
        onQueryChange={setQuery}
        filter={filter}
        onFilterChange={setFilter}
        atRiskCount={atRiskCount}
        categories={categories}
        selectedCategories={selectedCategories}
        onToggleCategory={toggleCategory}
        onClearCategories={clearCategories}
      />

      <PartsList
        parts={rows}
        scope={scope}
        onSelectPart={openPart}
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
            {renderEntry?.kind === "part"
              ? `${renderEntry.part.name} details`
              : renderEntry?.kind === "workOrder"
                ? `Work order ${renderEntry.workOrder.id} details`
                : "Panel"}
          </ResponsiveSheetTitle>
          <ResponsiveSheetDescription className="sr-only">
            {renderEntry?.kind === "part"
              ? "Stock levels, consumption rate, lead time, and active work orders using this part."
              : "Issue, stage progress, assignment, and the bus this work order is attached to."}
          </ResponsiveSheetDescription>
          {renderEntry && (
            <div
              key={`${renderEntry.kind}:${renderEntry.label}`}
              className="animate-in fade-in h-full duration-150"
            >
              {renderEntry.kind === "part" && livePart && (
                <PartDetailPanelContent
                  part={livePart}
                  onSelectWorkOrder={drillToWorkOrder}
                  backLabel={nav.backButton?.label}
                  onBack={nav.backButton?.onBack}
                />
              )}
              {renderEntry.kind === "workOrder" && liveWorkOrder && (
                <WorkOrderPanelContent
                  order={liveWorkOrder}
                  historyEntry={null}
                  bus={
                    buses.find((b) => b.id === liveWorkOrder.busId) ?? null
                  }
                  onOpenBus={() => undefined}
                  onSelectPart={drillToPart}
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
