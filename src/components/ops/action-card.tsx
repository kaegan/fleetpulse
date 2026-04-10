"use client";

import { useMemo, useState } from "react";
import { buses } from "@/data/buses";
import { workOrders } from "@/data/work-orders";
import type { Bus } from "@/data/types";
import { milesUntilPm, formatNumber } from "@/lib/utils";
import { SectionPill } from "@/components/section-pill";
import { IconTriangleWarningFillDuo18 } from "nucleo-ui-fill-duo-18";

interface ActionCardProps {
  onBusClick: (bus: Bus) => void;
}

const MAX_ROWS = 5;

interface OverdueEntry {
  bus: Bus;
  overdueMiles: number;
}

export function ActionCard({ onBusClick }: ActionCardProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const actionable = useMemo<OverdueEntry[]>(() => {
    // Exclude buses already in an active work order — those are already scheduled.
    const busesWithActiveWO = new Set(workOrders.map((wo) => wo.busId));
    return buses
      .map((bus) => ({ bus, overdueMiles: -milesUntilPm(bus) }))
      .filter(
        ({ bus, overdueMiles }) =>
          overdueMiles > 0 && !busesWithActiveWO.has(bus.id)
      )
      .sort((a, b) => b.overdueMiles - a.overdueMiles);
  }, []);

  const topRows = actionable.slice(0, MAX_ROWS);
  const remainingCount = actionable.length - topRows.length;

  // Positive empty state — still worth rendering the card so the layout stays stable.
  if (actionable.length === 0) {
    return (
      <div
        style={{
          background: "#ffffff",
          borderRadius: 24,
          padding: 24,
          boxShadow:
            "0px 0px 0px 1px rgba(0,0,0,0.02), 0px 2px 6px rgba(0,0,0,0.03), 0px 4px 8px rgba(0,0,0,0.04)",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <SectionPill
          label="Fleet On Schedule"
          color="#22c55e"
          bgColor="#f0fdf4"
        />
        <p
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#6a6a6a",
            margin: 0,
          }}
        >
          Nothing overdue right now. Every bus has runway before its next PM service.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 24,
        padding: 24,
        boxShadow:
          "0px 0px 0px 1px rgba(0,0,0,0.02), 0px 2px 6px rgba(0,0,0,0.03), 0px 4px 8px rgba(0,0,0,0.04)",
        marginBottom: 24,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ marginBottom: 10 }}>
            <SectionPill
              label="Action Needed Today"
              color="#b4541a"
              bgColor="#fff4ed"
              icon={<IconTriangleWarningFillDuo18 />}
            />
          </div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#222222",
              letterSpacing: "-0.02em",
              margin: 0,
              marginBottom: 3,
            }}
          >
            {actionable.length} bus{actionable.length === 1 ? "" : "es"} overdue
            for service
          </h2>
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "#929292",
              margin: 0,
            }}
          >
            Schedule these before they break down on route. Top{" "}
            {Math.min(MAX_ROWS, actionable.length)} shown, ranked by urgency.
          </p>
        </div>
      </div>

      {/* Action rows */}
      <div
        style={{
          border: "1px solid #f0f0f0",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {topRows.map(({ bus, overdueMiles }, idx) => {
          const isHovered = hoveredId === bus.id;
          const isLast = idx === topRows.length - 1;
          const garageColor =
            bus.garage === "north" ? "#3b82f6" : "#7c3aed";
          const garageBg = bus.garage === "north" ? "#eff6ff" : "#f5f3ff";

          return (
            <button
              key={bus.id}
              type="button"
              onMouseEnter={() => setHoveredId(bus.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onBusClick(bus)}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "auto auto 1fr auto auto 16px",
                alignItems: "center",
                gap: 16,
                width: "100%",
                padding: "14px 18px",
                border: "none",
                borderBottom: isLast ? "none" : "1px solid #f0f0f0",
                background: isHovered ? "#fafaf9" : "#ffffff",
                cursor: "pointer",
                transition: "background 0.12s ease-out",
                fontFamily: "inherit",
                textAlign: "left",
              }}
            >
              {/* Rank indicator */}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#a3a3a3",
                  width: 14,
                  textAlign: "right",
                  letterSpacing: "0.02em",
                }}
              >
                {idx + 1}
              </span>

              {/* Bus number */}
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#222222",
                  letterSpacing: "-0.01em",
                  minWidth: 72,
                }}
              >
                Bus #{bus.busNumber}
              </span>

              {/* Garage badge */}
              <span
                style={{
                  display: "inline-flex",
                  alignSelf: "center",
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: garageBg,
                  color: garageColor,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.03em",
                  textTransform: "uppercase",
                  justifySelf: "start",
                }}
              >
                {bus.garage}
              </span>

              {/* Overdue miles (the urgency signal) */}
              <span
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 5,
                  justifySelf: "end",
                }}
              >
                <span
                  style={{
                    fontSize: 17,
                    fontWeight: 800,
                    color: "#b4541a",
                    letterSpacing: "-0.01em",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatNumber(overdueMiles)}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#b4541a",
                    letterSpacing: "0.03em",
                    textTransform: "uppercase",
                  }}
                >
                  mi overdue
                </span>
              </span>

              {/* Total mileage (context) */}
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#929292",
                  fontVariantNumeric: "tabular-nums",
                  minWidth: 88,
                  textAlign: "right",
                }}
              >
                {formatNumber(bus.mileage)} mi total
              </span>

              {/* Arrow affordance */}
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 16,
                  height: 16,
                  color: isHovered ? "#b4541a" : "#cccccc",
                  fontSize: 16,
                  fontWeight: 500,
                  transition: "color 0.12s, transform 0.12s",
                  transform: isHovered ? "translateX(2px)" : "translateX(0)",
                }}
              >
                →
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      {remainingCount > 0 && (
        <div
          style={{
            marginTop: 12,
            paddingLeft: 18,
            fontSize: 12,
            fontWeight: 500,
            color: "#929292",
          }}
        >
          + {remainingCount} more overdue bus
          {remainingCount === 1 ? "" : "es"} further down the queue
        </div>
      )}
    </div>
  );
}
