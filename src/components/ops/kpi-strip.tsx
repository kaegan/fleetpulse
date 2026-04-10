"use client";

import { useMemo } from "react";
import { KpiCard } from "./kpi-card";
import type { DrillDownCategory } from "./bus-list-sheet";
import { buses } from "@/data/buses";
import { workOrders } from "@/data/work-orders";
import { availabilityHistory } from "@/data/availability-history";
import {
  getAvailabilityRate,
  getForecastAvailability,
  getStatusCounts,
} from "@/lib/utils";
import { useDepot, filterByDepot } from "@/hooks/use-depot";
import { KPI_PILLS } from "@/lib/constants";
import {
  IconGaugeFillDuo18,
  IconBoltSpeedFillDuo18,
  IconWrenchFillDuo18,
  IconGearsFillDuo18,
  IconSirenFillDuo18,
} from "nucleo-ui-fill-duo-18";

const SCOPE_LABEL: Record<"all" | "north" | "south", string> = {
  all: "Fleet Availability",
  north: "North Availability",
  south: "South Availability",
};

interface KpiStripProps {
  /**
   * When provided, the PM Due, In Maintenance, and Road Calls cards become
   * clickable drill-down triggers. Running and Fleet Availability stay
   * non-interactive — no actionable ops verbs at those states.
   */
  onCategoryClick?: (category: DrillDownCategory) => void;
}

export function KpiStrip({ onCategoryClick }: KpiStripProps) {
  const { scope } = useDepot();
  const scopedBuses = useMemo(() => filterByDepot(buses, scope), [scope]);
  const scopedWorkOrders = useMemo(
    () => filterByDepot(workOrders, scope),
    [scope]
  );

  const counts = getStatusCounts(scopedBuses);
  const availRate = getAvailabilityRate(scopedBuses);
  const forecastRate = getForecastAvailability(scopedBuses, scopedWorkOrders);
  const p = KPI_PILLS;

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_1fr] md:gap-5">
      <KpiCard
        label={SCOPE_LABEL[scope]}
        value={availRate}
        suffix="%"
        color={availRate > 85 ? "#22c55e" : "#d4654a"}
        isPrimary
        pillColor={p["Fleet Availability"].color}
        pillBg={p["Fleet Availability"].bg}
        pillIcon={<IconGaugeFillDuo18 />}
        forecast={forecastRate}
        // Sparkline reflects fleet-wide history; hide it when scoped to one
        // depot so the trendline isn't misread as that depot's history.
        sparklineData={scope === "all" ? availabilityHistory : undefined}
      />
      <div className="grid grid-cols-2 gap-3.5 sm:gap-3.5">
        <KpiCard
          label="Running"
          value={counts.running}
          color="#22c55e"
          pillColor={p.Running.color}
          pillBg={p.Running.bg}
          pillIcon={<IconBoltSpeedFillDuo18 />}
        />
        <KpiCard
          label="PM Due"
          value={counts["pm-due"]}
          color="#f59e0b"
          pillColor={p["PM Due"].color}
          pillBg={p["PM Due"].bg}
          pillIcon={<IconWrenchFillDuo18 />}
          onClick={
            onCategoryClick ? () => onCategoryClick("pm-due") : undefined
          }
        />
        <KpiCard
          label="In Maintenance"
          value={counts["in-maintenance"]}
          color="#ef4444"
          pillColor={p["In Maintenance"].color}
          pillBg={p["In Maintenance"].bg}
          pillIcon={<IconGearsFillDuo18 />}
          onClick={
            onCategoryClick
              ? () => onCategoryClick("in-maintenance")
              : undefined
          }
        />
        <KpiCard
          label="Road Calls"
          value={counts["road-call"]}
          color="#64748b"
          pillColor={p["Road Calls"].color}
          pillBg={p["Road Calls"].bg}
          pillIcon={<IconSirenFillDuo18 />}
          onClick={
            onCategoryClick ? () => onCategoryClick("road-call") : undefined
          }
        />
      </div>
    </div>
  );
}
