"use client";

import { useMemo } from "react";
import { KpiCard } from "./kpi-card";
import { buses } from "@/data/buses";
import { workOrders } from "@/data/work-orders";
import { availabilityHistory } from "@/data/availability-history";
import { getYesterdayCount } from "@/data/status-history";
import type { BusStatus } from "@/data/types";
import {
  getAvailabilityRate,
  getForecastAvailability,
  getForecastAvailableCount,
  getForecastCounts,
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
  onOpenStatusList: (status: BusStatus) => void;
}

export function KpiStrip({ onOpenStatusList }: KpiStripProps) {
  const { scope } = useDepot();
  const scopedBuses = useMemo(() => filterByDepot(buses, scope), [scope]);
  const scopedWorkOrders = useMemo(
    () => filterByDepot(workOrders, scope),
    [scope]
  );

  const counts = getStatusCounts(scopedBuses);
  const availRate = getAvailabilityRate(scopedBuses);
  const forecastRate = getForecastAvailability(scopedBuses, scopedWorkOrders);
  // Forecast bus count comes from the same helper the four count cards
  // use, so the "X buses" sub-label can never drift from running+pm-due
  // on the cards below.
  const forecastCount = getForecastAvailableCount(
    scopedBuses,
    scopedWorkOrders
  );

  // Per-status forecasts for the 4 small cards. Computed on the scoped slice
  // so the depot toggle flows through to the "tomorrow (est.)" row too.
  const forecastCounts = useMemo(
    () => getForecastCounts(scopedBuses, scopedWorkOrders),
    [scopedBuses, scopedWorkOrders]
  );

  // Yesterday values come from the 30-day status history which is pinned to
  // the unfiltered fleet. When scoped to a single depot we skip the delta/
  // forecast footer rather than fabricate a per-depot history.
  const showCountFooter = scope === "all";

  const p = KPI_PILLS;

  // Breakpoint rationale: the count column (1fr of [1.2fr_1fr]) must be
  // wide enough for a 2x2 grid whose cards each fit the "In Maintenance"
  // pill (~180px min). That requires ~400px of count-column width, which
  // only materializes around xl (1280px). Below xl we stack primary above
  // counts so the count grid gets the full content width. And the count
  // grid itself stays 1-col until sm (640px) so narrow phones don't crush
  // the pills into two skinny 160px columns.
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr] xl:gap-5">
      <KpiCard
        label={SCOPE_LABEL[scope]}
        value={availRate}
        suffix="%"
        color={availRate > 85 ? "var(--color-status-running)" : "var(--color-brand)"}
        isPrimary
        pillColor={p["Fleet Availability"].color}
        pillBg={p["Fleet Availability"].bg}
        pillIcon={<IconGaugeFillDuo18 />}
        forecast={forecastRate}
        forecastCount={forecastCount}
        // Sparkline reflects fleet-wide history; hide it when scoped to one
        // depot so the trendline isn't misread as that depot's history.
        sparklineData={scope === "all" ? availabilityHistory : undefined}
      />
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <KpiCard
          label="Running"
          value={counts.running}
          color="var(--color-status-running)"
          pillColor={p.Running.color}
          pillBg={p.Running.bg}
          pillIcon={<IconBoltSpeedFillDuo18 />}
          yesterdayValue={
            showCountFooter ? getYesterdayCount("running") : undefined
          }
          forecastValue={showCountFooter ? forecastCounts.running : undefined}
          deltaDirection="up-is-good"
          onClick={() => onOpenStatusList("running")}
          ariaLabel={`Show ${counts.running} running buses`}
        />
        <KpiCard
          label="PM Due"
          value={counts["pm-due"]}
          color="var(--color-status-pm-due)"
          pillColor={p["PM Due"].color}
          pillBg={p["PM Due"].bg}
          pillIcon={<IconWrenchFillDuo18 />}
          yesterdayValue={
            showCountFooter ? getYesterdayCount("pm-due") : undefined
          }
          forecastValue={
            showCountFooter ? forecastCounts["pm-due"] : undefined
          }
          deltaDirection="down-is-good"
          onClick={() => onOpenStatusList("pm-due")}
          ariaLabel={`Show ${counts["pm-due"]} buses due for preventive maintenance`}
        />
        <KpiCard
          label="In Maintenance"
          value={counts["in-maintenance"]}
          color="var(--color-status-maintenance)"
          pillColor={p["In Maintenance"].color}
          pillBg={p["In Maintenance"].bg}
          pillIcon={<IconGearsFillDuo18 />}
          yesterdayValue={
            showCountFooter ? getYesterdayCount("in-maintenance") : undefined
          }
          forecastValue={
            showCountFooter ? forecastCounts["in-maintenance"] : undefined
          }
          deltaDirection="down-is-good"
          onClick={() => onOpenStatusList("in-maintenance")}
          ariaLabel={`Show ${counts["in-maintenance"]} buses in maintenance`}
        />
        <KpiCard
          label="Road Calls"
          value={counts["road-call"]}
          color="var(--color-kpi-roadcall)"
          pillColor={p["Road Calls"].color}
          pillBg={p["Road Calls"].bg}
          pillIcon={<IconSirenFillDuo18 />}
          yesterdayValue={
            showCountFooter ? getYesterdayCount("road-call") : undefined
          }
          forecastValue={
            showCountFooter ? forecastCounts["road-call"] : undefined
          }
          deltaDirection="down-is-good"
          onClick={() => onOpenStatusList("road-call")}
          ariaLabel={`Show ${counts["road-call"]} buses on road call`}
        />
      </div>
    </div>
  );
}
