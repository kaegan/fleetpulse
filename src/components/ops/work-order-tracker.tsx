"use client";

import { useMemo, useState } from "react";
import { TrackerRow } from "./tracker-row";
import { SectionPill } from "@/components/section-pill";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { workOrders } from "@/data/work-orders";
import { useDepot, filterByDepot } from "@/hooks/use-depot";
import { STAGES, SEVERITY_COLORS, BRAND_COLOR } from "@/lib/constants";
import type { Severity, WorkOrder } from "@/data/types";
import { IconClipboardListFillDuo18 } from "nucleo-ui-fill-duo-18";

const FILTER_OPTIONS: Array<{ label: string; value: Severity | "all" }> = [
  { label: "All", value: "all" },
  { label: "Critical", value: "critical" },
  { label: "High", value: "high" },
  { label: "Routine", value: "routine" },
];

const SCOPE_SUFFIX: Record<"all" | "north" | "south", string> = {
  all: "across both garages",
  north: "in North Garage",
  south: "in South Garage",
};

interface WorkOrderTrackerProps {
  onSelectWorkOrder?: (order: WorkOrder) => void;
}

export function WorkOrderTracker({ onSelectWorkOrder }: WorkOrderTrackerProps = {}) {
  const [filter, setFilter] = useState<Severity | "all">("all");
  const { scope } = useDepot();

  // Scope first (depot), then severity, then sort.
  const scopedOrders = useMemo(
    () => filterByDepot(workOrders, scope),
    [scope]
  );

  const severityOrder = { critical: 0, high: 1, routine: 2 };
  const filtered =
    filter === "all"
      ? scopedOrders
      : scopedOrders.filter((wo) => wo.severity === filter);
  const sorted = [...filtered].sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return b.stage - a.stage; // further along first
  });

  // Stage counts for bottleneck bar — also scoped, so the bottleneck reflects
  // the same depot the user is looking at.
  const stageCounts = STAGES.map(
    (_, i) => scopedOrders.filter((wo) => wo.stage === i).length
  );
  // A "peak" only exists when one stage is strictly ahead of the rest.
  // When counts are tied (e.g. 2/2/2/2/2), nothing should glow — the whole
  // point of the bar is to surface an actual pile-up, not to decorate.
  const maxCount = Math.max(...stageCounts);
  const secondMax = [...stageCounts].sort((a, b) => b - a)[1] ?? 0;
  const hasPeak = maxCount > 0 && maxCount > secondMax;

  return (
    <div>
      {/* Section header */}
      <div className="mb-5">
        <div className="mb-2.5">
          <SectionPill
            label="Work Orders"
            color="var(--color-brand)"
            bgColor="var(--color-brand-light)"
            icon={<IconClipboardListFillDuo18 />}
          />
        </div>
        <h2 className="mb-1 text-[18px] font-bold tracking-[-0.02em] text-foreground">
          Active Work Orders
        </h2>
        <p className="text-[13px] font-medium text-text-muted">
          {sorted.length} orders {SCOPE_SUFFIX[scope]}
        </p>

        {/* Severity filter pills */}
        <ToggleGroup
          type="single"
          value={filter}
          onValueChange={(v) => v && setFilter(v as Severity | "all")}
          aria-label="Severity filter"
          className="mt-3.5 bg-transparent gap-1.5 p-0"
        >
          {FILTER_OPTIONS.map(({ label, value }) => {
            const isActive = filter === value;
            const dotColor =
              value !== "all" ? SEVERITY_COLORS[value].dot : undefined;
            return (
              <ToggleGroupItem
                key={value}
                value={value}
                className="rounded-full border-[1.5px] border-transparent bg-muted px-3.5 py-[5px] text-xs gap-1.5 text-text-secondary data-[state=on]:bg-[var(--primary)] data-[state=on]:text-white data-[state=on]:border-[var(--primary)] data-[state=on]:shadow-none"
              >
                {dotColor && (
                  <span
                    className="h-[7px] w-[7px] rounded-full"
                    style={{
                      background: isActive ? "var(--color-surface)" : dotColor,
                    }}
                  />
                )}
                {label}
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </div>

      {/* Queue-by-stage bar — informational, not a filter. Only the peak
          stage (if there is one) lights up in brand coral. In evenly
          distributed states, the whole row stays quiet. */}
      <div className="mb-5">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-text-faint">
          Queue by stage
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STAGES.map((stage, i) => {
            const count = stageCounts[i];
            const isPeak = hasPeak && count === maxCount;
            return (
              <div
                key={stage}
                className="flex items-center gap-1.5 rounded-pill px-2.5 py-[3px]"
                style={{
                  background: isPeak
                    ? "var(--color-brand-light)"
                    : "var(--color-surface-warm)",
                }}
              >
                <span
                  className="text-xs font-medium"
                  style={{
                    color: isPeak ? BRAND_COLOR : "var(--color-text-muted)",
                  }}
                >
                  {stage}
                </span>
                <span
                  className="text-xs font-bold"
                  style={{
                    color: isPeak ? BRAND_COLOR : "var(--color-text-secondary)",
                  }}
                >
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Column headers — desktop table layout only */}
      <div className="mb-2 hidden items-center gap-5 px-[18px] lg:flex">
        <div className="min-w-20 text-[11px] font-semibold text-text-faint">Bus</div>
        <div className="min-w-[180px] text-[11px] font-semibold text-text-faint">Issue</div>
        <div className="flex flex-1 items-center">
          {STAGES.map((stage, idx) => (
            <div key={stage} className="flex flex-1 items-center">
              <span className="whitespace-nowrap text-[11px] font-semibold text-text-faint">
                {stage}
              </span>
              {idx < STAGES.length - 1 && <div className="flex-1" />}
            </div>
          ))}
        </div>
        <div className="min-w-[60px] text-right text-[11px] font-semibold text-text-faint">Time</div>
        <div className="min-w-[70px] text-[11px] font-semibold text-text-faint">Severity</div>
      </div>

      {/* Tracker rows */}
      <div className="flex flex-col gap-2.5">
        {sorted.map((wo, i) => (
          <TrackerRow
            key={wo.id}
            order={wo}
            index={i}
            onSelectWorkOrder={onSelectWorkOrder}
          />
        ))}
      </div>
    </div>
  );
}
