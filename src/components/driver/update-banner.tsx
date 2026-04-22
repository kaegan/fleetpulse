"use client";

import { ArrowRight, ArrowsClockwise, X } from "@phosphor-icons/react/dist/ssr";
import type { ScheduleUpdate } from "@/data/driver-day";
import { formatRelative } from "@/data/driver-day";

/**
 * Small banner announcing a schedule change from Spare's optimization engine.
 * Framed as a helpful update ("Updated 2 min ago — Trip 6 moved 10 min
 * earlier"), not a surprise.
 *
 * Dismiss state is owned by the parent (DriverView) so both the Trip and
 * Schedule banners share it, and the Inbox tab's unread indicator can
 * derive from the same signal.
 */
export function UpdateBanner({
  update,
  onDismiss,
  onViewChanges,
}: {
  update: ScheduleUpdate;
  onDismiss: () => void;
  /** Optional — when provided, adds a "See what changed" CTA that routes
   *  the driver to the Schedule tab where the updated trip is visible. */
  onViewChanges?: () => void;
}) {
  const relative = formatRelative(update.updatedAt);

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-xl bg-[var(--color-brand-light)] px-3.5 py-3 text-[13px] leading-snug text-[var(--color-text-primary)]"
    >
      <span
        className="flex size-6 shrink-0 items-center justify-center rounded-full text-[var(--color-brand)]"
        style={{ background: "rgba(212,101,74,0.14)" }}
        aria-hidden
      >
        <ArrowsClockwise size={14} weight="bold" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-semibold">
          Schedule updated · {relative}
        </div>
        <div className="text-[var(--color-text-secondary)]">
          {update.summary} <span aria-hidden>·</span> {update.reason}
        </div>
        {onViewChanges && (
          <button
            type="button"
            onClick={onViewChanges}
            className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--color-brand)] hover:text-[var(--color-brand-hover)] cursor-pointer"
          >
            See what changed
            <ArrowRight size={11} weight="bold" aria-hidden />
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss update"
        className="shrink-0 rounded-full p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-black/5 cursor-pointer"
      >
        <X size={14} weight="bold" aria-hidden />
      </button>
    </div>
  );
}
