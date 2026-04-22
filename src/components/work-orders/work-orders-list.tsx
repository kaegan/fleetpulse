"use client";

import { ChevronRight } from "lucide-react";
import type { WorkOrder } from "@/data/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SortHeader, type SortDirection } from "@/components/ui/sort-header";
import { TimeDisplay } from "@/components/time-display";
import {
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  STAGE_LABELS,
} from "@/lib/constants";

export type WorkOrdersSortKey =
  | "id"
  | "bus"
  | "mechanic"
  | "opened"
  | "severity"
  | "stage";
export type { SortDirection };

interface WorkOrdersListProps {
  orders: WorkOrder[];
  onSelectOrder: (order: WorkOrder) => void;
  sortKey: WorkOrdersSortKey;
  sortDir: SortDirection;
  onSort: (key: WorkOrdersSortKey) => void;
}

// Column template: ID | Bus | Issue | Mechanic | Opened | Severity | Stage | ›
const GRID_TEMPLATE =
  "sm:grid-cols-[92px_64px_1fr_140px_72px_112px_112px_16px]";

export function WorkOrdersList({
  orders,
  onSelectOrder,
  sortKey,
  sortDir,
  onSort,
}: WorkOrdersListProps) {
  if (orders.length === 0) {
    return (
      <Card className="rounded-lg p-6 shadow-card">
        <p className="text-[13px] font-medium text-text-faint">
          No work orders match.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-lg p-0 shadow-card">
      <div
        className={`hidden items-center px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-text-faint sm:grid sm:gap-3 ${GRID_TEMPLATE}`}
      >
        <SortHeader<WorkOrdersSortKey> label="ID" columnKey="id" activeKey={sortKey} dir={sortDir} onSort={onSort} />
        <SortHeader<WorkOrdersSortKey> label="Bus" columnKey="bus" activeKey={sortKey} dir={sortDir} onSort={onSort} />
        <span className="text-text-faint">Issue</span>
        <SortHeader<WorkOrdersSortKey> label="Mechanic" columnKey="mechanic" activeKey={sortKey} dir={sortDir} onSort={onSort} />
        <SortHeader<WorkOrdersSortKey> label="Opened" columnKey="opened" activeKey={sortKey} dir={sortDir} onSort={onSort} align="right" />
        <SortHeader<WorkOrdersSortKey> label="Severity" columnKey="severity" activeKey={sortKey} dir={sortDir} onSort={onSort} />
        <SortHeader<WorkOrdersSortKey> label="Stage" columnKey="stage" activeKey={sortKey} dir={sortDir} onSort={onSort} />
        <span aria-hidden />
      </div>
      <Separator />
      {orders.map((wo, idx) => (
        <div key={wo.id}>
          {idx > 0 && <Separator />}
          <WorkOrderRow wo={wo} onSelect={onSelectOrder} />
        </div>
      ))}
    </Card>
  );
}

function WorkOrderRow({
  wo,
  onSelect,
}: {
  wo: WorkOrder;
  onSelect: (wo: WorkOrder) => void;
}) {
  const sev = SEVERITY_COLORS[wo.severity];
  return (
    <button
      type="button"
      onClick={() => onSelect(wo)}
      className={`group grid w-full cursor-pointer grid-cols-[1fr_auto_16px] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none sm:gap-3 sm:px-5 sm:py-3.5 ${GRID_TEMPLATE}`}
    >
      <div className="min-w-0">
        <div className="font-mono text-[13px] font-semibold text-foreground">
          {wo.id}
        </div>
        <div className="mt-0.5 truncate text-[13px] font-medium text-foreground sm:hidden">
          Bus #{wo.busNumber} · {wo.issue}
        </div>
      </div>

      <div className="hidden font-mono text-[13px] font-medium text-text-secondary sm:block">
        #{wo.busNumber}
      </div>

      <div className="hidden truncate text-[13px] font-medium text-foreground sm:block">
        {wo.issue}
      </div>

      <div
        className="hidden truncate text-[13px] font-medium sm:block"
        style={{
          color: wo.mechanicName
            ? "var(--color-text-primary)"
            : "var(--color-text-faint)",
        }}
      >
        {wo.mechanicName ?? "Unassigned"}
      </div>

      <div className="hidden text-right text-[12px] font-semibold text-text-secondary sm:block">
        <TimeDisplay isoDate={wo.createdAt} />
      </div>

      <div className="flex items-center justify-self-end sm:justify-self-start">
        <Badge style={{ color: sev.text, background: sev.bg }}>
          {SEVERITY_LABELS[wo.severity]}
        </Badge>
      </div>

      <div className="hidden items-center sm:flex">
        {wo.isHeld ? (
          <Badge
            style={{
              color: "#92400e",
              background: "#fffbeb",
            }}
            title="Blocked — see work order for reason"
          >
            Held · {STAGE_LABELS[wo.stage]}
          </Badge>
        ) : (
          <Badge variant="muted">{STAGE_LABELS[wo.stage]}</Badge>
        )}
      </div>

      <ChevronRight className="hidden size-4 text-text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-text-secondary sm:block" />
    </button>
  );
}
