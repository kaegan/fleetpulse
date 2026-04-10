"use client";

import { KpiCard } from "./kpi-card";
import { buses } from "@/data/buses";
import { workOrders } from "@/data/work-orders";
import { getAvailabilityRate, getForecastAvailability, getStatusCounts } from "@/lib/utils";
import { KPI_PILLS } from "@/lib/constants";
import {
  IconGaugeFillDuo18,
  IconBoltSpeedFillDuo18,
  IconWrenchFillDuo18,
  IconGearsFillDuo18,
  IconSirenFillDuo18,
} from "nucleo-ui-fill-duo-18";

export function KpiStrip() {
  const counts = getStatusCounts(buses);
  const availRate = getAvailabilityRate(buses);
  const forecastRate = getForecastAvailability(buses, workOrders);
  const p = KPI_PILLS;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1.2fr 1fr",
        gap: 20,
        marginBottom: 32,
      }}
    >
      <KpiCard
        label="Fleet Availability"
        value={availRate}
        suffix="%"
        color={availRate > 85 ? "#22c55e" : "#d4654a"}
        isPrimary
        pillColor={p["Fleet Availability"].color}
        pillBg={p["Fleet Availability"].bg}
        pillIcon={<IconGaugeFillDuo18 />}
        forecast={forecastRate}
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}
      >
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
        />
        <KpiCard
          label="In Maintenance"
          value={counts["in-maintenance"]}
          color="#ef4444"
          pillColor={p["In Maintenance"].color}
          pillBg={p["In Maintenance"].bg}
          pillIcon={<IconGearsFillDuo18 />}
        />
        <KpiCard
          label="Road Calls"
          value={counts["road-call"]}
          color="#64748b"
          pillColor={p["Road Calls"].color}
          pillBg={p["Road Calls"].bg}
          pillIcon={<IconSirenFillDuo18 />}
        />
      </div>
    </div>
  );
}
