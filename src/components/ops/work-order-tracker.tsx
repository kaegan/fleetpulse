"use client";

import { useMemo, useState } from "react";
import { TrackerRow } from "./tracker-row";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useWorkOrders } from "@/contexts/work-orders-context";
import { useDepot, filterByDepot } from "@/hooks/use-depot";
import {
  STAGE_LABELS,
  STAGE_ORDER,
  SEVERITY_COLORS,
  BRAND_COLOR,
  HELD_PILL,
  stageIndex,
} from "@/lib/constants";
import { getMTTR } from "@/lib/utils";
import type { Severity, WorkOrder } from "@/data/types";

const FILTER_OPTIONS: Array<{ label: string; value: Severity | "all" }> = [
  { label: "All", value: "all" },
  { label: "Critical", value: "critical" },
  { label: "High", value: "high" },
  { label: "Routine", value: "routine" },
];

const SCOPE_SUFFIX: Record<"all" | "north" | "south", string> = {
  all: "across both garages",
  north: "in garage",
  south: "in garage",
};

interface WorkOrderTrackerProps {
  onSelectWorkOrder?: (order: WorkOrder) => void;
}

export function WorkOrderTracker({ onSelectWorkOrder }: WorkOrderTrackerProps = {}) {
  const [filter, setFilter] = useState<Severity | "all">("all");
  const { scope } = useDepot();
  const { workOrders } = useWorkOrders();

  // Scope first (depot), then severity, then sort.
  const scopedOrders = useMemo(
    () => filterByDepot(workOrders, scope),
    [scope, workOrders]
  );

  const mttr = useMemo(() => getMTTR(scopedOrders), [scopedOrders]);

  const severityOrder = { critical: 0, high: 1, routine: 2 };
  const filtered =
    filter === "all"
      ? scopedOrders
      : scopedOrders.filter((wo) => wo.severity === filter);
  const sorted = [...filtered].sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return stageIndex(b.stage) - stageIndex(a.stage); // further along first
  });

  // Stage counts for the bottleneck bar — also scoped, so the bottleneck
  // reflects the same depot the user is looking at.
  const stageCounts = STAGE_ORDER.map(
    (stage) => scopedOrders.filter((wo) => wo.stage === stage).length
  );
  // Cross-cutting held count (orthogonal to stage).
  const heldCount = scopedOrders.filter((wo) => wo.isHeld).length;
  // A "peak" only exists when one stage is strictly ahead of the rest.
  // When counts are tied (e.g. 2/2/2/2/2), nothing should glow — the whole
  // point of the bar is to surface an actual pile-up, not to decorate.
  const maxCount = Math.max(...stageCounts);
  const secondMax = [...stageCounts].sort((a, b) => b - a)[1] ?? 0;
  const hasPeak = maxCount > 0 && maxCount > secondMax;

  return (
    <div>
      {/* Section header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#222222",
              letterSpacing: "-0.02em",
            }}
          >
            Active Work Orders
          </h2>
          {mttr !== null && (
            <span style={{ fontSize: 13, fontWeight: 500, color: "#929292" }}>
              Avg. repair: {mttr.toFixed(1)} days
            </span>
          )}
        </div>
        <p
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "#929292",
          }}
        >
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
                className="rounded-full border-[1.5px] border-transparent bg-[#f7f7f7] px-3.5 py-[5px] text-xs gap-1.5 data-[state=on]:bg-[var(--primary)] data-[state=on]:text-white data-[state=on]:border-[var(--primary)] data-[state=on]:shadow-none"
                style={{
                  color: isActive ? "#ffffff" : "#6a6a6a",
                }}
              >
                {dotColor && (
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: isActive ? "#ffffff" : dotColor,
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
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#929292",
            marginBottom: 8,
          }}
        >
          Queue by stage
        </div>
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          {STAGE_ORDER.map((stage, i) => {
            const count = stageCounts[i];
            const isPeak = hasPeak && count === maxCount;
            return (
              <div
                key={stage}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: isPeak ? "#fdf0ed" : "#f7f7f7",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: isPeak ? BRAND_COLOR : "#929292",
                  }}
                >
                  {STAGE_LABELS[stage]}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: isPeak ? BRAND_COLOR : "#6a6a6a",
                  }}
                >
                  {count}
                </span>
              </div>
            );
          })}
          {/* Divider + cross-cutting Held pill */}
          <div
            style={{
              width: 1,
              height: 18,
              background: "rgba(0,0,0,0.08)",
              alignSelf: "center",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 10px",
              borderRadius: 999,
              background: heldCount > 0 ? HELD_PILL.bg : "#f7f7f7",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: heldCount > 0 ? HELD_PILL.color : "#929292",
              }}
            >
              Held
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: heldCount > 0 ? HELD_PILL.color : "#6a6a6a",
              }}
            >
              {heldCount}
            </span>
          </div>
        </div>
      </div>

      {/* Column headers — desktop table layout only */}
      <div
        className="hidden lg:flex"
        style={{
          alignItems: "center",
          gap: 20,
          padding: "0 18px",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            minWidth: 80,
            fontSize: 11,
            fontWeight: 600,
            color: "#b5b5b5",
          }}
        >
          Bus
        </div>
        <div
          style={{
            width: 180,
            flexShrink: 0,
            fontSize: 11,
            fontWeight: 600,
            color: "#b5b5b5",
          }}
        >
          Issue
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          {STAGE_ORDER.map((stage, idx) => (
            <div
              key={stage}
              style={{
                flex: idx < STAGE_ORDER.length - 1 ? 1 : "none",
                display: "flex",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#b5b5b5",
                  whiteSpace: "nowrap",
                }}
              >
                {STAGE_LABELS[stage]}
              </span>
              {idx < STAGE_ORDER.length - 1 && <div style={{ flex: 1 }} />}
            </div>
          ))}
        </div>
        <div
          style={{
            width: 120,
            flexShrink: 0,
            fontSize: 11,
            fontWeight: 600,
            color: "#b5b5b5",
            textAlign: "right",
          }}
        >
          Time
        </div>
        <div
          style={{
            flexShrink: 0,
            fontSize: 11,
            fontWeight: 600,
            color: "#b5b5b5",
          }}
        >
          Severity
        </div>
      </div>

      {/* Tracker rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
