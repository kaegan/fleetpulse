"use client";

import { KpiCard } from "./kpi-card";
import { buses } from "@/data/buses";
import { getAvailabilityRate, getStatusCounts } from "@/lib/utils";

export function KpiStrip() {
  const counts = getStatusCounts(buses);
  const availRate = getAvailabilityRate(buses);

  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        marginBottom: 24,
      }}
    >
      <KpiCard
        label="Fleet Availability"
        value={availRate}
        suffix="%"
        color={availRate > 85 ? "#22c55e" : "#c2703e"}
        isPrimary
      />
      <KpiCard
        label="Running"
        value={counts.running}
        color="#22c55e"
      />
      <KpiCard
        label="PM Due"
        value={counts["pm-due"]}
        color="#f59e0b"
      />
      <KpiCard
        label="In Maintenance"
        value={counts["in-maintenance"]}
        color="#ef4444"
      />
      <KpiCard
        label="Road Calls"
        value={counts["road-call"]}
        color="#222222"
      />
    </div>
  );
}
