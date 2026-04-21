"use client";

import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { useFleet } from "@/contexts/fleet-context";
import { getAvailabilityRate, getStatusCounts } from "@/lib/utils";
import { getAvailabilityTierColor, STATUS_COLORS } from "@/lib/constants";
import type { Garage } from "@/data/types";

/**
 * Compact fleet-status card for the driver view. Always scoped to the
 * driver's own garage — drivers don't need a cross-garage comparison,
 * they need "how's *my* yard doing?". Tapping opens the full Fleet
 * Overview for anyone who wants more.
 */
export function FleetSnapshot({ garage }: { garage: Garage }) {
  const { buses } = useFleet();
  const garageBuses = buses.filter((b) => b.garage === garage);
  const counts = getStatusCounts(garageBuses);
  const rate = getAvailabilityRate(garageBuses);
  const available = counts.running + counts["pm-due"];
  const barColor = getAvailabilityTierColor(rate);
  const garageLabel = garage === "north" ? "North Garage" : "South Garage";

  return (
    <Link
      href="/fleet-overview"
      className="block rounded-2xl bg-white p-6 shadow-card transition-shadow hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#929292]">
            Fleet status
          </p>
          <h2 className="mt-1 text-[16px] font-semibold tracking-tight text-[#222222]">
            {garageLabel}
          </h2>
        </div>
        <div className="flex items-center gap-1 text-[#929292]">
          <span className="text-[11px] font-medium">View all</span>
          <CaretRight weight="bold" className="size-3" aria-hidden />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <p className="text-[32px] font-bold leading-none tracking-[-0.03em] text-[#222222] tabular-nums">
          {rate.toFixed(1)}%
        </p>
        <p className="text-[12px] text-[#6a6a6a] tabular-nums">
          {available} of {counts.total} available
        </p>
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#f5f5f5]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${rate}%`, backgroundColor: barColor }}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <StatusChip
          color={STATUS_COLORS.running}
          count={counts.running}
          label="Running"
        />
        <StatusChip
          color={STATUS_COLORS["pm-due"]}
          count={counts["pm-due"]}
          label="PM due"
        />
        <StatusChip
          color={STATUS_COLORS["in-maintenance"]}
          count={counts["in-maintenance"]}
          label="In shop"
        />
        <StatusChip
          color={STATUS_COLORS["road-call"]}
          count={counts["road-call"]}
          label="Road calls"
        />
      </div>
    </Link>
  );
}

function StatusChip({
  color,
  count,
  label,
}: {
  color: string;
  count: number;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-[#fafafa] px-3 py-2">
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <span className="text-[13px] text-[#6a6a6a]">{label}</span>
      </div>
      <span className="text-[14px] font-semibold text-[#222222] tabular-nums">
        {count}
      </span>
    </div>
  );
}
