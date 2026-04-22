"use client";

import { Van } from "@phosphor-icons/react/dist/ssr";
import type { DriverShift } from "@/data/driver-day";
import { formatTime, now } from "@/data/driver-day";

/**
 * Top bar for the driver view. Shows driver initials, van number, shift
 * window, and the current time — pulled from the mock clock so the whole
 * app is a consistent mid-morning snapshot.
 */
export function StatusHeader({ shift }: { shift: DriverShift }) {
  const currentTime = formatTime(now().toISOString());

  return (
    <header className="shrink-0 flex items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-[var(--color-border)]">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="flex aspect-square size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{
            background: "var(--color-brand)",
            boxShadow: "0 0 12px rgba(212,101,74,0.35)",
          }}
          aria-hidden
        >
          {shift.driverInitials}
        </div>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-[15px] font-semibold text-[var(--color-text-primary)]">
            {shift.driverName}
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-secondary)]">
            <Van size={13} weight="duotone" aria-hidden />
            <span>{shift.vehicleId}</span>
            <span aria-hidden>·</span>
            <span>
              {formatTime(shift.shiftStart)} – {formatTime(shift.shiftEnd)}
            </span>
          </div>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-[13px] font-semibold tabular-nums text-[var(--color-text-primary)]">
          {currentTime}
        </div>
        <div className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
          On shift
        </div>
      </div>
    </header>
  );
}
