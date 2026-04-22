"use client";

import { ArrowDown, ArrowUp, ChevronRight, ChevronsUpDown } from "lucide-react";
import type { Part } from "@/data/types";
import type { DepotScope } from "@/hooks/use-depot";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { classifyPart } from "@/lib/parts-urgency";

export type PartsSortKey =
  | "name"
  | "category"
  | "stockNorth"
  | "stockSouth"
  | "status";

export type SortDirection = "asc" | "desc";

interface PartsListProps {
  parts: Part[];
  scope: DepotScope;
  onSelectPart: (part: Part) => void;
  sortKey: PartsSortKey;
  sortDir: SortDirection;
  onSort: (key: PartsSortKey) => void;
}

export function PartsList({
  parts,
  scope,
  onSelectPart,
  sortKey,
  sortDir,
  onSort,
}: PartsListProps) {
  if (parts.length === 0) {
    return (
      <Card className="rounded-lg p-6 shadow-card">
        <p className="text-[13px] font-medium text-text-faint">
          No parts match.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-lg p-0 shadow-card">
      <div className="hidden items-center px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-text-faint sm:grid sm:grid-cols-[1.7fr_1fr_88px_88px_104px_16px] sm:gap-3">
        <SortHeader
          label="Part"
          columnKey="name"
          activeKey={sortKey}
          dir={sortDir}
          onSort={onSort}
        />
        <SortHeader
          label="Category"
          columnKey="category"
          activeKey={sortKey}
          dir={sortDir}
          onSort={onSort}
        />
        <SortHeader
          label="North"
          columnKey="stockNorth"
          activeKey={sortKey}
          dir={sortDir}
          onSort={onSort}
          align="right"
        />
        <SortHeader
          label="South"
          columnKey="stockSouth"
          activeKey={sortKey}
          dir={sortDir}
          onSort={onSort}
          align="right"
        />
        <SortHeader
          label="Status"
          columnKey="status"
          activeKey={sortKey}
          dir={sortDir}
          onSort={onSort}
        />
        <span aria-hidden />
      </div>
      <Separator />
      {parts.map((part, idx) => (
        <div key={part.id}>
          {idx > 0 && <Separator />}
          <PartRow part={part} scope={scope} onSelect={onSelectPart} />
        </div>
      ))}
    </Card>
  );
}

function SortHeader({
  label,
  columnKey,
  activeKey,
  dir,
  onSort,
  align = "left",
}: {
  label: string;
  columnKey: PartsSortKey;
  activeKey: PartsSortKey;
  dir: SortDirection;
  onSort: (key: PartsSortKey) => void;
  align?: "left" | "right";
}) {
  const isActive = columnKey === activeKey;
  const Icon = !isActive ? ChevronsUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onSort(columnKey)}
      className={
        "inline-flex items-center gap-1 rounded px-1 py-0.5 -mx-1 text-[10px] font-semibold uppercase tracking-[0.06em] transition-colors hover:text-text-secondary focus-visible:outline-none focus-visible:bg-muted/60 " +
        (isActive ? "text-foreground" : "text-text-faint") +
        (align === "right" ? " justify-end" : "")
      }
    >
      <span>{label}</span>
      <Icon
        className={
          "size-3 shrink-0 " +
          (isActive ? "text-text-secondary" : "text-text-faint/70")
        }
      />
    </button>
  );
}

function PartRow({
  part,
  scope,
  onSelect,
}: {
  part: Part;
  scope: DepotScope;
  onSelect: (part: Part) => void;
}) {
  const urgency = classifyPart(part, scope);
  const needsAttention =
    urgency.level === "stockout" || urgency.level === "at-reorder";

  return (
    <button
      type="button"
      onClick={() => onSelect(part)}
      className="group grid w-full grid-cols-[1fr_auto_16px] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none sm:grid-cols-[1.7fr_1fr_88px_88px_104px_16px] sm:gap-3 sm:px-5 sm:py-3.5"
    >
      <div className="min-w-0">
        <div className="truncate text-[14px] font-semibold tracking-[-0.01em] text-foreground">
          {part.name}
        </div>
        <div className="mt-0.5 truncate text-[12px] font-medium text-text-faint sm:hidden">
          {part.category}
        </div>
      </div>

      <div className="hidden truncate text-[13px] font-medium text-text-secondary sm:block">
        {part.category}
      </div>

      <div
        className="hidden text-right font-mono text-[13px] font-semibold tabular-nums sm:block"
        style={{ color: stockCellColor(part.stockNorth, part.reorderPoint) }}
      >
        {part.stockNorth}
      </div>
      <div
        className="hidden text-right font-mono text-[13px] font-semibold tabular-nums sm:block"
        style={{ color: stockCellColor(part.stockSouth, part.reorderPoint) }}
      >
        {part.stockSouth}
      </div>

      <div className="flex items-center justify-self-end sm:justify-self-start">
        {needsAttention && (
          <Badge
            style={{ color: urgency.textColor, background: urgency.bgColor }}
          >
            {urgency.label}
          </Badge>
        )}
      </div>

      <ChevronRight className="hidden size-4 text-text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-text-secondary sm:block" />
    </button>
  );
}

function stockCellColor(count: number, reorderPoint: number): string {
  if (count === 0) return "#991b1b";
  if (count <= reorderPoint) return "#92400e";
  return "var(--color-text-primary)";
}
