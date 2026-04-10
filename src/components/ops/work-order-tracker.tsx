"use client";

import { TrackerRow } from "./tracker-row";
import { SectionPill } from "@/components/section-pill";
import { workOrders } from "@/data/work-orders";
import { IconClipboardListFillDuo18 } from "nucleo-ui-fill-duo-18";

export function WorkOrderTracker() {
  // Show all active work orders, sorted by severity then stage
  const severityOrder = { critical: 0, high: 1, routine: 2 };
  const sorted = [...workOrders].sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return b.stage - a.stage; // further along first
  });

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
      </div>

      {/* Stage labels header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          padding: "0 18px",
          marginBottom: 8,
        }}
      >
        <div style={{ minWidth: 80 }} />
        <div style={{ minWidth: 180 }} />
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
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.04em",
                    color: "#b5b5b5",
                    width: 26,
                    textAlign: "center",
                  }}
                >
                  {idx === 0
                    ? "Q"
                    : idx === 1
                      ? "D"
                      : idx === 2
                        ? "PR"
                        : idx === 3
                          ? "IR"
                          : "QA"}
                </span>
                {idx < 4 && <div style={{ flex: 1 }} />}
              </div>
            )
          )}
        </div>
        <div style={{ minWidth: 60 }} />
        <div style={{ minWidth: 70 }} />
      </div>

      {/* Tracker rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sorted.map((wo, i) => (
          <TrackerRow key={wo.id} order={wo} index={i} />
        ))}
      </div>
    </div>
  );
}
