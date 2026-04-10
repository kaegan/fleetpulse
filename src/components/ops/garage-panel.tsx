"use client";

import { BusDot } from "./bus-dot";
import type { Bus } from "@/data/types";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import { getStatusCounts } from "@/lib/utils";

interface GaragePanelProps {
  garageName: string;
  buses: Bus[];
  onBusClick: (bus: Bus) => void;
}

const LEGEND_ITEMS: Array<{
  status: keyof typeof STATUS_COLORS;
  border?: boolean;
}> = [
  { status: "running" },
  { status: "pm-due" },
  { status: "in-maintenance" },
  { status: "road-call", border: true },
];

export function GaragePanel({ garageName, buses, onBusClick }: GaragePanelProps) {
  const counts = getStatusCounts(
    buses,
    buses[0]?.garage
  );

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 20,
        padding: 20,
        boxShadow:
          "0px 0px 0px 1px rgba(0,0,0,0.02), 0px 2px 6px rgba(0,0,0,0.04), 0px 4px 8px rgba(0,0,0,0.08)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#222222",
            letterSpacing: "-0.02em",
          }}
        >
          {garageName}
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "#929292",
          }}
        >
          {counts.total} buses &middot; {counts.running} available
        </span>
      </div>

      {/* Dot grid */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          marginBottom: 14,
        }}
      >
        {buses.map((bus) => (
          <BusDot key={bus.id} bus={bus} onClick={onBusClick} />
        ))}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: 16,
          paddingTop: 12,
          borderTop: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        {LEGEND_ITEMS.map(({ status, border }) => (
          <div
            key={status}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: STATUS_COLORS[status],
                border: border ? "1.5px solid #ef4444" : "none",
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "#929292",
              }}
            >
              {STATUS_LABELS[status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
