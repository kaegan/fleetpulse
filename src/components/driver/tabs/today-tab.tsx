"use client";

import {
  ArrowCircleDown,
  ArrowCircleUp,
  ArrowsClockwise,
  ArrowsLeftRight,
  Calendar,
  Pulse,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import type {
  DispatchAdjustment,
  DriverPersona,
  DriverShift,
  TodaySnapshot,
} from "@/data/driver-day";
import {
  formatDuration,
  formatTime,
  getProgress,
  milesSoFar,
  nextBreak,
  now,
  riderSummary,
  timeUntilMinutes,
} from "@/data/driver-day";

/**
 * Today tab — the driver's ambient + personal view of their shift.
 *
 * Union-compatible by construction: every driver sees the same four
 * sections with the same eyebrows, captions, and layout — only the
 * numbers differ. No peer names, no rank, no cross-driver comparison.
 *
 * Sections:
 *  1. Your day — stops/miles/break/shift-end horizon + subtle rider impact
 *  2. Your load today — compares against this driver's own typical Wed
 *  3. Dispatch adjustments today — clinical log of engine changes to manifest
 *  4. On shift nearby — zone-level van count and volume signal
 */
export function TodayTab({
  shift,
  snapshot,
  onSwapPersona,
}: {
  shift: DriverShift;
  snapshot: TodaySnapshot;
  persona: DriverPersona;
  onSwapPersona: () => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-3">
      <header className="pb-1">
        <h2 className="text-[17px] font-semibold text-[var(--color-text-primary)]">
          Today
        </h2>
        <p className="mt-0.5 text-[12px] text-[var(--color-text-secondary)]">
          Your day and what&rsquo;s moving around you.
        </p>
      </header>

      <PersonaChip name={shift.driverName} onSwap={onSwapPersona} />

      <YourDayCard shift={shift} />
      <YourLoadCard shift={shift} snapshot={snapshot} />
      <DispatchAdjustmentsCard snapshot={snapshot} />
      <OnShiftNearbyCard snapshot={snapshot} />

      <div className="pb-4" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Persona chip — demo-only switcher. Visible on the Today tab so the
// interviewer can toggle good/bad driver side-by-side. Labeled as a view,
// not a role, to keep it clearly a demo affordance.

function PersonaChip({ name, onSwap }: { name: string; onSwap: () => void }) {
  return (
    <button
      type="button"
      onClick={onSwap}
      aria-label="Swap driver persona"
      className="flex items-center gap-1.5 rounded-full bg-[var(--color-surface-warm)] px-3 py-1 text-[11px] font-semibold text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] cursor-pointer hover:bg-black/[0.04] transition-colors"
    >
      <span>Viewing as {name}</span>
      <ArrowsLeftRight size={12} weight="bold" aria-hidden />
    </button>
  );
}

// ---------------------------------------------------------------------------
// 1. Your day — shape of the driver's own day.

function YourDayCard({ shift }: { shift: DriverShift }) {
  const tick = now();
  const { completed, total } = getProgress(shift, tick);
  const miles = milesSoFar(shift, tick);
  const nb = nextBreak(shift, tick);
  const minsToBreak = nb ? timeUntilMinutes(nb.scheduledPickupAt, tick) : null;
  const minsToEnd = timeUntilMinutes(shift.shiftEnd, tick);
  const rider = riderSummary(shift, tick);

  return (
    <section className="rounded-2xl bg-card p-4 shadow-card ring-1 ring-black/5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        <Calendar size={13} weight="duotone" aria-hidden />
        Your day
      </div>

      <div className="mt-3 grid grid-cols-2 gap-y-3">
        <DayStat label="Stops" value={`${completed} of ${total}`} />
        <DayStat
          label="Miles so far"
          value={miles.toFixed(1)}
          unit="mi"
        />
        <DayStat
          label="Next break"
          value={
            minsToBreak != null && minsToBreak > 0
              ? `in ${formatDuration(minsToBreak)}`
              : "—"
          }
        />
        <DayStat
          label="Shift ends"
          value={minsToEnd > 0 ? `in ${formatDuration(minsToEnd)}` : "—"}
        />
      </div>

      {rider && (
        <div className="mt-3 border-t border-[var(--color-border)] pt-3 text-[12px] leading-snug text-[var(--color-text-secondary)]">
          {rider}
        </div>
      )}
    </section>
  );
}

function DayStat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        {label}
      </div>
      <div className="mt-0.5 text-[17px] font-semibold tabular-nums leading-tight text-[var(--color-text-primary)]">
        {value}
        {unit && (
          <span className="ml-1 text-[12px] font-medium text-[var(--color-text-secondary)]">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Your load today — compare against this driver's own typical Wednesday.

function YourLoadCard({
  shift,
  snapshot,
}: {
  shift: DriverShift;
  snapshot: TodaySnapshot;
}) {
  const todayTotal = shift.trips.filter((t) => !t.isBreak).length;
  const typical = snapshot.driverTypicalWeekdayTrips;
  const delta = todayTotal - typical;
  const maxOfPair = Math.max(todayTotal, typical, 1);

  const headline = (() => {
    if (delta === 0) {
      return (
        <>
          <span className="font-semibold">
            {todayTotal} stop{todayTotal === 1 ? "" : "s"} today
          </span>
          {" — right on a typical Wednesday."}
        </>
      );
    }
    const direction = delta > 0 ? "above" : "below";
    return (
      <>
        <span className="font-semibold">
          {todayTotal} stop{todayTotal === 1 ? "" : "s"} today
        </span>
        {" — "}
        {Math.abs(delta)} {direction} a typical Wednesday.
      </>
    );
  })();

  return (
    <section className="rounded-2xl bg-card p-4 shadow-card ring-1 ring-black/5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        <Pulse size={13} weight="duotone" aria-hidden />
        Your load today
      </div>

      <p className="mt-3 text-[15px] leading-snug text-[var(--color-text-primary)]">
        {headline}
      </p>

      <div className="mt-3 space-y-2">
        <LoadBar
          label={`Wed avg ~${typical}`}
          value={typical}
          max={maxOfPair}
          muted
        />
        <LoadBar label={`Today ${todayTotal}`} value={todayTotal} max={maxOfPair} />
      </div>

      {snapshot.vansOutOfService > 0 && (
        <div className="mt-3 rounded-lg bg-[var(--color-surface-warm)] px-3 py-2 text-[12px] leading-snug text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
          {snapshot.vansOutOfService} vans are out for maintenance — load is
          heavier across the fleet.
        </div>
      )}

      <p className="mt-3 text-[11px] leading-snug text-[var(--color-text-muted)]">
        Load reflects your manifest. Dispatch balances across active vans.
      </p>
    </section>
  );
}

function LoadBar({
  label,
  value,
  max,
  muted = false,
}: {
  label: string;
  value: number;
  max: number;
  muted?: boolean;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="w-[92px] shrink-0 text-[11px] tabular-nums text-[var(--color-text-secondary)]">
        {label}
      </div>
      <div className="relative h-1.5 flex-1 rounded-full bg-[var(--color-border)]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: muted ? "rgba(0,0,0,0.22)" : "var(--color-brand)",
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Dispatch adjustments today — clinical log of engine changes.

function DispatchAdjustmentsCard({ snapshot }: { snapshot: TodaySnapshot }) {
  return (
    <section className="rounded-2xl bg-card p-4 shadow-card ring-1 ring-black/5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        <ArrowsClockwise size={13} weight="duotone" aria-hidden />
        Dispatch adjustments today
      </div>

      {snapshot.adjustments.length === 0 ? (
        <p className="mt-3 text-[12px] text-[var(--color-text-secondary)]">
          No manifest changes today.
        </p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {snapshot.adjustments.map((adj, i) => (
            <AdjustmentRow key={i} adjustment={adj} />
          ))}
        </ul>
      )}

      <p className="mt-3 text-[11px] leading-snug text-[var(--color-text-muted)]">
        Spare re-plans when cancellations, traffic, or pickup windows change
        capacity.
      </p>
    </section>
  );
}

function AdjustmentRow({ adjustment }: { adjustment: DispatchAdjustment }) {
  const Icon =
    adjustment.direction === "inflow"
      ? ArrowCircleDown
      : adjustment.direction === "outflow"
        ? ArrowCircleUp
        : null;
  const iconTint =
    adjustment.direction === "inflow"
      ? "var(--color-brand)"
      : adjustment.direction === "outflow"
        ? "var(--color-text-secondary)"
        : "var(--color-text-muted)";

  return (
    <li className="flex items-start gap-2.5">
      <span
        className="mt-0.5 flex size-4 shrink-0 items-center justify-center"
        style={{ color: iconTint }}
        aria-hidden
      >
        {Icon ? (
          <Icon size={16} weight="duotone" />
        ) : (
          <span
            className="block size-1.5 rounded-full"
            style={{ background: iconTint }}
          />
        )}
      </span>
      <div className="min-w-0 flex-1 text-[13px] leading-snug text-[var(--color-text-primary)]">
        <span className="tabular-nums text-[var(--color-text-secondary)]">
          {formatTime(adjustment.at)}
        </span>
        <span className="text-[var(--color-text-muted)]">{" · "}</span>
        <span className="font-medium">{adjustment.summary}</span>
        <span className="text-[var(--color-text-secondary)]">
          {" — "}
          {adjustment.reason}
        </span>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// 4. On shift nearby — zone-level van count + volume signal.

function OnShiftNearbyCard({ snapshot }: { snapshot: TodaySnapshot }) {
  const {
    nearbyActiveDrivers: active,
    nearbyTotalDrivers: total,
    todayDemandLevel,
  } = snapshot;
  const activeColor = "var(--color-kpi-availability)";
  const volumeCopy =
    todayDemandLevel === "heavy"
      ? "Ride volume is heavier than a typical Wednesday morning."
      : todayDemandLevel === "light"
        ? "Ride volume is lighter than a typical Wednesday morning."
        : "Ride volume is typical for a Wednesday morning.";

  return (
    <section className="rounded-2xl bg-card p-4 shadow-card ring-1 ring-black/5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        <UsersThree size={13} weight="duotone" aria-hidden />
        On shift nearby
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-[28px] font-semibold leading-none tabular-nums text-[var(--color-text-primary)]">
          {active}
        </span>
        <span className="text-[14px] font-medium text-[var(--color-text-secondary)]">
          of {total} vans on shift in your area
        </span>
      </div>

      <div className="mt-4 flex gap-1" aria-hidden>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="h-2 flex-1 rounded-full"
            style={{
              background: i < active ? activeColor : "rgba(0,0,0,0.08)",
            }}
          />
        ))}
      </div>

      <p className="mt-3 text-[12px] leading-snug text-[var(--color-text-secondary)]">
        {volumeCopy}
      </p>
    </section>
  );
}
