"use client";

import { useMemo, useState } from "react";
import { buses } from "@/data/buses";
import { workOrders } from "@/data/work-orders";
import type { Bus } from "@/data/types";
import { milesUntilPm, formatNumber } from "@/lib/utils";
import { useDepot, filterByDepot } from "@/hooks/use-depot";
import { SectionPill } from "@/components/section-pill";
import { Card } from "@/components/ui/card";
import { IconWrenchFillDuo18 } from "nucleo-ui-fill-duo-18";

interface PullInNextCardProps {
  onBusClick: (bus: Bus) => void;
}

const MAX_ROWS = 5;

interface Candidate {
  bus: Bus;
  overdueMiles: number;
}

/**
 * Mechanic-side answer to "Which buses should I pull in next?" (JTBD M-3).
 *
 * Mirrors the pattern of ActionCard on the ops side — ranks buses by how far
 * past PM they are, scoped to the current depot, excluding anything already
 * in the kanban (those are already being worked on).
 *
 * Click opens the bus detail panel so the mechanic gets service-history
 * context before they commit to pulling the bus in.
 */
export function PullInNextCard({ onBusClick }: PullInNextCardProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const { scope } = useDepot();

  const candidates = useMemo<Candidate[]>(() => {
    const busesWithActiveWO = new Set(workOrders.map((wo) => wo.busId));
    return filterByDepot(buses, scope)
      .map((bus) => ({ bus, overdueMiles: -milesUntilPm(bus) }))
      .filter(
        ({ bus, overdueMiles }) =>
          overdueMiles > 0 && !busesWithActiveWO.has(bus.id)
      )
      .sort((a, b) => b.overdueMiles - a.overdueMiles);
  }, [scope]);

  const topRows = candidates.slice(0, MAX_ROWS);
  const remainingCount = candidates.length - topRows.length;

  if (candidates.length === 0) {
    return (
      <Card className="mb-[18px] flex flex-col items-start gap-3 rounded-[20px] p-5 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.02),0px_2px_6px_rgba(0,0,0,0.03),0px_4px_8px_rgba(0,0,0,0.04)] sm:flex-row sm:items-center sm:gap-4">
        <SectionPill
          label="Queue Clear"
          color="#22c55e"
          bgColor="#f0fdf4"
          icon={<IconWrenchFillDuo18 />}
        />
        <p
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "#6a6a6a",
            margin: 0,
          }}
        >
          Nothing overdue for PM in this garage. Keep working your active
          queue.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mb-[18px] rounded-[20px] p-5 shadow-[0px_0px_0px_1px_rgba(0,0,0,0.02),0px_2px_6px_rgba(0,0,0,0.03),0px_4px_8px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ marginBottom: 10 }}>
          <SectionPill
            label="Pull In Next"
            color="#b4541a"
            bgColor="#fff4ed"
            icon={<IconWrenchFillDuo18 />}
          />
        </div>
        <h2
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "#222222",
            letterSpacing: "-0.02em",
            margin: 0,
            marginBottom: 2,
          }}
        >
          {candidates.length} bus{candidates.length === 1 ? "" : "es"} overdue
          for PM
        </h2>
        <p
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#929292",
            margin: 0,
          }}
        >
          Not yet in the queue. Grab these before they break down on route.
        </p>
      </div>

      {/* Rows */}
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
              className="grid w-full items-center gap-3 p-[10px_14px] grid-cols-[auto_auto_1fr_16px] sm:gap-4 sm:p-[12px_16px] sm:grid-cols-[auto_auto_1fr_auto_auto_16px]"
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
              {/* Rank indicator — desktop only */}
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

              {/* Overdue miles — the urgency signal */}
              <span
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 5,
                  justifySelf: "end",
                }}
              >
                <span
                  className="text-[15px] sm:text-[16px]"
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

              {/* Total mileage — desktop only */}
              <span
                className="hidden sm:inline-block"
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#929292",
                  fontVariantNumeric: "tabular-nums",
                  minWidth: 84,
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

      {remainingCount > 0 && (
        <div
          style={{
            marginTop: 10,
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
    </Card>
  );
}
