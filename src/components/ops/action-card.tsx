"use client";

import { useMemo, useState } from "react";
import { buses } from "@/data/buses";
import { useWorkOrders } from "@/contexts/work-orders-context";
import type { Bus } from "@/data/types";
import { milesUntilPm, formatNumber } from "@/lib/utils";
import { useDepot, filterByDepot } from "@/hooks/use-depot";
import { SectionPill } from "@/components/section-pill";
import { Card } from "@/components/ui/card";

interface ActionCardProps {
  onBusClick: (bus: Bus) => void;
  // Opens the slide-in panel listing every overdue bus. Called from the
  // header count and the "+ N more" footer — any row in the short list
  // still drills into a single bus via onBusClick.
  onViewAll: () => void;
}

const MAX_ROWS = 5;

interface OverdueEntry {
  bus: Bus;
  overdueMiles: number;
}

export function ActionCard({ onBusClick, onViewAll }: ActionCardProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [headerHovered, setHeaderHovered] = useState(false);
  const [footerHovered, setFooterHovered] = useState(false);
  const { scope } = useDepot();
  const { workOrders } = useWorkOrders();

  const actionable = useMemo<OverdueEntry[]>(() => {
    // Exclude buses already in an active work order — those are already scheduled.
    const busesWithActiveWO = new Set(workOrders.map((wo) => wo.busId));
    return filterByDepot(buses, scope)
      .map((bus) => ({ bus, overdueMiles: -milesUntilPm(bus) }))
      .filter(
        ({ bus, overdueMiles }) =>
          overdueMiles > 0 && !busesWithActiveWO.has(bus.id)
      )
      .sort((a, b) => b.overdueMiles - a.overdueMiles);
  }, [scope, workOrders]);

  const topRows = actionable.slice(0, MAX_ROWS);
  const remainingCount = actionable.length - topRows.length;

  // Positive empty state — still worth rendering the card so the layout stays stable.
  if (actionable.length === 0) {
    return (
      <Card className="flex flex-col items-start gap-3 rounded-lg p-5 shadow-card sm:flex-row sm:items-center sm:gap-4 sm:p-6">
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
          Nothing overdue right now. Every bus has runway before its next preventive maintenance service.
        </p>
      </Card>
    );
  }

  return (
    <Card className="rounded-lg p-5 shadow-card sm:p-6">
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
        <button
          type="button"
          onClick={onViewAll}
          onMouseEnter={() => setHeaderHovered(true)}
          onMouseLeave={() => setHeaderHovered(false)}
          style={{
            all: "unset",
            display: "block",
            cursor: "pointer",
            maxWidth: "100%",
          }}
          aria-label={`View all ${actionable.length} overdue buses`}
        >
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: headerHovered ? "#b4541a" : "#222222",
              letterSpacing: "-0.02em",
              margin: 0,
              marginBottom: 3,
              transition: "color 0.12s ease-out",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>
              {actionable.length} bus{actionable.length === 1 ? "" : "es"} overdue
              for service
            </span>
            <span
              aria-hidden
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: headerHovered ? "#b4541a" : "#cccccc",
                transform: headerHovered ? "translateX(2px)" : "translateX(0)",
                transition: "color 0.12s, transform 0.12s",
              }}
            >
              →
            </span>
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
        </button>
      </div>

      {/* Action rows */}
      <div>
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
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "capitalize",
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
                  className="text-[12px] sm:text-[13px]"
                  style={{
                    fontWeight: 500,
                    color: "#b4541a",
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

      {/* Footer — clickable link into the full overdue list. Always rendered
          when there are any overdue buses so the affordance is discoverable
          even before the list exceeds the top-5 cutoff. */}
      {actionable.length > 0 && (
        <button
          type="button"
          onClick={onViewAll}
          onMouseEnter={() => setFooterHovered(true)}
          onMouseLeave={() => setFooterHovered(false)}
          style={{
            all: "unset",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            marginTop: 12,
            marginLeft: 18,
            fontSize: 12,
            fontWeight: 600,
            color: footerHovered ? "#b4541a" : "#929292",
            cursor: "pointer",
            transition: "color 0.12s ease-out",
          }}
        >
          <span>
            {remainingCount > 0
              ? `+ ${remainingCount} more overdue bus${remainingCount === 1 ? "" : "es"} — view all ${actionable.length}`
              : `View all ${actionable.length} overdue bus${actionable.length === 1 ? "" : "es"}`}
          </span>
          <span
            aria-hidden
            style={{
              transform: footerHovered ? "translateX(2px)" : "translateX(0)",
              transition: "transform 0.12s",
            }}
          >
            →
          </span>
        </button>
      )}
    </Card>
  );
}
