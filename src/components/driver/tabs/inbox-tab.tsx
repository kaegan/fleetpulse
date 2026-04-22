"use client";

import {
  ArrowsClockwise,
  ChatCircleText,
  Clock,
} from "@phosphor-icons/react/dist/ssr";
import type { DriverShift, ScheduleUpdate } from "@/data/driver-day";
import { formatRelative, formatTime } from "@/data/driver-day";

/**
 * Inbox — where schedule updates and dispatch outreach live in the new
 * world of automated dispatching. The historical log behind the banner;
 * the "if dispatch needed me, here's where they'd reach me" surface.
 *
 * Stub for now: one schedule-update entry (the undismissed change), one
 * shift-start housekeeping message, and an empty state for direct
 * dispatch messages.
 */
export function InboxTab({
  shift,
  latestUpdate,
  unread,
}: {
  shift: DriverShift;
  latestUpdate: ScheduleUpdate | null;
  /** True while the update banner is still undismissed — renders the
   *  schedule-update entry with an unread state. */
  unread: boolean;
}) {
  const passengerCount = shift.trips.filter((t) => !t.isBreak).length;
  const breakTrip = shift.trips.find((t) => t.isBreak);
  const shiftStartedBody = breakTrip
    ? `${passengerCount} stops today · break scheduled ${formatTime(breakTrip.scheduledPickupAt)}`
    : `${passengerCount} stops today`;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      <header className="pb-1">
        <h2 className="text-[17px] font-semibold text-[var(--color-text-primary)]">
          Inbox
        </h2>
        <p className="mt-0.5 text-[12px] text-[var(--color-text-secondary)]">
          Schedule updates and messages from dispatch.
        </p>
      </header>

      <ul className="space-y-2">
        {latestUpdate && (
          <InboxMessage
            icon={<ArrowsClockwise size={16} weight="bold" aria-hidden />}
            iconTone="brand"
            title="Schedule updated"
            body={`${latestUpdate.summary} · ${latestUpdate.reason}`}
            timestamp={formatRelative(latestUpdate.updatedAt)}
            unread={unread}
          />
        )}
        <InboxMessage
          icon={<Clock size={16} weight="duotone" aria-hidden />}
          iconTone="neutral"
          title="Shift started"
          body={shiftStartedBody}
          timestamp={formatTime(shift.shiftStart)}
          unread={false}
        />
      </ul>

      <div className="pt-4">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          <ChatCircleText size={13} weight="duotone" aria-hidden />
          Direct messages
        </div>
        <div className="mt-2 rounded-xl bg-[var(--color-surface-warm)] px-3.5 py-4 text-[12px] leading-snug text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
          No direct messages. Dispatch will reach out here if they need you.
        </div>
      </div>
    </div>
  );
}

function InboxMessage({
  icon,
  iconTone,
  title,
  body,
  timestamp,
  unread,
}: {
  icon: React.ReactNode;
  iconTone: "brand" | "neutral";
  title: string;
  body: string;
  timestamp: string;
  unread: boolean;
}) {
  return (
    <li
      className={
        "relative flex items-start gap-3 rounded-xl bg-card px-3.5 py-3 shadow-card ring-1 " +
        (unread ? "ring-[var(--color-brand)]/30" : "ring-black/5")
      }
    >
      {unread && (
        <span
          aria-hidden
          className="absolute left-1.5 top-1/2 size-1.5 -translate-y-1/2 rounded-full"
          style={{ background: "var(--color-brand)" }}
        />
      )}
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-full"
        style={{
          background:
            iconTone === "brand"
              ? "rgba(212,101,74,0.14)"
              : "rgba(0,0,0,0.05)",
          color:
            iconTone === "brand"
              ? "var(--color-brand)"
              : "var(--color-text-secondary)",
        }}
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[14px] font-semibold text-[var(--color-text-primary)]">
            {title}
          </span>
          <span className="shrink-0 text-[11px] tabular-nums text-[var(--color-text-muted)]">
            {timestamp}
          </span>
        </div>
        <p className="mt-0.5 text-[12px] leading-snug text-[var(--color-text-secondary)]">
          {body}
        </p>
      </div>
    </li>
  );
}
