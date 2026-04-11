"use client";

import { IconWrenchFillDuo18 } from "nucleo-ui-fill-duo-18";

interface PmDueBannerProps {
  overdueCount: number;
  comingDueCount: number;
  onClick: () => void;
}

/**
 * Compact discovery trigger for the "Pull In Next" planning surface.
 * Lives above the kanban's scope toggle on Service Board. Opens the
 * PmDueSheet drawer on click. Hidden entirely when both counts are 0.
 *
 * Colour treatment mirrors the old PullInNextCard so the branding
 * "Pull In Next = orange" carries through even at banner scale.
 */
export function PmDueBanner({
  overdueCount,
  comingDueCount,
  onClick,
}: PmDueBannerProps) {
  if (overdueCount === 0 && comingDueCount === 0) return null;

  // Lead with overdue — that's the urgent tier. Coming-due is secondary
  // (shown only if overdue > 0, otherwise promoted to the lead).
  const hasOverdue = overdueCount > 0;

  const primaryCopy = hasOverdue
    ? `${overdueCount} bus${overdueCount === 1 ? "" : "es"} overdue for PM`
    : `${comingDueCount} bus${comingDueCount === 1 ? "" : "es"} coming due for PM`;

  const secondaryCopy =
    hasOverdue && comingDueCount > 0
      ? ` · ${comingDueCount} coming due`
      : "";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Review ${overdueCount + comingDueCount} buses needing preventive maintenance`}
      className="group mb-[18px] flex w-full cursor-pointer flex-col items-start gap-2 rounded-2xl px-5 py-[14px] text-left transition-all hover:brightness-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:flex-row sm:items-center sm:gap-3"
      style={{
        background: "#fff4ed",
      }}
    >
      <span className="flex items-center gap-3 sm:contents">
        <span
          aria-hidden
          style={{
            display: "flex",
            width: 20,
            height: 20,
            color: "#b4541a",
            flexShrink: 0,
          }}
        >
          <IconWrenchFillDuo18 />
        </span>

        <span
          className="min-w-0 flex-1 text-[14px] leading-tight"
          style={{ color: "#b4541a" }}
        >
          <span style={{ fontWeight: 700 }}>{primaryCopy}</span>
          {secondaryCopy && (
            <span style={{ fontWeight: 500, opacity: 0.72 }}>{secondaryCopy}</span>
          )}
        </span>
      </span>

      <span
        className="text-[11px] font-bold uppercase tracking-[0.06em] transition-transform group-hover:translate-x-0.5"
        style={{ color: "#b4541a", flexShrink: 0 }}
      >
        Review →
      </span>
    </button>
  );
}
