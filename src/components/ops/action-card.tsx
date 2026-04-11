"use client";

import { useMemo, useState } from "react";
import { buses } from "@/data/buses";
import { workOrders } from "@/data/work-orders";
import type { Bus } from "@/data/types";
import { milesUntilPm, formatNumber } from "@/lib/utils";
import { useDepot, filterByDepot } from "@/hooks/use-depot";
import { SectionPill } from "@/components/section-pill";
import { Card } from "@/components/ui/card";
import { IconTriangleWarningFillDuo18 } from "nucleo-ui-fill-duo-18";

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
  }, [scope]);

  const topRows = actionable.slice(0, MAX_ROWS);
  const remainingCount = actionable.length - topRows.length;

  // Positive empty state — still worth rendering the card so the layout stays stable.
  if (actionable.length === 0) {
    return (
      <Card className="mb-6 flex flex-col items-start gap-3 rounded-lg p-5 shadow-card sm:flex-row sm:items-center sm:gap-4 sm:p-6">
        <SectionPill
          label="Fleet On Schedule"
          color="var(--color-status-running)"
          bgColor="var(--color-status-running-bg)"
        />
        <p
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--color-text-secondary)",
            margin: 0,
          }}
        >
          Nothing overdue right now. Every bus has runway before its next PM service.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mb-6 rounded-lg p-5 shadow-card sm:p-6">
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
          <div style={{ marginBottom: 10 }}>
            <SectionPill
              label="Action Needed Today"
              color="var(--color-brand)"
              bgColor="var(--color-brand-light)"
              icon={<IconTriangleWarningFillDuo18 />}
            />
          </div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: headerHovered ? "var(--color-brand)" : "var(--color-text-primary)",
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
                color: headerHovered ? "var(--color-brand)" : "var(--color-text-faint)",
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
              color: "var(--color-text-muted)",
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
            bus.garage === "north" ? "var(--color-stage-diagnosing)" : "var(--color-kpi-availability)";
          const garageBg = bus.garage === "north" ? "var(--color-stage-diagnosing-bg)" : "var(--color-kpi-availability-bg)";

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
                borderBottom: isLast ? "none" : "1px solid var(--color-border)",
                background: isHovered ? "var(--color-card-hover)" : "var(--color-surface)",
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
                  color: "var(--color-text-muted)",
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
                  color: "var(--color-text-primary)",
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
                    color: "var(--color-brand)",
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
                    color: "var(--color-brand)",
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
                  color: "var(--color-text-muted)",
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
                  color: isHovered ? "var(--color-brand)" : "var(--color-text-faint)",
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
            color: footerHovered ? "var(--color-brand)" : "var(--color-text-muted)",
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
