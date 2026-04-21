"use client";

import type { Bus, BusStatus } from "@/data/types";
import { formatNumber, milesUntilPm } from "@/lib/utils";

/**
 * Driver-facing labels and palette for the assigned bus's status. We don't
 * reuse STATUS_LABELS from constants.ts because those are written for ops
 * managers (e.g. "Preventive Maintenance Due") — drivers want terser,
 * plainer language framed around their own workday.
 */
const DRIVER_STATUS: Record<
  BusStatus,
  { label: string; bg: string; dot: string; text: string }
> = {
  running: {
    label: "Ready to roll",
    bg: "#f0fdf4",
    dot: "#22c55e",
    text: "#166534",
  },
  "pm-due": {
    label: "Service due soon",
    bg: "#fffbeb",
    dot: "#f59e0b",
    text: "#92400e",
  },
  "in-maintenance": {
    label: "In the shop",
    bg: "#fef2f2",
    dot: "#ef4444",
    text: "#991b1b",
  },
  "road-call": {
    label: "Road call",
    bg: "#f5f5f5",
    dot: "#222222",
    text: "#222222",
  },
};

export function VehicleCard({ bus }: { bus: Bus }) {
  const status = DRIVER_STATUS[bus.status];
  const pmRemaining = milesUntilPm(bus);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-card">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#929292]">
        Your vehicle today
      </p>
      <h2 className="mt-1 text-[44px] font-bold leading-none tracking-[-0.03em] text-[#222222]">
        Bus #{bus.busNumber}
      </h2>

      <div
        className="mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
        style={{ backgroundColor: status.bg }}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: status.dot }}
          aria-hidden
        />
        <span
          className="text-[12px] font-semibold"
          style={{ color: status.text }}
        >
          {status.label}
        </span>
      </div>

      {/* Attention banner for non-running statuses — tells the driver what
          to do instead of just flagging the state. */}
      {bus.status === "in-maintenance" && (
        <div className="mt-4 rounded-lg bg-[#fef2f2] px-3 py-2 text-[13px] text-[#991b1b]">
          Your bus is in maintenance. Check with dispatch for a spare
          assignment before pre-trip.
        </div>
      )}
      {bus.status === "pm-due" && (
        <div className="mt-4 rounded-lg bg-[#fffbeb] px-3 py-2 text-[13px] text-[#92400e]">
          Preventive maintenance is overdue. Drive is okay today; flag with
          your garage supervisor at end of shift.
        </div>
      )}
      {bus.status === "road-call" && (
        <div className="mt-4 rounded-lg bg-[#f5f5f5] px-3 py-2 text-[13px] text-[#222222]">
          This bus is awaiting road-call pickup. Coordinate with dispatch
          before continuing your manifest.
        </div>
      )}

      <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-[13px]">
        <Row term="Model" value={bus.model} />
        <Row term="Year" value={String(bus.year)} />
        <Row term="Mileage" value={`${formatNumber(bus.mileage)} mi`} />
        <Row
          term="Next PM"
          value={
            pmRemaining >= 0
              ? `in ${formatNumber(pmRemaining)} mi`
              : `${formatNumber(Math.abs(pmRemaining))} mi overdue`
          }
          emphasisColor={pmRemaining < 0 ? "#92400e" : undefined}
        />
        <Row term="Garage" value={bus.garage === "north" ? "North" : "South"} />
      </dl>
    </div>
  );
}

function Row({
  term,
  value,
  emphasisColor,
}: {
  term: string;
  value: string;
  emphasisColor?: string;
}) {
  return (
    <>
      <dt className="font-medium text-[#929292]">{term}</dt>
      <dd
        className="text-right font-semibold"
        style={{ color: emphasisColor ?? "#222222" }}
      >
        {value}
      </dd>
    </>
  );
}
