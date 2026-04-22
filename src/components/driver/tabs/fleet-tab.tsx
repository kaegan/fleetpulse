"use client";

import { Pulse, UsersThree } from "@phosphor-icons/react/dist/ssr";
import type { FleetSnapshot } from "@/data/driver-day";
import { cn } from "@/lib/utils";

/**
 * Fleet context — the differentiator and the most delicate surface.
 *
 * Copy rules enforced here:
 *  - No sentence starts with "You[r]" except the one explicit two-number
 *    comparison on the OTP card (which deliberately omits a verb).
 *  - No percentile rank or ordering.
 *  - No up/down arrow decoration on Jane's numbers.
 *  - Anything that could appear unchanged on another driver's phone is safe.
 *
 * The mental model: this tab shows the *weather*, not a report card.
 */
export function FleetTab({ snapshot }: { snapshot: FleetSnapshot }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-3">
      <header className="pb-1">
        <h2 className="text-[17px] font-semibold text-[var(--color-text-primary)]">
          Fleet context
        </h2>
        <p className="mt-0.5 text-[12px] text-[var(--color-text-secondary)]">
          What&rsquo;s happening across the fleet while you&rsquo;re on shift.
        </p>
      </header>

      <OtpCard snapshot={snapshot} />
      <FleetLoadCard snapshot={snapshot} />
      <BreakActivityCard snapshot={snapshot} />
      <div className="pb-4" />
    </div>
  );
}

function OtpCard({ snapshot }: { snapshot: FleetSnapshot }) {
  return (
    <section className="rounded-2xl bg-card p-4 shadow-card ring-1 ring-black/5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        <Pulse size={13} weight="duotone" aria-hidden />
        On-time performance today
      </div>
      <div className="mt-3 grid grid-cols-2 divide-x divide-[var(--color-border)]">
        <MetricColumn
          label="Fleet"
          value={`${snapshot.fleetAvgOtpPct}%`}
          sub={`running ${snapshot.fleetAvgOtpPct}% on-time`}
        />
        <MetricColumn
          label="You"
          value={`${snapshot.driverOtpPct}%`}
          sub={`${snapshot.driverOnTimeCount} of ${snapshot.driverTotalSoFar} on-time so far`}
          alignRight
        />
      </div>
    </section>
  );
}

function MetricColumn({
  label,
  value,
  sub,
  alignRight = false,
}: {
  label: string;
  value: string;
  sub: string;
  alignRight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 py-1",
        alignRight ? "pl-4 items-end text-right" : "pr-4 items-start"
      )}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        {label}
      </div>
      <div className="text-[32px] font-semibold leading-none tabular-nums text-[var(--color-text-primary)]">
        {value}
      </div>
      <div className="text-[11px] leading-snug text-[var(--color-text-secondary)]">
        {sub}
      </div>
    </div>
  );
}

function FleetLoadCard({ snapshot }: { snapshot: FleetSnapshot }) {
  const total = snapshot.nearbyTotalDrivers;
  const active = snapshot.nearbyActiveDrivers;
  // One neutral color for filled segments — no tone labels, no editorializing.
  const activeColor = "var(--color-kpi-availability)";

  return (
    <section className="rounded-2xl bg-card p-4 shadow-card ring-1 ring-black/5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        <UsersThree size={13} weight="duotone" aria-hidden />
        Fleet load right now
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-[28px] font-semibold leading-none tabular-nums text-[var(--color-text-primary)]">
          {active}
        </span>
        <span className="text-[14px] font-medium text-[var(--color-text-secondary)]">
          of {total} nearby drivers active
        </span>
      </div>

      {/* Segmented load bar */}
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
        When more drivers are active, trips fill up faster and schedule
        updates are more likely.
      </p>
    </section>
  );
}

function BreakActivityCard({ snapshot }: { snapshot: FleetSnapshot }) {
  return (
    <section className="rounded-2xl bg-card p-4 shadow-card ring-1 ring-black/5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        Fleet activity during breaks
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-[36px] font-semibold leading-none tabular-nums text-[var(--color-text-primary)]">
          {snapshot.reroutedDuringLastBreak}
        </span>
        <span className="text-[13px] font-medium text-[var(--color-text-secondary)]">
          trips rerouted across the fleet
        </span>
      </div>
      <p className="mt-3 text-[13px] leading-snug text-[var(--color-text-primary)]">
        Routing shifted{" "}
        <span className="font-semibold">
          {snapshot.reroutedDuringLastBreak} trips
        </span>{" "}
        across nearby drivers in the last hour. That&rsquo;s how the engine
        balances load — nothing you need to action.
      </p>
    </section>
  );
}
