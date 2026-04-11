"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Bus, BusStatus, WorkOrder } from "@/data/types";
import { buses } from "@/data/buses";
import { workOrders } from "@/data/work-orders";
import { filterByDepot, useDepot } from "@/hooks/use-depot";
import {
  KPI_PILLS,
  SEVERITY_COLORS,
  SEVERITY_ICONS,
  SEVERITY_LABELS,
  STAGES,
} from "@/lib/constants";
import {
  formatNumber,
  formatTimeInStatus,
  milesUntilPm,
} from "@/lib/utils";
import { SectionPill } from "@/components/section-pill";
import {
  ResponsiveSheet,
  ResponsiveSheetContent,
  ResponsiveSheetTitle,
  ResponsiveSheetDescription,
} from "@/components/ui/responsive-sheet";
import {
  IconBoltSpeedFillDuo18,
  IconWrenchFillDuo18,
  IconGearsFillDuo18,
  IconSirenFillDuo18,
  IconTriangleWarningFillDuo18,
} from "nucleo-ui-fill-duo-18";

// The panel covers the four real BusStatus values plus a derived "overdue"
// view that matches ActionCard's actionable set (past-due AND not in an
// active WO). Hoisted so props, meta, and row helpers all share it.
export type BusListKind = BusStatus | "overdue";

interface StatusBusListPanelProps {
  kind: BusListKind | null;
  onClose: () => void;
  onSelectBus: (bus: Bus) => void;
}

interface StatusMeta {
  pillLabel: string;
  // Inline pill colors override — used when the pill doesn't map to a
  // KPI strip slot (e.g. "overdue" borrows the ActionCard's coral treatment).
  pillColor?: string;
  pillBg?: string;
  pillKey?: keyof typeof KPI_PILLS;
  icon: ReactNode;
  heading: string;
  // One-liner shown under the heading — framed around the operator's JTBD,
  // not just a restatement of the count.
  subtitle: (n: number) => string;
  emptyMessage: string;
}

const META: Record<BusListKind, StatusMeta> = {
  running: {
    pillLabel: "Running",
    pillKey: "Running",
    icon: <IconBoltSpeedFillDuo18 />,
    heading: "On the road",
    subtitle: (n) =>
      `${n} bus${n === 1 ? "" : "es"} running right now. Nothing here needs your attention.`,
    emptyMessage: "No buses running in this depot.",
  },
  "pm-due": {
    pillLabel: "PM Due",
    pillKey: "PM Due",
    icon: <IconWrenchFillDuo18 />,
    heading: "Due for preventive maintenance",
    subtitle: (n) =>
      `Sorted by miles overdue. Pull these in before they break down on route.`,
    emptyMessage: "Nothing overdue right now.",
  },
  "in-maintenance": {
    pillLabel: "In Maintenance",
    pillKey: "In Maintenance",
    icon: <IconGearsFillDuo18 />,
    heading: "In the shop",
    subtitle: (n) =>
      `Sorted by dwell time. Longest-open jobs first so you can escalate what's stuck.`,
    emptyMessage: "No buses in the shop right now.",
  },
  "road-call": {
    pillLabel: "Road Calls",
    pillKey: "Road Calls",
    icon: <IconSirenFillDuo18 />,
    heading: "Road-called today",
    subtitle: (n) =>
      `${n} bus${n === 1 ? "" : "es"} pulled from service today and awaiting intake.`,
    emptyMessage: "No road calls in this depot today.",
  },
  overdue: {
    pillLabel: "Action Needed",
    // Borrow the ActionCard's coral treatment — this list is the "todo"
    // view, not the "PM Due" health view.
    pillColor: "var(--color-brand)",
    pillBg: "var(--color-brand-light)",
    icon: <IconTriangleWarningFillDuo18 />,
    heading: "Overdue for service",
    subtitle: (n) =>
      `${n} bus${n === 1 ? "" : "es"} past due and not yet in the shop. Schedule before they break down on route.`,
    emptyMessage: "Nothing overdue right now.",
  },
};

// Helper for back-button labels when drilling from this panel into a bus
// detail. Reuses the pillLabel so copy stays in sync.
export function getBusListPillLabel(kind: BusListKind): string {
  return META[kind].pillLabel;
}

// Rows use the same "miles overdue in coral" styling for both pm-due (a seed
// flag) and overdue (a derived set). Helper keeps the condition readable.
function isPmStyled(kind: BusListKind): boolean {
  return kind === "pm-due" || kind === "overdue";
}

export function StatusBusListPanel({
  kind,
  onClose,
  onSelectBus,
}: StatusBusListPanelProps) {
  // Snapshot the last non-null kind so the sheet keeps its contents during
  // the close animation — same trick as BusDetailPanel.
  const [displayKind, setDisplayKind] = useState<BusListKind | null>(kind);
  useEffect(() => {
    if (kind) setDisplayKind(kind);
  }, [kind]);

  return (
    <ResponsiveSheet
      open={Boolean(kind)}
      onOpenChange={(open) => !open && onClose()}
    >
      <ResponsiveSheetContent side="right" className="p-0">
        <ResponsiveSheetTitle className="sr-only">
          {displayKind ? META[displayKind].heading : "Bus list"}
        </ResponsiveSheetTitle>
        <ResponsiveSheetDescription className="sr-only">
          Filtered list of buses matching the selected fleet status.
        </ResponsiveSheetDescription>
        {displayKind && (
          <PanelContent kind={displayKind} onSelectBus={onSelectBus} />
        )}
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}

function PanelContent({
  kind,
  onSelectBus,
}: {
  kind: BusListKind;
  onSelectBus: (bus: Bus) => void;
}) {
  const { scope } = useDepot();
  const meta = META[kind];
  // Resolve pill colors: either from a KPI slot or an inline override.
  const pillColor = meta.pillColor ?? (meta.pillKey ? KPI_PILLS[meta.pillKey].color : "var(--color-text-muted)");
  const pillBg = meta.pillBg ?? (meta.pillKey ? KPI_PILLS[meta.pillKey].bg : "var(--color-muted)");

  // WOs indexed by busId for fast lookup in row renderers.
  const worksByBus = useMemo(() => {
    const map = new Map<number, WorkOrder>();
    for (const wo of workOrders) map.set(wo.busId, wo);
    return map;
  }, []);

  const rows = useMemo(() => {
    // "Overdue" is a derived set that mirrors ActionCard exactly: buses that
    // are past due AND not already in an active WO. This is the todo-list
    // view — the existing "pm-due" kind is the seed-flag health view.
    if (kind === "overdue") {
      const busesWithActiveWO = new Set(workOrders.map((wo) => wo.busId));
      return filterByDepot(buses, scope)
        .filter(
          (bus) => milesUntilPm(bus) < 0 && !busesWithActiveWO.has(bus.id)
        )
        .sort((a, b) => milesUntilPm(a) - milesUntilPm(b));
    }

    const filtered = filterByDepot(
      buses.filter((b) => b.status === kind),
      scope
    );

    // Sort per status so the most urgent item is always at the top.
    switch (kind) {
      case "pm-due":
        // Most overdue first
        return [...filtered].sort((a, b) => milesUntilPm(a) - milesUntilPm(b));
      case "in-maintenance":
        // Longest dwell time first, based on the matching WO's stageEnteredAt.
        // Buses without a WO drop to the bottom.
        return [...filtered].sort((a, b) => {
          const aWo = worksByBus.get(a.id);
          const bWo = worksByBus.get(b.id);
          const aTime = aWo ? new Date(aWo.stageEnteredAt).getTime() : Infinity;
          const bTime = bWo ? new Date(bWo.stageEnteredAt).getTime() : Infinity;
          return aTime - bTime;
        });
      case "road-call":
      case "running":
      default:
        return [...filtered].sort((a, b) => a.id - b.id);
    }
  }, [kind, scope, worksByBus]);

  return (
    <div className="flex h-full flex-col p-5 pb-6 sm:p-7">
      {/* Header */}
      <div className="mb-5">
        <div className="mb-2">
          <SectionPill
            label={meta.pillLabel}
            color={pillColor}
            bgColor={pillBg}
            icon={meta.icon}
          />
        </div>
        <h2 className="mb-1 mt-1.5 text-[24px] font-bold tracking-[-0.03em] text-foreground">
          {meta.heading}
          <span className="ml-2.5 text-[18px] font-semibold tracking-[-0.02em] text-text-muted">
            {rows.length}
          </span>
        </h2>
        <p className="text-[13px] font-medium text-text-muted">
          {rows.length === 0 ? meta.emptyMessage : meta.subtitle(rows.length)}
        </p>
      </div>

      {/* List */}
      {rows.length > 0 && (
        <div className="flex flex-1 flex-col gap-2">
          {rows.map((bus) => (
            <BusRow
              key={bus.id}
              bus={bus}
              kind={kind}
              workOrder={worksByBus.get(bus.id) ?? null}
              onClick={() => onSelectBus(bus)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Rows ────────────────────────────────────────────────────────────────

function BusRow({
  bus,
  kind,
  workOrder,
  onClick,
}: {
  bus: Bus;
  kind: BusListKind;
  workOrder: WorkOrder | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer rounded-md border border-border bg-card-hover p-[12px_14px] text-left transition-colors hover:border-border-strong hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      {/* Top row: bus # + garage + kind-specific right value */}
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-bold tracking-[-0.01em] text-foreground">
            Bus #{bus.busNumber}
          </span>
          <span
            className="rounded-pill px-2 py-[2px] text-[10px] font-bold uppercase tracking-[0.03em]"
            style={{
              background:
                bus.garage === "north"
                  ? "var(--color-stage-diagnosing-bg)"
                  : "var(--color-stage-in-repair-bg)",
              color:
                bus.garage === "north"
                  ? "var(--color-stage-diagnosing)"
                  : "var(--color-stage-in-repair)",
            }}
          >
            {bus.garage}
          </span>
        </div>
        <RightValue bus={bus} kind={kind} workOrder={workOrder} />
      </div>

      {/* Second row: kind-specific context */}
      <SecondaryLine bus={bus} kind={kind} workOrder={workOrder} />
    </button>
  );
}

function RightValue({
  bus,
  kind,
  workOrder,
}: {
  bus: Bus;
  kind: BusListKind;
  workOrder: WorkOrder | null;
}) {
  if (isPmStyled(kind)) {
    const overdueMiles = -milesUntilPm(bus);
    const isOverdue = overdueMiles > 0;
    const valueColor = isOverdue
      ? "var(--color-brand)"
      : "var(--color-status-running)";
    return (
      <span className="flex items-baseline gap-1">
        <span
          className="text-[15px] font-extrabold tabular-nums tracking-[-0.01em]"
          style={{ color: valueColor }}
        >
          {formatNumber(Math.abs(overdueMiles))}
        </span>
        <span
          className="text-[10px] font-bold uppercase tracking-[0.03em]"
          style={{ color: valueColor }}
        >
          {isOverdue ? "mi overdue" : "mi left"}
        </span>
      </span>
    );
  }

  if (kind === "in-maintenance" && workOrder) {
    return (
      <span className="text-xs font-bold tabular-nums text-text-secondary">
        {formatTimeInStatus(workOrder.stageEnteredAt)} in{" "}
        {STAGES[workOrder.stage]}
      </span>
    );
  }

  // Running + road-call + in-maintenance without WO: show mileage as context
  return (
    <span className="text-xs font-medium tabular-nums text-text-muted">
      {formatNumber(bus.mileage)} mi
    </span>
  );
}

function SecondaryLine({
  bus,
  kind,
  workOrder,
}: {
  bus: Bus;
  kind: BusListKind;
  workOrder: WorkOrder | null;
}) {
  if (kind === "in-maintenance") {
    if (!workOrder) {
      return (
        <div className="text-xs font-medium text-text-faint">
          In shop · no active work order logged
        </div>
      );
    }
    const sev = SEVERITY_COLORS[workOrder.severity];
    return (
      <div className="flex items-center gap-2 text-xs">
        <span
          className="inline-flex items-center gap-[3px] rounded-pill px-[7px] py-[1px] text-[10px] font-bold uppercase tracking-[0.02em]"
          style={{ background: sev.bg, color: sev.text }}
        >
          <span className="flex h-[11px] w-[11px]" style={{ color: sev.dot }}>
            {SEVERITY_ICONS[workOrder.severity]}
          </span>
          {SEVERITY_LABELS[workOrder.severity]}
        </span>
        <span className="min-w-0 flex-1 truncate font-medium text-text-secondary">
          {workOrder.issue}
        </span>
      </div>
    );
  }

  if (isPmStyled(kind)) {
    return (
      <div className="text-xs font-medium tabular-nums text-text-muted">
        {formatNumber(bus.mileage)} mi total · {bus.model}
      </div>
    );
  }

  if (kind === "road-call") {
    return (
      <div className="text-xs font-medium text-text-faint">
        Pulled from service · awaiting intake
      </div>
    );
  }

  // Running
  return (
    <div className="text-xs font-medium text-text-faint">
      {bus.model} · {bus.year}
    </div>
  );
}
