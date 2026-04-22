"use client";

import {
  ArrowRight,
  CheckCircle,
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
import { formatTime } from "@/data/driver-day";
import { cn } from "@/lib/utils";

interface TripTabProps {
  shift: DriverShift;
  activeTrip: Trip | null;
  subStatus: TripSubStatus;
  latestUpdate: ScheduleUpdate | null;
  bannerDismissed: boolean;
  onDismissBanner: () => void;
  onAdvance: () => void;
  onJumpToSchedule: () => void;
}

/**
 * Primary surface. Two modes, chosen from the sub-status:
 *  - `en-route` / `picked-up` → **fullscreen navigation**. The map fills
 *    the tab, floating cards hold the ETA and the forward action. Mirrors
 *    Uber Driver / Google Maps while the driver is actively on the road.
 *  - `arrived` / `dropped-off` → **contextual**. Rider info and schedule
 *    updates surface (arrived), or a next-trip preview (dropped-off) —
 *    the "between-rides" frame.
 *
 * One forward-momentum button advances the state machine across both modes.
 */
export function TripTab({
  shift,
  activeTrip,
  subStatus,
  latestUpdate,
  bannerDismissed,
  onDismissBanner,
  onAdvance,
  onJumpToSchedule,
}: TripTabProps) {
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

  if (subStatus === "en-route" || subStatus === "picked-up") {
    return (
      <FullscreenNav
        shift={shift}
        activeTrip={activeTrip}
        subStatus={subStatus}
        onAdvance={onAdvance}
      />
    );
  }

  return (
    <Contextual
      shift={shift}
      activeTrip={activeTrip}
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
// Fullscreen navigation: map fills the tab with floating cards top/bottom.

function FullscreenNav({
  shift,
  activeTrip,
  subStatus,
  onAdvance,
}: {
  shift: DriverShift;
  activeTrip: Trip;
  subStatus: "en-route" | "picked-up";
  onAdvance: () => void;
}) {
  const headingToPickup = subStatus === "en-route";
  const target = headingToPickup ? activeTrip.pickup : activeTrip.dropoff;
  const arrivalIso = headingToPickup
    ? activeTrip.scheduledPickupAt
    : activeTrip.scheduledDropoffAt;
  const eyebrow = headingToPickup ? "HEADING TO PICKUP" : "HEADING TO DROPOFF";
  const actionLabel = headingToPickup
    ? "I\u2019ve arrived"
    : "Dropped off \u2014 complete trip";
  const initials = initialsOf(activeTrip.passengerName);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Full-bleed map */}
      <div className="absolute inset-0">
        <MapView className="h-full w-full" />
      </div>

      {/* Top floating nav card */}
      <div className="relative z-10 px-4 pt-4">
        <div className="rounded-2xl bg-white/95 px-3.5 py-3 shadow-card ring-1 ring-black/5 backdrop-blur">
          <div className="flex items-start gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: "#3b82f6" }}
              aria-hidden
            >
              <NavigationArrow size={18} weight="fill" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                {eyebrow}
              </div>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className="text-[22px] font-semibold tabular-nums leading-none text-[var(--color-text-primary)]">
                  {activeTrip.estimatedDurationMin} min
                </span>
                <span className="truncate text-[12px] text-[var(--color-text-secondary)]">
                  {activeTrip.distanceMiles !== undefined
                    ? `${activeTrip.distanceMiles.toFixed(1)} mi · `
                    : ""}
                  arrive {formatTime(arrivalIso)}
                </span>
              </div>
              <div className="mt-1 truncate text-[13px] font-medium text-[var(--color-text-primary)]">
                {target?.line1 ?? "Destination"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer pushes the action card to the bottom */}
      <div className="relative flex-1" />

      {/* Bottom floating action card */}
      <div className="relative z-10 px-4 pb-4">
        <div className="rounded-2xl bg-card px-3.5 pt-3 pb-3 shadow-card ring-1 ring-black/5">
          <div className="flex items-center gap-3 pb-3">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-white"
              style={{ background: "#6a6a6a" }}
              aria-hidden
            >
              {initials || <MapPin size={14} weight="fill" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-semibold text-[var(--color-text-primary)]">
                {activeTrip.passengerName ?? "Passenger"}
              </div>
              <div className="truncate text-[12px] text-[var(--color-text-secondary)]">
                {headingToPickup ? "Pickup" : "Dropoff"} · {target?.line1}
              </div>
            </div>
          </div>
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
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contextual: arrived (rider-emphasized) and dropped-off (next-trip preview).

function Contextual({
  shift,
  activeTrip,
  subStatus,
  latestUpdate,
  bannerDismissed,
  onDismissBanner,
  onAdvance,
  onJumpToSchedule,
}: {
  shift: DriverShift;
  activeTrip: Trip;
  subStatus: "arrived" | "dropped-off";
  latestUpdate: ScheduleUpdate | null;
  bannerDismissed: boolean;
  onDismissBanner: () => void;
  onAdvance: () => void;
  onJumpToSchedule: () => void;
}) {
  const isArrived = subStatus === "arrived";
  const nextTrip = !isArrived ? findNextNonBreak(shift, activeTrip.id) : null;
  const actionLabel = isArrived ? "Picked up passenger" : "Start next trip";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {latestUpdate && !bannerDismissed && (
          <div className="px-4 pt-4">
            <UpdateBanner
              update={latestUpdate}
              onDismiss={onDismissBanner}
              onViewChanges={onJumpToSchedule}
            />
          </div>
        )}

        {isArrived ? (
          <ArrivedBody activeTrip={activeTrip} />
        ) : (
          <DroppedOffBody activeTrip={activeTrip} nextTrip={nextTrip} />
        )}
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
      </div>
    </div>
  );
}

function ArrivedBody({ activeTrip }: { activeTrip: Trip }) {
  const initials = initialsOf(activeTrip.passengerName);

  return (
    <>
      {/* Arrival strip */}
      <div className="px-4 py-4">
        <div className="flex items-start gap-3 rounded-2xl bg-card px-3.5 py-3 shadow-card">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-white"
            style={{ background: "var(--color-brand)" }}
            aria-hidden
          >
            <MapPin size={18} weight="fill" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              AT PICKUP
            </div>
            <div className="mt-0.5 truncate text-[16px] font-semibold leading-tight text-[var(--color-text-primary)]">
              {activeTrip.pickup?.line1 ?? "Pickup location"}
            </div>
            <div className="mt-0.5 truncate text-[12px] text-[var(--color-text-secondary)]">
              Waiting for {activeTrip.passengerName ?? "passenger"}
            </div>
          </div>
        </div>
      </div>

      {/* Compact map (driver is stopped — doesn't need a big one) */}
      <div className="px-4">
        <div className="relative h-[140px] overflow-hidden rounded-2xl shadow-card ring-1 ring-black/5">
          <MapView className="h-full" />
          <div className="absolute left-3 bottom-3 flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 shadow-card backdrop-blur">
            <MapPin
              size={14}
              weight="fill"
              aria-hidden
              style={{ color: "var(--color-brand)" }}
            />
            <span className="text-[12px] font-semibold text-[var(--color-text-primary)]">
              {activeTrip.pickup?.line1 ?? "Pickup"}
            </span>
          </div>
        </div>
      </div>

      {/* Emphasized rider card — this is the moment the driver identifies
          the passenger, so the accommodation note gets a prominent badge. */}
      <div className="px-4 pb-4 pt-4">
        <section className="rounded-2xl bg-card shadow-card ring-1 ring-black/5">
          <div className="flex items-start gap-3 px-4 pt-4">
            <div
              className="flex size-14 shrink-0 items-center justify-center rounded-full text-[16px] font-semibold text-white"
              style={{ background: "#6a6a6a" }}
              aria-hidden
            >
              {initials || <MapPin size={20} weight="fill" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[18px] font-semibold text-[var(--color-text-primary)]">
                {activeTrip.passengerName ?? "Passenger"}
              </div>
              <div className="text-[12px] text-[var(--color-text-secondary)]">
                Pickup · {formatTime(activeTrip.scheduledPickupAt)}
              </div>
            </div>
            <button
              type="button"
              aria-label="Call passenger"
              className="shrink-0 flex size-10 items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-black/5 cursor-pointer"
            >
              <Phone size={18} weight="duotone" aria-hidden />
            </button>
          </div>

          {activeTrip.passengerNote && (
            <div className="mx-4 mt-3 flex items-center gap-1.5 rounded-full bg-[var(--color-brand-light)] px-3 py-1.5 text-[12px] font-semibold text-[var(--color-brand)] w-fit">
              <span
                className="inline-block size-1.5 rounded-full"
                style={{ background: "currentColor" }}
                aria-hidden
              />
              {activeTrip.passengerNote}
            </div>
          )}

          <div className="mt-4 flex items-start gap-2 px-4 pb-4 text-[13px] leading-snug text-[var(--color-text-primary)]">
            <MapPin
              size={14}
              weight="fill"
              aria-hidden
              className="mt-0.5 shrink-0"
              style={{ color: "var(--color-brand)" }}
            />
            <div className="min-w-0">
              <div className="font-medium">
                Dropping at {activeTrip.dropoff?.line1}
              </div>
              <div className="text-[var(--color-text-secondary)]">
                {activeTrip.dropoff?.city}
                {activeTrip.distanceMiles !== undefined && (
                  <>
                    {" · "}
                    {activeTrip.distanceMiles.toFixed(1)} mi ·{" "}
                    {activeTrip.estimatedDurationMin} min
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function DroppedOffBody({
  activeTrip,
  nextTrip,
}: {
  activeTrip: Trip;
  nextTrip: Trip | null;
}) {
  return (
    <>
      {/* Completion strip */}
      <div className="px-4 py-4">
        <div className="flex items-start gap-3 rounded-2xl bg-card px-3.5 py-3 shadow-card">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-white"
            style={{ background: "var(--color-status-running)" }}
            aria-hidden
          >
            <CheckCircle size={20} weight="fill" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              DROPOFF COMPLETE
            </div>
            <div className="mt-0.5 truncate text-[16px] font-semibold leading-tight text-[var(--color-text-primary)]">
              {activeTrip.passengerName ?? "Passenger"}
            </div>
            <div className="mt-0.5 truncate text-[12px] text-[var(--color-text-secondary)]">
              Arrived at {activeTrip.dropoff?.line1}
            </div>
          </div>
        </div>
      </div>

      {/* Next trip preview replaces the stale "completed-trip card" the old
          flow showed here — gives the driver their immediate next context. */}
      <div className="px-4 pb-4">
        {nextTrip ? (
          <NextTripCard trip={nextTrip} />
        ) : (
          <section className="rounded-2xl bg-card px-4 py-6 text-center shadow-card ring-1 ring-black/5">
            <div className="text-[14px] font-semibold text-[var(--color-text-primary)]">
              Shift complete
            </div>
            <div className="mt-1 text-[12px] text-[var(--color-text-secondary)]">
              No more trips scheduled.
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function NextTripCard({ trip }: { trip: Trip }) {
  const initials = initialsOf(trip.passengerName);

  return (
    <section className="rounded-2xl bg-card shadow-card ring-1 ring-black/5">
      <div className="flex items-center justify-between px-4 pt-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        <span>Next up</span>
        <span className="tabular-nums text-[var(--color-text-primary)]">
          {formatTime(trip.scheduledPickupAt)}
        </span>
      </div>
      <div className="flex items-start gap-3 px-4 pt-3 pb-4">
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
          <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-[var(--color-text-primary)]">
            <MapPin
              size={12}
              weight="fill"
              aria-hidden
              style={{ color: "var(--color-brand)" }}
            />
            <span className="truncate">{trip.pickup?.line1}</span>
          </div>
          <div className="mt-0.5 truncate text-[12px] text-[var(--color-text-secondary)]">
            to {trip.dropoff?.line1}
            {trip.distanceMiles !== undefined && (
              <> · {trip.distanceMiles.toFixed(1)} mi</>
            )}
          </div>
          {trip.passengerNote && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand-light)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-brand)]">
              <span
                className="inline-block size-1.5 rounded-full"
                style={{ background: "currentColor" }}
                aria-hidden
              />
              {trip.passengerNote}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Helpers

function initialsOf(name: string | undefined): string {
  return (
    name
      ?.split(/\s+/)
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? ""
  );
}

function findNextNonBreak(shift: DriverShift, currentId: string): Trip | null {
  const idx = shift.trips.findIndex((t) => t.id === currentId);
  if (idx < 0) return null;
  return shift.trips.slice(idx + 1).find((t) => !t.isBreak) ?? null;
}
