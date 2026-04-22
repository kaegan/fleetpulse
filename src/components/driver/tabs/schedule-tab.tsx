"use client";

import { useState } from "react";
import {
  CaretDown,
  CaretRight,
  CheckCircle,
  Clock,
  Coffee,
  MapPin,
} from "@phosphor-icons/react/dist/ssr";
import { UpdateBanner } from "@/components/driver/update-banner";
import type {
  DriverShift,
  ScheduleUpdate,
  Trip,
  TripStatus,
} from "@/data/driver-day";
import {
  deriveTripStatus,
  findGaps,
  formatDuration,
  formatTime,
  getProgress,
  now,
} from "@/data/driver-day";
import { cn } from "@/lib/utils";

// Palette used to vary passenger avatar colors so the list has visual
// texture without reading like a rainbow. All are muted / neutral on
// purpose — this is paratransit, not ride-share branding.
const AVATAR_COLORS = [
  "#6b7280", // slate
  "#b45309", // amber-dark
  "#0e7490", // cyan-dark
  "#166534", // green-dark
  "#991b1b", // red-dark
  "#6d28d9", // violet-dark
];

function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(name: string | undefined): string {
  if (!name) return "";
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Relative "In X min" or "Now" label used for section headers. */
function timeUntil(iso: string, at: Date = now()): string {
  const delta = Math.round((new Date(iso).getTime() - at.getTime()) / 60_000);
  if (delta <= 0 && delta > -15) return "Now";
  if (delta < 0) return "Earlier";
  if (delta < 60) return `In ${delta} min`;
  const h = Math.floor(delta / 60);
  const m = delta % 60;
  return m === 0 ? `In ${h}h` : `In ${h}h ${m}m`;
}

interface ScheduleTabProps {
  shift: DriverShift;
  latestUpdate: ScheduleUpdate | null;
  bannerDismissed: boolean;
  onDismissBanner: () => void;
  onSelectTrip: (tripId: string) => void;
}

export function ScheduleTab({
  shift,
  latestUpdate,
  bannerDismissed,
  onDismissBanner,
  onSelectTrip,
}: ScheduleTabProps) {
  const [showCompleted, setShowCompleted] = useState(false);

  const tripsWithStatus = shift.trips.map((trip) => ({
    trip,
    status: trip.isBreak
      ? ("upcoming" as TripStatus)
      : deriveTripStatus(trip),
  }));

  const completed = tripsWithStatus.filter(
    ({ trip, status }) => !trip.isBreak && status === "completed"
  );
  const activeOrUpcoming = tripsWithStatus.filter(
    ({ status }) => status !== "completed"
  );

  const gaps = findGaps(shift, 15);

  // Precompute "next non-break trip after id" so GapCallout can reference
  // the upcoming passenger's name naturally.
  const nextPassengerAfter = (afterId: string): string | undefined => {
    const idx = shift.trips.findIndex((t) => t.id === afterId);
    return shift.trips.slice(idx + 1).find((t) => !t.isBreak)?.passengerName;
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
      <ShiftProgressCard shift={shift} />

      <div className="flex items-center justify-between pt-4 pb-3">
        <h2 className="text-[17px] font-semibold text-[var(--color-text-primary)]">
          All stops
        </h2>
        <span className="text-[12px] text-[var(--color-text-secondary)]">
          {completed.length} of {shift.trips.filter((t) => !t.isBreak).length}{" "}
          complete
        </span>
      </div>

      {latestUpdate && !bannerDismissed && (
        <div className="pb-3">
          <UpdateBanner
            update={latestUpdate}
            onDismiss={onDismissBanner}
          />
        </div>
      )}

      {/* Completed summary (collapsed by default) */}
      {completed.length > 0 && (
        <button
          type="button"
          onClick={() => setShowCompleted((s) => !s)}
          className="mb-3 flex w-full items-center justify-between rounded-xl bg-[var(--color-surface-warm)] px-3.5 py-2.5 text-[13px] font-medium text-[var(--color-text-secondary)] cursor-pointer hover:bg-black/[0.04]"
          aria-expanded={showCompleted}
        >
          <span className="flex items-center gap-2">
            <CheckCircle size={16} weight="fill" className="text-[var(--color-status-running)]" aria-hidden />
            {completed.length} completed earlier
          </span>
          {showCompleted ? (
            <CaretDown size={14} weight="bold" aria-hidden />
          ) : (
            <CaretRight size={14} weight="bold" aria-hidden />
          )}
        </button>
      )}

      {showCompleted && (
        <ul className="mb-4 space-y-2">
          {completed.map(({ trip }) => (
            <li
              key={trip.id}
              className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-[12px] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]"
            >
              <span className="truncate">
                {trip.passengerName} · {trip.dropoff?.line1}
              </span>
              <span className="shrink-0 tabular-nums">
                {formatTime(trip.scheduledPickupAt)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Active + upcoming list */}
      <ul className="space-y-2.5">
        {activeOrUpcoming.map(({ trip, status }, idx) => {
          // Only show gap callouts before upcoming trips — the gap before
          // the in-progress trip already happened.
          const gapBefore =
            status === "upcoming"
              ? gaps.find((g) => g.afterTripId === trip.id)
              : undefined;
          return (
            <div key={trip.id}>
              {gapBefore && (
                <GapCallout
                  minutes={gapBefore.durationMin}
                  beforeName={nextPassengerAfter(gapBefore.beforeTripId)}
                />
              )}
              {trip.isBreak ? (
                <BreakCard trip={trip} />
              ) : (
                <StopCard
                  trip={trip}
                  status={status}
                  isFirst={idx === 0}
                  onSelect={() => onSelectTrip(trip.id)}
                />
              )}
            </div>
          );
        })}
      </ul>
    </div>
  );
}

/** Compact shift-progress strip at the top of the Schedule tab. Folded-in
 *  from the old Day/Summary tab. Shows elapsed vs remaining so the driver
 *  can answer "where am I in my shift?" at a glance. */
function ShiftProgressCard({ shift }: { shift: DriverShift }) {
  const tick = now();
  const startMs = new Date(shift.shiftStart).getTime();
  const endMs = new Date(shift.shiftEnd).getTime();
  const nowMs = tick.getTime();
  const shiftDurationMin = Math.round((endMs - startMs) / 60_000);
  const elapsedMin = Math.max(
    0,
    Math.min(shiftDurationMin, Math.round((nowMs - startMs) / 60_000))
  );
  const remainingMin = Math.max(0, shiftDurationMin - elapsedMin);
  const pctElapsed = Math.round((elapsedMin / shiftDurationMin) * 100);
  const { completed, total } = getProgress(shift, tick);

  return (
    <section className="rounded-2xl bg-card p-4 shadow-card ring-1 ring-black/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          <Clock size={13} weight="duotone" aria-hidden />
          Shift progress
        </div>
        <span className="text-[11px] font-semibold tabular-nums text-[var(--color-text-primary)]">
          {pctElapsed}%
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-[12px]">
        <span className="tabular-nums text-[var(--color-text-secondary)]">
          {formatTime(shift.shiftStart)}
        </span>
        <span className="tabular-nums font-semibold text-[var(--color-text-primary)]">
          {completed} of {total} stops
        </span>
        <span className="tabular-nums text-[var(--color-text-secondary)]">
          {formatTime(shift.shiftEnd)}
        </span>
      </div>

      {/* Bar with now marker */}
      <div className="relative mt-2 h-2 w-full rounded-full bg-[var(--color-surface-warm)] ring-1 ring-[var(--color-border)]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pctElapsed}%`,
            background: "var(--color-brand)",
          }}
        />
        <div
          aria-hidden
          className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--color-brand)] shadow-card"
          style={{ left: `${pctElapsed}%` }}
        />
      </div>

      <div className="mt-2.5 flex items-center justify-between text-[11px] text-[var(--color-text-secondary)]">
        <span>{formatDuration(elapsedMin)} in</span>
        <span className="font-semibold text-[var(--color-brand)]">
          {formatDuration(remainingMin)} left
        </span>
      </div>
    </section>
  );
}

function StopCard({
  trip,
  status,
  isFirst,
  onSelect,
}: {
  trip: Trip;
  status: TripStatus;
  isFirst: boolean;
  onSelect: () => void;
}) {
  const isActive = status === "in-progress";
  const headerLabel = isActive
    ? "Now"
    : isFirst
      ? timeUntil(trip.scheduledPickupAt)
      : timeUntil(trip.scheduledPickupAt);

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl bg-card ring-1 transition-shadow",
        isActive
          ? "ring-[var(--color-brand)]/40 shadow-card"
          : "ring-[var(--color-border)]"
      )}
    >
      {/* Section-style header */}
      <header
        className={cn(
          "flex items-center justify-between px-3.5 py-2 text-[12px] font-semibold",
          isActive
            ? "bg-[var(--color-brand-light)] text-[var(--color-brand)]"
            : "bg-[var(--color-surface-warm)] text-[var(--color-text-secondary)]"
        )}
      >
        <span className="flex items-center gap-1.5">
          {isActive && (
            <span
              className="inline-block size-2 animate-pulse rounded-full"
              style={{ background: "var(--color-brand)" }}
              aria-hidden
            />
          )}
          {headerLabel}
          {trip.wasUpdated && (
            <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-brand)]">
              Updated
            </span>
          )}
        </span>
        <span className="tabular-nums text-[var(--color-text-primary)]/80">
          {formatTime(trip.scheduledPickupAt)}
        </span>
      </header>

      <button
        type="button"
        onClick={onSelect}
        className="w-full px-3.5 py-3 text-left cursor-pointer hover:bg-black/[0.02]"
      >
        {/* Pickup address line */}
        <div className="flex items-start gap-2">
          <MapPin
            size={14}
            weight="fill"
            aria-hidden
            className="mt-0.5 shrink-0"
            style={{ color: "var(--color-brand)" }}
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-semibold text-[var(--color-text-primary)]">
              {trip.pickup?.line1}
            </div>
            <div className="truncate text-[11px] text-[var(--color-text-muted)]">
              to {trip.dropoff?.line1}
            </div>
          </div>
        </div>

        {/* Passenger row */}
        <div className="mt-2.5 flex items-center gap-2.5">
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
            style={{ background: avatarColor(trip.passengerName ?? "") }}
            aria-hidden
          >
            {initials(trip.passengerName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-[var(--color-text-primary)]">
              {trip.passengerName}
            </div>
            <div className="truncate text-[11px] text-[var(--color-text-secondary)]">
              {trip.passengerNote ?? "1 adult · ambulatory"}
            </div>
          </div>
          {trip.distanceMiles !== undefined && (
            <span className="shrink-0 tabular-nums text-[11px] font-semibold text-[var(--color-text-muted)]">
              {trip.distanceMiles.toFixed(1)} mi
            </span>
          )}
        </div>
      </button>
    </article>
  );
}

function BreakCard({ trip }: { trip: Trip }) {
  return (
    <article className="flex items-center gap-3 rounded-xl bg-[var(--color-brand-light)]/60 px-4 py-3 ring-1 ring-[var(--color-brand)]/20">
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-full text-white"
        style={{ background: "var(--color-brand)" }}
        aria-hidden
      >
        <Coffee size={18} weight="fill" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold text-[var(--color-text-primary)]">
          Scheduled break · {trip.estimatedDurationMin} min
        </div>
        <div className="text-[12px] text-[var(--color-text-secondary)]">
          {formatTime(trip.scheduledPickupAt)} –{" "}
          {formatTime(trip.scheduledDropoffAt)}
        </div>
      </div>
    </article>
  );
}

function GapCallout({
  minutes,
  beforeName,
}: {
  minutes: number;
  beforeName?: string;
}) {
  return (
    <div className="my-2 flex items-center gap-2 rounded-lg bg-[var(--color-surface-warm)] px-3 py-2 text-[12px] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
      <span
        className="inline-block size-1.5 rounded-full"
        style={{ background: "var(--color-status-running)" }}
        aria-hidden
      />
      <span className="font-semibold text-[var(--color-text-primary)]">
        {minutes} min gap
      </span>
      {beforeName && <span>before {beforeName}</span>}
    </div>
  );
}
