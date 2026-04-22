"use client";

import { ChevronRight } from "lucide-react";
import type { Bus } from "@/data/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SortHeader, type SortDirection } from "@/components/ui/sort-header";
import { STATUS_BG, STATUS_LABELS, STATUS_TEXT } from "@/lib/constants";
import { formatNumber, milesUntilPm } from "@/lib/utils";

export type BusesSortKey = "number" | "model" | "mileage" | "nextPm" | "status";
export type { SortDirection };

interface BusesListProps {
  buses: Bus[];
  onSelectBus: (bus: Bus) => void;
  sortKey: BusesSortKey;
  sortDir: SortDirection;
  onSort: (key: BusesSortKey) => void;
}

export function BusesList({
  buses,
  onSelectBus,
  sortKey,
  sortDir,
  onSort,
}: BusesListProps) {
  if (buses.length === 0) {
    return (
      <Card className="rounded-lg p-6 shadow-card">
        <p className="text-[13px] font-medium text-text-faint">No buses match.</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-lg p-0 shadow-card">
      <div className="hidden items-center px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-text-faint sm:grid sm:grid-cols-[84px_1.4fr_112px_128px_168px_16px] sm:gap-3">
        <SortHeader<BusesSortKey> label="Bus #" columnKey="number" activeKey={sortKey} dir={sortDir} onSort={onSort} />
        <SortHeader<BusesSortKey> label="Model" columnKey="model" activeKey={sortKey} dir={sortDir} onSort={onSort} />
        <SortHeader<BusesSortKey> label="Mileage" columnKey="mileage" activeKey={sortKey} dir={sortDir} onSort={onSort} align="right" />
        <SortHeader<BusesSortKey> label="Next PM" columnKey="nextPm" activeKey={sortKey} dir={sortDir} onSort={onSort} align="right" />
        <SortHeader<BusesSortKey> label="Status" columnKey="status" activeKey={sortKey} dir={sortDir} onSort={onSort} />
        <span aria-hidden />
      </div>
      <Separator />
      {buses.map((bus, idx) => (
        <div key={bus.id}>
          {idx > 0 && <Separator />}
          <BusRow bus={bus} onSelect={onSelectBus} />
        </div>
      ))}
    </Card>
  );
}

function BusRow({ bus, onSelect }: { bus: Bus; onSelect: (bus: Bus) => void }) {
  const miles = milesUntilPm(bus);
  const pmOverdue = miles <= 0;
  const pmSoon = !pmOverdue && miles < 2000;
  const pmColor = pmOverdue ? "#991b1b" : pmSoon ? "#92400e" : "var(--color-text-primary)";
  const pmText = pmOverdue
    ? `${formatNumber(Math.abs(miles))} mi overdue`
    : `${formatNumber(miles)} mi`;

  const statusBg = STATUS_BG[bus.status];
  const statusText = STATUS_TEXT[bus.status];

  return (
    <button
      type="button"
      onClick={() => onSelect(bus)}
      className="group grid w-full cursor-pointer grid-cols-[1fr_auto_16px] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none sm:grid-cols-[84px_1.4fr_112px_128px_168px_16px] sm:gap-3 sm:px-5 sm:py-3.5"
    >
      <div className="min-w-0">
        <div className="font-mono text-[14px] font-semibold tracking-[-0.01em] text-foreground">
          #{bus.busNumber}
        </div>
        <div className="mt-0.5 truncate text-[12px] font-medium text-text-faint sm:hidden">
          {bus.model} · {bus.year}
        </div>
      </div>

      <div className="hidden truncate text-[13px] font-medium text-foreground sm:block">
        {bus.model} <span className="text-text-faint">· {bus.year}</span>
      </div>

      <div className="hidden text-right font-mono text-[13px] font-semibold tabular-nums text-text-secondary sm:block">
        {formatNumber(bus.mileage)}
      </div>

      <div
        className="hidden text-right font-mono text-[13px] font-semibold tabular-nums sm:block"
        style={{ color: pmColor }}
      >
        {pmText}
      </div>

      <div className="flex items-center justify-self-end sm:justify-self-start">
        <Badge style={{ color: statusText, background: statusBg }}>
          {STATUS_LABELS[bus.status]}
        </Badge>
      </div>

      <ChevronRight className="hidden size-4 text-text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-text-secondary sm:block" />
    </button>
  );
}
