"use client";

import { useMemo, useState } from "react";
import { TrackerRow } from "./tracker-row";
import { SectionPill } from "@/components/section-pill";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { workOrders } from "@/data/work-orders";
import { useDepot, filterByDepot } from "@/hooks/use-depot";
import { STAGES, KANBAN_STAGE_PILLS, SEVERITY_COLORS } from "@/lib/constants";
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
  const maxCount = Math.max(...stageCounts);

  return (
    <div>
      {/* Section header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 10 }}>
          <SectionPill
            label="Work Orders"
            color="#d4654a"
            bgColor="#fdf0ed"
            icon={<IconClipboardListFillDuo18 />}
          />
        </div>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#222222",
            letterSpacing: "-0.02em",
            marginBottom: 4,
          }}
        >
          Active Work Orders
        </h2>
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

      {/* Stage pipeline counts */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        {STAGES.map((stage, i) => {
          const count = stageCounts[i];
          const isBottleneck = count === maxCount && count > 0;
          const pill = KANBAN_STAGE_PILLS[stage];
          return (
            <div
              key={stage}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 12px",
                borderRadius: 999,
                background: isBottleneck ? pill.bg : "#f7f7f7",
                border: isBottleneck
                  ? `1.5px solid ${pill.color}`
                  : "1.5px solid transparent",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: isBottleneck ? pill.color : "#929292",
                }}
              >
                {stage}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: isBottleneck ? pill.color : "#6a6a6a",
                }}
              >
                {count}
              </span>
            </div>
          );
        })}
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
            minWidth: 180,
            fontSize: 11,
            fontWeight: 600,
            color: "#b5b5b5",
          }}
        >
          Issue
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          {STAGES.map((stage, idx) => (
            <div
              key={stage}
              style={{
                flex: 1,
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
                {stage}
              </span>
              {idx < STAGES.length - 1 && <div style={{ flex: 1 }} />}
            </div>
          ))}
        </div>
        <div
          style={{
            minWidth: 60,
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
            minWidth: 70,
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
