"use client";

import { useMemo, useState } from "react";
import { TrackerRow } from "./tracker-row";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useFleet } from "@/contexts/fleet-context";
import { useDepot, filterByDepot } from "@/hooks/use-depot";
import { analytics } from "@/lib/analytics";
import {
  STAGE_LABELS,
  STAGE_ORDER,
  SEVERITY_COLORS,
  stageIndex,
} from "@/lib/constants";
import { getMTTR } from "@/lib/utils";
import type { Severity, WorkOrder, WorkOrderStage } from "@/data/types";
import {
  IconTruckFillDuo18,
  IconMagnifierCheckFillDuo18,
  IconWrenchFillDuo18,
  IconBadgeCheckFillDuo18,
  IconCheckFillDuo18,
  IconHandFillDuo18,
} from "nucleo-ui-fill-duo-18";

const STAGE_ICONS: Record<WorkOrderStage, React.ReactNode> = {
  intake: <IconTruckFillDuo18 />,
  triage: <IconMagnifierCheckFillDuo18 />,
  repair: <IconWrenchFillDuo18 />,
  "road-test": <IconBadgeCheckFillDuo18 />,
  done: <IconCheckFillDuo18 />,
};

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
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const { scope } = useDepot();
  const { workOrders } = useFleet();

  // Scope first (depot), then severity, then sort.
  const scopedOrders = useMemo(
    () => filterByDepot(workOrders, scope),
    [scope, workOrders]
  );

  const mttr = useMemo(() => getMTTR(scopedOrders), [scopedOrders]);

  const severityOrder = { critical: 0, high: 1, routine: 2 };
  const filtered = scopedOrders
    .filter((wo) => filter === "all" || wo.severity === filter)
    .filter((wo) => {
      if (stageFilter === "held") return wo.isHeld;
      if (stageFilter !== null) return wo.stage === stageFilter;
      return true;
    });
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

  return (
    <div>
      {/* Section header */}
      <div style={{ marginBottom: 20 }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
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
          {mttr !== null && <> &middot; avg. {mttr.toFixed(1)}d repair</>}
        </p>

        {/* Severity filter pills */}
        <ToggleGroup
          type="single"
          value={filter}
          onValueChange={(v) => { const next = (v || "all") as Severity | "all"; analytics.trackerSeverityFiltered(next); setFilter(next); }}
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
                {isActive && value !== "all" && (
                  <span style={{ fontSize: 13, fontWeight: 400, lineHeight: 1, marginLeft: -1 }}>×</span>
                )}
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </div>

      {/* Queue-by-stage bar — neutral pills with stage icons. */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#929292",
            }}
          >
            Queue by stage
          </span>
          {(filter !== "all" || stageFilter !== null) && (
            <button
              onClick={() => { setFilter("all"); setStageFilter(null); analytics.trackerSeverityFiltered("all"); analytics.trackerStageFiltered(null); }}
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#929292",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0 2px",
              }}
            >
              Clear all
            </button>
          )}
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
            const isActive = stageFilter === stage;
            return (
              <button
                key={stage}
                onClick={() => { const next = isActive ? null : stage; analytics.trackerStageFiltered(next); setStageFilter(next); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: isActive ? "#484848" : "#f7f7f7",
                  border: "none",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", color: isActive ? "#ffffff" : "#a0a0a0", width: 14, height: 14 }}>
                  {STAGE_ICONS[stage]}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: isActive ? "#ffffff" : "#929292",
                  }}
                >
                  {STAGE_LABELS[stage]}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: isActive ? "#ffffff" : "#6a6a6a",
                  }}
                >
                  {count}
                </span>
                {isActive && (
                  <span style={{ fontSize: 13, fontWeight: 400, color: "#ffffff", marginLeft: -1, lineHeight: 1 }}>×</span>
                )}
              </button>
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
          <button
            onClick={() => { const next = stageFilter === "held" ? null : "held"; analytics.trackerStageFiltered(next); setStageFilter(next); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 10px",
              borderRadius: 999,
              background: stageFilter === "held" ? "#484848" : "#f7f7f7",
              border: "none",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", color: stageFilter === "held" ? "#ffffff" : "#a0a0a0", width: 14, height: 14 }}>
              <IconHandFillDuo18 />
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: stageFilter === "held" ? "#ffffff" : "#929292",
              }}
            >
              Held
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: stageFilter === "held" ? "#ffffff" : "#6a6a6a",
              }}
            >
              {heldCount}
            </span>
            {stageFilter === "held" && (
              <span style={{ fontSize: 13, fontWeight: 400, color: "#ffffff", marginLeft: -1, lineHeight: 1 }}>×</span>
            )}
          </button>
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
            width: 280,
            flexShrink: 0,
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 600, color: "#b5b5b5" }}>
            Time
          </span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#b5b5b5", marginLeft: 8 }}>
            Severity
          </span>
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
