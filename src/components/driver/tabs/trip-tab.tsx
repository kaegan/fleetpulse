"use client";

import {
  ArrowRight,
  CheckCircle,
  Clock,
  Coffee,
  MapPin,
  NavigationArrow,
  Phone,
} from "@phosphor-icons/react/dist/ssr";
import { MapView } from "@/components/driver/map-view";
import { UpdateBanner } from "@/components/driver/update-banner";
import type {
  DriverShift,
  ScheduleUpdate,
  Trip,
  TripSubStatus,
} from "@/data/driver-day";
import { formatDuration, formatTime, getProgress, now, timeUntilMinutes } from "@/data/driver-day";
import { cn } from "@/lib/utils";

interface TripTabProps {
  shift: DriverShift;
  activeTrip: Trip | null;
  nextTrip: Trip | null;
  nextBreak: Trip | null;
  subStatus: TripSubStatus;
  latestUpdate: ScheduleUpdate | null;
  bannerDismissed: boolean;
  onDismissBanner: () => void;
  onAdvance: () => void;
  onJumpToSchedule: () => void;
}

/**
 * Primary surface. Context-aware: navigation-first when actively driving,
 * between-rides summary when dropped off.
 */
export function TripTab({
  shift,
  activeTrip,
  nextTrip,
  nextBreak,
  subStatus,
  latestUpdate,
  bannerDismissed,
  onDismissBanner,
  onAdvance,
  onJumpToSchedule,
}: TripTabProps) {
  // End-of-shift / no active trip.
  if (!activeTrip) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-[var(--color-brand-light)] text-[var(--color-brand)]">
          <CheckCircle size={30} weight="duotone" aria-hidden />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">You&rsquo;re all clear</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Nothing active right now. Check Schedule for what&rsquo;s next on
            your shift.
          </p>
        </div>
        <button
          type="button"
          onClick={onJumpToSchedule}
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white cursor-pointer hover:bg-[var(--color-brand-hover)] transition-colors"
        >
          See today&rsquo;s schedule
          <ArrowRight size={14} weight="bold" aria-hidden />
        </button>
      </div>
    );
  }

  // Between rides: driver just completed a trip and hasn't started the next.
  if (subStatus === "dropped-off") {
    return (
      <BetweenRidesView
        shift={shift}
        completedTrip={activeTrip}
        nextTrip={nextTrip}
        nextBreak={nextBreak}
        latestUpdate={latestUpdate}
        bannerDismissed={bannerDismissed}
        onDismissBanner={onDismissBanner}
        onAdvance={onAdvance}
      />
    );
  }

  // Navigation mode — actively driving (en-route, arrived, picked-up).
  return (
    <NavigationView
      shift={shift}
      activeTrip={activeTrip}
      nextTrip={nextTrip}
      subStatus={subStatus}
      latestUpdate={latestUpdate}
      bannerDismissed={bannerDismissed}
      onDismissBanner={onDismissBanner}
      onAdvance={onAdvance}
      onJumpToSchedule={onJumpToSchedule}
    />
  );
}

// ---------------------------------------------------------------------------
// Navigation mode

function NavigationView({
  shift,
  activeTrip,
  nextTrip,
  subStatus,
  latestUpdate,
  bannerDismissed,
  onDismissBanner,
  onAdvance,
  onJumpToSchedule,
}: {
  shift: DriverShift;
  activeTrip: Trip;
  nextTrip: Trip | null;
  subStatus: Exclude<TripSubStatus, "dropped-off">;
  latestUpdate: ScheduleUpdate | null;
  bannerDismissed: boolean;
  onDismissBanner: () => void;
  onAdvance: () => void;
  onJumpToSchedule: () => void;
}) {
  const isHeadingToPickup =
    subStatus === "en-route" || subStatus === "arrived";
  const target = isHeadingToPickup ? activeTrip.pickup : activeTrip.dropoff;

  const turnCopy = (() => {
    switch (subStatus) {
      case "en-route":
        return {
          eyebrow: "HEADING TO PICKUP",
          title: activeTrip.pickup?.line1 ?? "Pickup location",
          meta: `${activeTrip.distanceMiles?.toFixed(1) ?? "—"} mi · arriving ${formatTime(activeTrip.scheduledPickupAt)}`,
        };
      case "arrived":
        return {
          eyebrow: "AT PICKUP",
          title: activeTrip.pickup?.line1 ?? "Pickup location",
          meta: `Pickup window · passenger ${activeTrip.passengerName ?? ""}`,
        };
      case "picked-up":
        return {
          eyebrow: "HEADING TO DROPOFF",
          title: activeTrip.dropoff?.line1 ?? "Dropoff location",
          meta: `${activeTrip.distanceMiles?.toFixed(1) ?? "—"} mi · arriving ${formatTime(activeTrip.scheduledDropoffAt)}`,
        };
    }
  })();

  const actionLabel = (() => {
    switch (subStatus) {
      case "en-route":
        return "I\u2019ve arrived";
      case "arrived":
        return "Picked up passenger";
      case "picked-up":
        return "Dropped off \u2014 complete trip";
    }
  })();

  // Banner is contextual: only show when the update directly affects this
  // trip or the immediate next one.
  const showBanner =
    !bannerDismissed &&
    latestUpdate != null &&
    (latestUpdate.tripId === activeTrip.id ||
      latestUpdate.tripId === nextTrip?.id);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {showBanner && (
          <div className="px-4 pt-4">
            <UpdateBanner
              update={latestUpdate!}
              onDismiss={onDismissBanner}
              onViewChanges={onJumpToSchedule}
            />
          </div>
        )}

        {/* Turn strip */}
        <div className="px-4 py-4">
          <div className="flex items-start gap-3 rounded-2xl bg-card px-3.5 py-3 shadow-card">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: "#3b82f6" }}
              aria-hidden
            >
              <NavigationArrow size={18} weight="fill" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                {turnCopy.eyebrow}
              </div>
              <div className="mt-0.5 truncate text-[16px] font-semibold leading-tight text-[var(--color-text-primary)]">
                {turnCopy.title}
              </div>
              {turnCopy.meta && (
                <div className="mt-0.5 truncate text-[12px] text-[var(--color-text-secondary)]">
                  {turnCopy.meta}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="px-4">
          <div className="relative h-[260px] overflow-hidden rounded-2xl shadow-card ring-1 ring-black/5">
            <MapView className="h-full" />
            <div className="absolute left-3 bottom-3 flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 shadow-card backdrop-blur">
              <MapPin
                size={14}
                weight="fill"
                aria-hidden
                style={{ color: "var(--color-brand)" }}
              />
              <span className="text-[12px] font-semibold text-[var(--color-text-primary)]">
                {target?.line1 ?? "Destination"}
              </span>
            </div>
          </div>
        </div>

        {/* Passenger / pickup card */}
        <div className="px-4 pb-4 pt-4">
          <PassengerCard trip={activeTrip} subStatus={subStatus} />
        </div>
      </div>

      <div className="shrink-0 border-t border-[var(--color-border)] bg-card px-4 py-3">
        <button
          type="button"
          onClick={onAdvance}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-[15px] font-semibold transition-colors cursor-pointer",
            "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]/40"
          )}
        >
          {actionLabel}
          <ArrowRight size={16} weight="bold" aria-hidden />
        </button>
        <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
          <span>Van {shift.vehicleId.replace(/^Van\s*#?/, "#")}</span>
          <span aria-hidden>·</span>
          <span>
            Trip {activeTrip.sequence} of{" "}
            {shift.trips.filter((t) => !t.isBreak).length}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Between-rides mode

function BetweenRidesView({
  shift,
  completedTrip,
  nextTrip,
  nextBreak,
  latestUpdate,
  bannerDismissed,
  onDismissBanner,
  onAdvance,
}: {
  shift: DriverShift;
  completedTrip: Trip;
  nextTrip: Trip | null;
  nextBreak: Trip | null;
  latestUpdate: ScheduleUpdate | null;
  bannerDismissed: boolean;
  onDismissBanner: () => void;
  onAdvance: () => void;
}) {
  const tick = now();

  // Banner only if the update affects the next trip specifically.
  const showBanner =
    !bannerDismissed &&
    latestUpdate != null &&
    latestUpdate.tripId === nextTrip?.id;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Completion header */}
        <div className="flex items-center gap-2 text-[var(--color-status-running)]">
          <CheckCircle size={18} weight="fill" aria-hidden />
          <span className="text-[14px] font-semibold">
            Dropped off &middot; {completedTrip.passengerName}
          </span>
        </div>

        {/* Contextual banner: only if next trip was updated */}
        {showBanner && (
          <UpdateBanner
            update={latestUpdate!}
            onDismiss={onDismissBanner}
          />
        )}

        {/* Break card — only if a break sits before the next passenger trip */}
        {nextBreak && (
          <UpcomingBreakCard trip={nextBreak} at={tick} />
        )}

        {/* Next trip card */}
        {nextTrip ? (
          <NextTripCard trip={nextTrip} at={tick} />
        ) : (
          <div className="rounded-2xl bg-[var(--color-brand-light)] px-4 py-5 text-center">
            <p className="text-[14px] font-semibold text-[var(--color-brand)]">
              That&rsquo;s your last trip for the day.
            </p>
          </div>
        )}

        {/* Compact shift progress */}
        <CompactShiftProgress shift={shift} at={tick} />
      </div>

      <div className="shrink-0 border-t border-[var(--color-border)] bg-card px-4 py-3">
        <button
          type="button"
          onClick={onAdvance}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-[15px] font-semibold transition-colors cursor-pointer",
            nextTrip
              ? "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)]"
              : "bg-[var(--color-surface-warm)] text-[var(--color-text-secondary)] cursor-default",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]/40"
          )}
          disabled={!nextTrip}
        >
          {nextTrip ? (
            <>
              Start next trip
              <ArrowRight size={16} weight="bold" aria-hidden />
            </>
          ) : (
            "End of shift"
          )}
        </button>
      </div>
    </div>
  );
}

function UpcomingBreakCard({ trip, at }: { trip: Trip; at: Date }) {
  const minsUntil = timeUntilMinutes(trip.scheduledPickupAt, at);
  const startsIn =
    minsUntil <= 0
      ? "starting now"
      : minsUntil < 60
        ? `in ${minsUntil} min`
        : `in ${Math.floor(minsUntil / 60)}h ${minsUntil % 60}m`;

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
          Break coming up &middot; {trip.estimatedDurationMin} min
        </div>
        <div className="text-[12px] text-[var(--color-text-secondary)]">
          {formatTime(trip.scheduledPickupAt)} &ndash;{" "}
          {formatTime(trip.scheduledDropoffAt)} &middot; {startsIn}
        </div>
      </div>
    </article>
  );
}

function NextTripCard({ trip, at }: { trip: Trip; at: Date }) {
  const minsUntil = timeUntilMinutes(trip.scheduledPickupAt, at);
  const timeLabel =
    minsUntil <= 0
      ? "Now"
      : minsUntil < 60
        ? `in ${minsUntil} min`
        : `in ${Math.floor(minsUntil / 60)}h ${minsUntil % 60}m`;

  const initials =
    trip.passengerName
      ?.split(/\s+/)
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "";

  return (
    <section className="rounded-2xl bg-card shadow-card ring-1 ring-black/5">
      <header className="flex items-center justify-between rounded-t-2xl bg-[var(--color-surface-warm)] px-4 py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          Next trip &middot; {timeLabel}
        </span>
        {trip.wasUpdated && (
          <span className="rounded-full bg-[var(--color-brand-light)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-brand)]">
            Updated
          </span>
        )}
      </header>

      <div className="flex items-start gap-3 px-4 pt-4">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold text-white"
          style={{ background: "#6a6a6a" }}
          aria-hidden
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[16px] font-semibold text-[var(--color-text-primary)]">
            {trip.passengerName}
          </div>
          <div className="text-[12px] text-[var(--color-text-secondary)]">
            Pickup &middot; {formatTime(trip.scheduledPickupAt)}
          </div>
        </div>
        <button
          type="button"
          aria-label="Call passenger"
          className="shrink-0 flex size-9 items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-black/5 cursor-pointer"
        >
          <Phone size={16} weight="duotone" aria-hidden />
        </button>
      </div>

      {trip.passengerNote && (
        <div className="mx-4 mt-3 flex items-center gap-1.5 rounded-full bg-[var(--color-brand-light)] px-3 py-1.5 text-[12px] font-semibold text-[var(--color-brand)] w-fit">
          <span
            className="inline-block size-1.5 rounded-full"
            style={{ background: "currentColor" }}
            aria-hidden
          />
          {trip.passengerNote}
        </div>
      )}

      <div className="mt-3 flex items-start gap-2 px-4 pb-2 text-[13px] leading-snug text-[var(--color-text-primary)]">
        <MapPin
          size={14}
          weight="fill"
          aria-hidden
          className="mt-0.5 shrink-0"
          style={{ color: "var(--color-brand)" }}
        />
        <div className="min-w-0">
          <div className="truncate font-medium">{trip.pickup?.line1}</div>
          <div className="truncate text-[var(--color-text-secondary)]">
            {trip.pickup?.city}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 border-t border-[var(--color-border)] text-center">
        <Stat label="Distance" value={trip.distanceMiles ? `${trip.distanceMiles.toFixed(1)} mi` : "—"} />
        <Stat label="Est. time" value={`${trip.estimatedDurationMin} min`} />
      </div>
    </section>
  );
}

function CompactShiftProgress({ shift, at }: { shift: DriverShift; at: Date }) {
  const startMs = new Date(shift.shiftStart).getTime();
  const endMs = new Date(shift.shiftEnd).getTime();
  const nowMs = at.getTime();
  const shiftDurationMin = Math.round((endMs - startMs) / 60_000);
  const elapsedMin = Math.max(
    0,
    Math.min(shiftDurationMin, Math.round((nowMs - startMs) / 60_000))
  );
  const remainingMin = Math.max(0, shiftDurationMin - elapsedMin);
  const pctElapsed = Math.round((elapsedMin / shiftDurationMin) * 100);
  const { completed, total } = getProgress(shift, at);

  return (
    <div className="rounded-xl bg-[var(--color-surface-warm)] px-4 py-3 ring-1 ring-[var(--color-border)]">
      <div className="flex items-center justify-between text-[12px] mb-2">
        <span className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
          <Clock size={13} weight="duotone" aria-hidden />
          {completed} of {total} stops complete
        </span>
        <span className="font-semibold tabular-nums text-[var(--color-brand)]">
          {formatDuration(remainingMin)} left
        </span>
      </div>
      <div className="relative h-1.5 w-full rounded-full bg-[var(--color-border)]">
        <div
          className="h-full rounded-full"
          style={{ width: `${pctElapsed}%`, background: "var(--color-brand)" }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared subcomponents

function PassengerCard({
  trip,
  subStatus,
}: {
  trip: Trip;
  subStatus: Exclude<TripSubStatus, "dropped-off">;
}) {
  const initials =
    trip.passengerName
      ?.split(/\s+/)
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "";

  const showingPickup =
    subStatus === "en-route" || subStatus === "arrived";

  return (
    <section className="rounded-2xl bg-card shadow-card ring-1 ring-black/5">
      <div className="flex items-start gap-3 px-4 pt-4">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold text-white"
          style={{ background: "#6a6a6a" }}
          aria-hidden
        >
          {initials || <MapPin size={18} weight="fill" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[16px] font-semibold text-[var(--color-text-primary)]">
            {trip.passengerName ?? "Passenger"}
          </div>
          <div className="text-[12px] text-[var(--color-text-secondary)]">
            {showingPickup ? "Pickup" : "Dropoff"} &middot;{" "}
            {formatTime(
              showingPickup ? trip.scheduledPickupAt : trip.scheduledDropoffAt
            )}
          </div>
        </div>
        <button
          type="button"
          aria-label="Call passenger"
          className="shrink-0 flex size-9 items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-black/5 cursor-pointer"
        >
          <Phone size={16} weight="duotone" aria-hidden />
        </button>
      </div>

      <div className="mt-3 flex items-start gap-2 px-4 text-[13px] leading-snug text-[var(--color-text-primary)]">
        <MapPin
          size={14}
          weight="fill"
          aria-hidden
          className="mt-0.5 shrink-0"
          style={{ color: "var(--color-brand)" }}
        />
        <div className="min-w-0">
          <div className="truncate font-medium">
            {(showingPickup ? trip.pickup : trip.dropoff)?.line1}
          </div>
          <div className="truncate text-[var(--color-text-secondary)]">
            {(showingPickup ? trip.pickup : trip.dropoff)?.city}
          </div>
        </div>
      </div>

      {trip.passengerNote && (
        <div className="mx-4 mt-3 flex items-center gap-1.5 rounded-full bg-[var(--color-brand-light)] px-3 py-1.5 text-[12px] font-semibold text-[var(--color-brand)] w-fit">
          <span
            className="inline-block size-1.5 rounded-full"
            style={{ background: "currentColor" }}
            aria-hidden
          />
          {trip.passengerNote}
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 border-t border-[var(--color-border)] text-center">
        <Stat
          label="ETA"
          value={formatTime(
            showingPickup ? trip.scheduledPickupAt : trip.scheduledDropoffAt
          )}
        />
        <Stat
          label="Distance"
          value={trip.distanceMiles ? `${trip.distanceMiles.toFixed(1)} mi` : "—"}
        />
        <Stat label="Est. time" value={`${trip.estimatedDurationMin} min`} />
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        {label}
      </div>
      <div className="text-[14px] font-semibold tabular-nums text-[var(--color-text-primary)]">
        {value}
      </div>
    </div>
  );
}
