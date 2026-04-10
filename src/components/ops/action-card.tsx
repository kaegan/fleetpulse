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
        className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:gap-4 sm:p-6"
        style={{
          background: "#ffffff",
          borderRadius: 24,
          boxShadow:
            "0px 0px 0px 1px rgba(0,0,0,0.02), 0px 2px 6px rgba(0,0,0,0.03), 0px 4px 8px rgba(0,0,0,0.04)",
          marginBottom: 24,
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
      className="p-5 sm:p-6"
      style={{
        background: "#ffffff",
        borderRadius: 24,
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
              className="grid w-full items-center gap-3 p-[12px_14px] grid-cols-[auto_auto_1fr_16px] sm:gap-4 sm:p-[14px_18px] sm:grid-cols-[auto_auto_1fr_auto_auto_16px]"
              style={{
                border: "none",
                borderBottom: isLast ? "none" : "1px solid #f0f0f0",
                background: isHovered ? "#fafaf9" : "#ffffff",
                cursor: "pointer",
                transition: "background 0.12s ease-out",
                fontFamily: "inherit",
                textAlign: "left",
              }}
            >
              {/* Rank indicator — hidden on mobile to save space */}
              <span
                className="hidden sm:inline-block"
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
                className="text-[14px] sm:text-[15px]"
                style={{
                  fontWeight: 700,
                  color: "#222222",
                  letterSpacing: "-0.01em",
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
                  className="text-[15px] sm:text-[17px]"
                  style={{
                    fontWeight: 800,
                    color: "#b4541a",
                    letterSpacing: "-0.01em",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatNumber(overdueMiles)}
                </span>
                <span
                  className="text-[10px] sm:text-[11px]"
                  style={{
                    fontWeight: 600,
                    color: "#b4541a",
                    letterSpacing: "0.03em",
                    textTransform: "uppercase",
                  }}
                >
                  mi overdue
                </span>
              </span>

              {/* Total mileage (context) — hidden on mobile */}
              <span
                className="hidden sm:inline-block"
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
