"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ── InfoRow ────────────────────────────────────────────────────────────────
// Bordered card tile for key-value facts: "Mechanic / Maria Santos",
// "Bay / Bay 3", etc. Used in detail panels (work-order, bus).

interface InfoRowProps {
  label: string;
  value?: string;
  valueNode?: React.ReactNode;
  /** Explicit color — pass a var() string or CSS color. Overrides `muted`. */
  valueColor?: string;
  /** Render value in muted tone (for empty/unset fields). */
  muted?: boolean;
}

export function InfoRow({
  label,
  value,
  valueNode,
  valueColor,
  muted,
}: InfoRowProps) {
  return (
    <div className="rounded-[10px] border border-border bg-card-hover px-3.5 py-2.5">
      <div className="mb-1 text-[11px] font-medium text-text-faint">{label}</div>
      <div
        className="text-sm font-semibold tracking-[-0.01em]"
        style={{
          color:
            valueColor ??
            (muted ? "var(--color-text-muted)" : "var(--color-text-primary)"),
        }}
      >
        {valueNode ?? value}
      </div>
    </div>
  );
}

// ── InfoGrid ───────────────────────────────────────────────────────────────
// Responsive grid wrapper for InfoRow tiles.

interface InfoGridProps {
  children: React.ReactNode;
  cols?: 2 | 3;
  className?: string;
}

export function InfoGrid({ children, cols = 3, className }: InfoGridProps) {
  return (
    <div
      className={cn(
        "mb-6 grid grid-cols-2 gap-2.5",
        cols === 3 && "sm:grid-cols-3",
        className
      )}
    >
      {children}
    </div>
  );
}

// ── MiniStat ──────────────────────────────────────────────────────────────
// Compact label + value used inside card summary areas (e.g. bus context
// within a work-order detail panel).

interface MiniStatProps {
  label: string;
  value: string;
  /** Explicit color — pass a var() string or CSS color. */
  valueColor?: string;
}

export function MiniStat({ label, value, valueColor }: MiniStatProps) {
  return (
    <div>
      <div className="mb-[3px] text-[10px] font-semibold uppercase tracking-[0.04em] text-text-faint">
        {label}
      </div>
      <div
        className="text-[13px] font-semibold"
        style={{ color: valueColor ?? "var(--color-text-primary)" }}
      >
        {value}
      </div>
    </div>
  );
}
