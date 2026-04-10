"use client";

import { useState } from "react";
import { TrackerRow } from "./tracker-row";
import { SectionPill } from "@/components/section-pill";
import { workOrders } from "@/data/work-orders";
import { STAGES, KANBAN_STAGE_PILLS, SEVERITY_COLORS, BRAND_COLOR } from "@/lib/constants";
import type { Bus, Severity } from "@/data/types";
import { IconClipboardListFillDuo18 } from "nucleo-ui-fill-duo-18";

const FILTER_OPTIONS: Array<{ label: string; value: Severity | "all" }> = [
  { label: "All", value: "all" },
  { label: "Critical", value: "critical" },
  { label: "High", value: "high" },
  { label: "Routine", value: "routine" },
];

interface WorkOrderTrackerProps {
  onSelectBus?: (bus: Bus) => void;
}

export function WorkOrderTracker({ onSelectBus }: WorkOrderTrackerProps = {}) {
  const [filter, setFilter] = useState<Severity | "all">("all");

  // Show all active work orders, sorted by severity then stage
  const severityOrder = { critical: 0, high: 1, routine: 2 };
  const filtered =
    filter === "all"
      ? workOrders
      : workOrders.filter((wo) => wo.severity === filter);
  const sorted = [...filtered].sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return b.stage - a.stage; // further along first
  });

  // Stage counts for bottleneck bar
  const stageCounts = STAGES.map(
    (_, i) => workOrders.filter((wo) => wo.stage === i).length
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
          {sorted.length} orders across both garages
        </p>

        {/* Severity filter pills */}
        <div
          style={{
            display: "flex",
            gap: 6,
            marginTop: 14,
          }}
        >
          {FILTER_OPTIONS.map(({ label, value }) => {
            const isActive = filter === value;
            const dotColor =
              value !== "all"
                ? SEVERITY_COLORS[value].dot
                : undefined;
            return (
              <button
                key={value}
                onClick={() => setFilter(value)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 14px",
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#ffffff" : "#6a6a6a",
                  background: isActive ? BRAND_COLOR : "#f7f7f7",
                  border: "1.5px solid",
                  borderColor: isActive ? BRAND_COLOR : "transparent",
                  borderRadius: 999,
                  cursor: "pointer",
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
              </button>
            );
          })}
        </div>
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

      {/* Column headers */}
      <div
        style={{
          display: "flex",
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
          {["Queued", "Diagnosed", "Parts Ready", "In Repair", "QA Check"].map(
            (stage, idx) => (
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
                {idx < 4 && <div style={{ flex: 1 }} />}
              </div>
            )
          )}
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
            onSelectBus={onSelectBus}
          />
        ))}
      </div>
    </div>
  );
}
