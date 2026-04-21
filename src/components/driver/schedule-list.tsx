"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import type { Mobility, Trip, TripStatus } from "@/data/trips";
import { deriveTripStatus } from "@/data/trips";

const MOBILITY_LABEL: Record<Mobility, string> = {
  ambulatory: "Ambulatory",
  wheelchair: "Wheelchair",
  walker: "Walker",
  scooter: "Scooter",
};

export function ScheduleList({ trips }: { trips: Trip[] }) {
  // Re-derive statuses on mount so the client matches the real clock. Server
  // render uses "now" at render time which will differ on the client — we
  // reset after mount to avoid a stale snapshot.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const completedCount = trips.filter(
    (t) => deriveTripStatus(t, now ?? new Date()) === "completed"
  ).length;

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[18px] font-semibold tracking-tight text-[#222222]">
          Today&rsquo;s runs
        </h2>
        <span className="text-[12px] font-medium text-[#929292] tabular-nums">
          {completedCount}/{trips.length} done
        </span>
      </div>

      <ul className="space-y-3">
        {trips.map((trip) => (
          <li key={trip.id}>
            <TripCard trip={trip} now={now} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function TripCard({ trip, now }: { trip: Trip; now: Date | null }) {
  const status = deriveTripStatus(trip, now ?? new Date());
  const pickup = formatTime(trip.scheduledPickupAt);

  // Status-aware framing. In-progress gets a coral accent ring so it pops
  // at a glance on mobile. Completed gets dimmed. Upcoming is default.
  const isCompleted = status === "completed";
  const isInProgress = status === "in-progress";

  return (
    <div
      className={[
        "rounded-2xl border bg-white p-4 transition-all",
        isInProgress
          ? "border-[#d4654a] shadow-[0_0_0_1px_rgba(212,101,74,0.25),0px_2px_6px_rgba(212,101,74,0.12)]"
          : "border-black/5 shadow-card",
        isCompleted ? "opacity-60" : "",
      ].join(" ")}
    >
      {/* Top row: time + duration + status chip */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span
            className={[
              "text-[16px] font-semibold tracking-tight tabular-nums",
              isCompleted ? "text-[#6a6a6a] line-through" : "text-[#222222]",
            ].join(" ")}
          >
            {pickup}
          </span>
          <span className="text-[12px] text-[#929292]">
            · {trip.durationMinutes} min
          </span>
        </div>
        <StatusChip status={status} />
      </div>

      {/* Pickup → dropoff */}
      <div className="space-y-1.5">
        <div className="flex items-start gap-2">
          <span
            className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: "#d4654a" }}
            aria-hidden
          />
          <span className="text-[14px] font-medium leading-snug text-[#222222]">
            {trip.pickupAddress}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <ArrowRight
            weight="bold"
            className="mt-[3px] size-3.5 shrink-0 text-[#929292]"
            aria-hidden
          />
          <span className="text-[14px] leading-snug text-[#6a6a6a]">
            {trip.dropoffLabel}
          </span>
        </div>
      </div>

      {/* Passenger + mobility */}
      <div className="mt-3 flex items-center gap-2 border-t border-black/5 pt-3">
        <span className="text-[13px] font-semibold text-[#222222]">
          {trip.passengerName}
        </span>
        <span className="text-[11px] text-[#929292]">·</span>
        <span
          className="rounded-full bg-[#f5f5f5] px-2 py-0.5 text-[11px] font-semibold text-[#6a6a6a]"
        >
          {MOBILITY_LABEL[trip.mobility]}
        </span>
      </div>

      {/* Optional dispatcher note — drawn muted but not hidden */}
      {trip.note && (
        <p className="mt-2 text-[12px] leading-snug text-[#6a6a6a]">
          {trip.note}
        </p>
      )}
    </div>
  );
}

function StatusChip({ status }: { status: TripStatus }) {
  if (status === "in-progress") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fdf0ed] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#b4541a]">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#d4654a]" />
        Now
      </span>
    );
  }
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#22c55e]">
        <CheckCircle weight="fill" className="size-3.5" />
        Done
      </span>
    );
  }
  return (
    <span className="text-[11px] font-medium uppercase tracking-wider text-[#929292]">
      Upcoming
    </span>
  );
}

/** "10:30 AM" style. Hour without leading zero, minutes zero-padded. */
function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
