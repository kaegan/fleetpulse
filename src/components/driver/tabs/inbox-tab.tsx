"use client";

import {
  ArrowsClockwise,
  ChatCircleText,
  Clock,
  Phone,
} from "@phosphor-icons/react/dist/ssr";
import type { DriverShift, ScheduleUpdate } from "@/data/driver-day";
import { dispatchContact, formatRelative, formatTime } from "@/data/driver-day";

/**
 * Inbox — schedule updates, dispatch outreach, and a persistent
 * "contact dispatch" card at the top. In automated dispatching most
 * messages are system-generated, so each message is tagged "Auto" or
 * "Dispatch" to signal origin rather than being split into sections.
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
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-3">
      <header className="pb-1">
        <h2 className="text-[17px] font-semibold text-[var(--color-text-primary)]">
          Inbox
        </h2>
        <p className="mt-0.5 text-[12px] text-[var(--color-text-secondary)]">
          Schedule updates and messages from dispatch.
        </p>
      </header>

      <ContactDispatchCard />

      <div className="pt-2">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--color-text-muted)]">
          <ChatCircleText size={13} weight="duotone" aria-hidden />
          Messages
        </div>
        <ul className="mt-2 space-y-2">
          {latestUpdate && (
            <InboxMessage
              icon={<ArrowsClockwise size={16} weight="bold" aria-hidden />}
              iconTone="brand"
              title="Schedule updated"
              body={`${latestUpdate.summary} · ${latestUpdate.reason}`}
              timestamp={formatRelative(latestUpdate.updatedAt)}
              origin="auto"
              unread={unread}
            />
          )}
          <InboxMessage
            icon={<Clock size={16} weight="duotone" aria-hidden />}
            iconTone="neutral"
            title="Shift started"
            body={shiftStartedBody}
            timestamp={formatTime(shift.shiftStart)}
            origin="auto"
            unread={false}
          />
        </ul>
      </div>
    </div>
  );
}

function ContactDispatchCard() {
  return (
    <div className="pt-4">
      <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--color-text-muted)]">
        <Phone size={13} weight="duotone" aria-hidden />
        Contact dispatch
      </div>
      <div className="mt-2 rounded-xl bg-[var(--color-surface-warm)] px-3.5 py-3.5 ring-1 ring-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full"
            style={{
              background: "rgba(212,101,74,0.14)",
              color: "var(--color-brand)",
            }}
            aria-hidden
          >
            <Phone size={16} weight="fill" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold text-[var(--color-text-primary)]">
              {dispatchContact.depotName}
            </div>
            <div className="text-[12px] text-[var(--color-text-secondary)]">
              Avg reply &middot; {dispatchContact.avgReplyMinutes} min
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a
            href={dispatchContact.phoneHref}
            aria-label={`Call ${dispatchContact.depotName} at ${dispatchContact.phoneDisplay}`}
            className="flex h-11 items-center justify-center gap-1.5 rounded-lg bg-[var(--color-brand)] text-[14px] font-semibold text-white shadow-sm hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]/40 focus-visible:ring-offset-2"
          >
            <Phone size={16} weight="fill" aria-hidden />
            Call
          </a>
          <a
            href={dispatchContact.smsHref}
            aria-label={`Text ${dispatchContact.depotName}`}
            className="flex h-11 items-center justify-center gap-1.5 rounded-lg bg-card text-[14px] font-semibold text-[var(--color-brand)] ring-1 ring-[var(--color-brand)]/30 hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]/40 focus-visible:ring-offset-2"
          >
            <ChatCircleText size={16} weight="fill" aria-hidden />
            Text
          </a>
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
  origin,
  unread,
}: {
  icon: React.ReactNode;
  iconTone: "brand" | "neutral";
  title: string;
  body: string;
  timestamp: string;
  /** "auto" = system-generated (optimizer, shift lifecycle). "dispatch" =
   *  a human dispatcher reached out. Drives a small origin pill in the
   *  header row so the two are legible without splitting into sections. */
  origin: "auto" | "dispatch";
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
          <span className="flex shrink-0 items-center gap-1.5 text-[11px] tabular-nums text-[var(--color-text-muted)]">
            <OriginTag origin={origin} />
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

function OriginTag({ origin }: { origin: "auto" | "dispatch" }) {
  const isAuto = origin === "auto";
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none"
      style={
        isAuto
          ? {
              background: "rgba(0,0,0,0.05)",
              color: "var(--color-text-muted)",
            }
          : {
              background: "rgba(212,101,74,0.14)",
              color: "var(--color-brand)",
            }
      }
    >
      {isAuto ? "Auto" : "Dispatch"}
    </span>
  );
}
