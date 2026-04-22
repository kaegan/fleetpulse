"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc";

interface SortHeaderProps<K extends string> {
  label: string;
  columnKey: K;
  activeKey: K;
  dir: SortDirection;
  onSort: (key: K) => void;
  align?: "left" | "right";
  className?: string;
}

/**
 * Column header button for sortable tabular lists. Active column shows an
 * up/down arrow; inactive columns show a muted dual-chevron. Consumers own
 * the sort state and toggle logic — this is presentation only.
 */
export function SortHeader<K extends string>({
  label,
  columnKey,
  activeKey,
  dir,
  onSort,
  align = "left",
  className,
}: SortHeaderProps<K>) {
  const isActive = columnKey === activeKey;
  const Icon = !isActive ? ChevronsUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onSort(columnKey)}
      className={cn(
        "inline-flex items-center gap-1 rounded px-1 py-0.5 -mx-1 text-[10px] font-semibold uppercase tracking-[0.06em] transition-colors hover:text-text-secondary focus-visible:outline-none focus-visible:bg-muted/60",
        isActive ? "text-foreground" : "text-text-faint",
        align === "right" && "justify-end",
        className
      )}
    >
      <span>{label}</span>
      <Icon
        className={cn(
          "size-3 shrink-0",
          isActive ? "text-text-secondary" : "text-text-faint/70"
        )}
      />
    </button>
  );
}
