"use client";

import {
  ArrowLeft,
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
 * Primary surface. Map + turn strip + bottom passenger card.
 *
 * The same tab renders four sub-states based on the driver's progress
 * through the active trip (en route → arrived → picked up → dropped off),
 * with a single forward-momentum button that advances the state machine.
 * This mirrors the real Spare Driver app's flow rather than a generic
 * "update status" menu.
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
  // End-of-shift / no active trip: show a friendly off-shift card rather
  // than an empty map. The whole day is behind (or ahead of) you.
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

  // Pickup vs dropoff target flips halfway through the trip.
  const isHeadingToPickup =
    subStatus === "en-route" || subStatus === "arrived";
  const target = isHeadingToPickup ? activeTrip.pickup : activeTrip.dropoff;

  // Turn-strip copy varies by sub-status.
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
      case "dropped-off":
        return {
          eyebrow: "DROPOFF COMPLETE",
          title: "Tap to move to next trip",
          meta: "",
        };
    }
  })();

  // Primary button label for the forward-momentum action.
  const actionLabel = (() => {
    switch (subStatus) {
      case "en-route":
        return "I\u2019ve arrived";
      case "arrived":
        return "Picked up passenger";
      case "picked-up":
        return "Dropped off — complete trip";
      case "dropped-off":
        return "Start next trip";
    }
  })();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Scrollable area: update banner + turn strip + map + passenger card */}
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

        {/* Turn strip */}
        <div className="px-4 py-4">
          <div className="flex items-start gap-3 rounded-2xl bg-card px-3.5 py-3 shadow-card">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: "#3b82f6" }}
              aria-hidden
            >
              {subStatus === "dropped-off" ? (
                <CheckCircle size={20} weight="fill" />
              ) : (
                <NavigationArrow size={18} weight="fill" />
              )}
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
            {/* Floating pin callout on the map */}
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

      {/* Sticky action bar at the bottom of the tab (but above the tab nav) */}
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
          <ArrowLeft size={11} weight="bold" aria-hidden />
          <span>Van {shift.vehicleId.replace(/^Van\s*#?/, "#")}</span>
          <span aria-hidden>·</span>
          <span>Trip {activeTrip.sequence} of {shift.trips.filter((t) => !t.isBreak).length}</span>
        </div>
      </div>
    </div>
  );
}

function PassengerCard({
  trip,
  subStatus,
}: {
  trip: Trip;
  subStatus: TripSubStatus;
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
            {showingPickup ? "Pickup" : "Dropoff"} ·{" "}
            {formatTime(
              showingPickup
                ? trip.scheduledPickupAt
                : trip.scheduledDropoffAt
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
        <Stat label="ETA" value={formatTime(showingPickup ? trip.scheduledPickupAt : trip.scheduledDropoffAt)} />
        <Stat label="Distance" value={trip.distanceMiles ? `${trip.distanceMiles.toFixed(1)} mi` : "—"} />
        <Stat
          label="Est. time"
          value={`${trip.estimatedDurationMin} min`}
        />
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
