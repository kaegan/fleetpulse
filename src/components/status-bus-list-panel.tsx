"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Bus, BusStatus, WorkOrder } from "@/data/types";
import { buses } from "@/data/buses";
import { useWorkOrders } from "@/contexts/work-orders-context";
import { filterByDepot, useDepot } from "@/hooks/use-depot";
import {
  SEVERITY_COLORS,
  SEVERITY_ICONS,
  SEVERITY_LABELS,
  STAGE_LABELS,
} from "@/lib/constants";
import {
  formatNumber,
  formatTimeInStatus,
  milesUntilPm,
} from "@/lib/utils";
import {
  ResponsiveSheet,
  ResponsiveSheetContent,
  ResponsiveSheetTitle,
  ResponsiveSheetDescription,
} from "@/components/ui/responsive-sheet";

export type BusListKind = BusStatus;

interface StatusBusListPanelProps {
  kind: BusListKind | null;
  onClose: () => void;
  onSelectBus: (bus: Bus) => void;
}

interface StatusMeta {
  // Short label reused as the back-button copy when drilling from this
  // panel into a bus detail. The visual SectionPill is gone, but
  // ops-view still wires this through usePanelNav.
  pillLabel: string;
  heading: string;
  // One-liner shown under the heading — framed around the operator's JTBD,
  // not just a restatement of the count.
  subtitle: (n: number) => string;
  emptyMessage: string;
}

const META: Record<BusListKind, StatusMeta> = {
  running: {
    pillLabel: "Running",
    heading: "On the road",
    subtitle: (n) =>
      `${n} bus${n === 1 ? "" : "es"} running right now. Nothing here needs your attention.`,
    emptyMessage: "No buses running in this depot.",
  },
  "pm-due": {
    pillLabel: "Preventive Maintenance Due",
    heading: "Due for preventive maintenance",
    subtitle: () =>
      `Sorted by miles overdue. Pull these in before they break down on route.`,
    emptyMessage: "Nothing overdue right now.",
  },
  "in-maintenance": {
    pillLabel: "In Maintenance",
    heading: "In the shop",
    subtitle: () =>
      `Sorted by dwell time. Longest-open jobs first so you can escalate what's stuck.`,
    emptyMessage: "No buses in the shop right now.",
  },
  "road-call": {
    pillLabel: "Road Calls",
    heading: "Road-called today",
    subtitle: (n) =>
      `${n} bus${n === 1 ? "" : "es"} pulled from service today and awaiting intake.`,
    emptyMessage: "No road calls in this depot today.",
  },
};

// Helper for back-button labels when drilling from this panel into a bus
// detail. Reuses the pillLabel so copy stays in sync.
export function getBusListPillLabel(kind: BusListKind): string {
  return META[kind].pillLabel;
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
  const topRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    topRef.current
      ?.closest('[data-slot="sheet-content"]')
      ?.scrollTo(0, 0);
  }, [kind]);

  const { scope } = useDepot();
  const { workOrders } = useWorkOrders();
  const meta = META[kind];

  // WOs indexed by busId for fast lookup in row renderers.
  const worksByBus = useMemo(() => {
    const map = new Map<number, WorkOrder>();
    for (const wo of workOrders) map.set(wo.busId, wo);
    return map;
  }, [workOrders]);

  const rows = useMemo(() => {
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
  }, [kind, scope, worksByBus, workOrders]);

  return (
    <div ref={topRef} className="flex h-full flex-col p-5 pb-6 sm:p-7">
      {/* Header */}
      <div className="mb-5">
        <h2
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#222222",
            letterSpacing: "-0.03em",
            marginBottom: 4,
          }}
        >
          {meta.heading}
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#929292",
              marginLeft: 10,
              letterSpacing: "-0.02em",
            }}
          >
            {rows.length}
          </span>
        </h2>
        <p
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "#929292",
            margin: 0,
          }}
        >
          {rows.length === 0 ? meta.emptyMessage : meta.subtitle(rows.length)}
        </p>
      </div>

      {/* List */}
      {rows.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            flex: 1,
          }}
        >
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
  const garageColor = bus.garage === "north" ? "#3b82f6" : "#7c3aed";
  const garageBg = bus.garage === "north" ? "#eff6ff" : "#f5f3ff";

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-md border border-black/[0.06] bg-[#fafaf9] p-[12px_14px] transition-colors hover:bg-[#f5f5f4] hover:border-black/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 cursor-pointer"
    >
      {/* Top row: bus # + garage + kind-specific right value */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#222222",
              letterSpacing: "-0.01em",
            }}
          >
            Bus #{bus.busNumber}
          </span>
          <span
            style={{
              display: "inline-flex",
              padding: "2px 8px",
              borderRadius: 999,
              background: garageBg,
              color: garageColor,
              fontSize: 11,
              fontWeight: 600,
              textTransform: "capitalize",
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
  if (kind === "pm-due") {
    const overdueMiles = -milesUntilPm(bus);
    const isOverdue = overdueMiles > 0;
    return (
      <span
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 4,
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: isOverdue ? "#b4541a" : "#22c55e",
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.01em",
          }}
        >
          {formatNumber(Math.abs(overdueMiles))}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: isOverdue ? "#b4541a" : "#22c55e",
          }}
        >
          {isOverdue ? "mi overdue" : "mi left"}
        </span>
      </span>
    );
  }

  if (kind === "in-maintenance" && workOrder) {
    return (
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#6a6a6a",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatTimeInStatus(workOrder.stageEnteredAt)} in{" "}
        {STAGE_LABELS[workOrder.stage]}
      </span>
    );
  }

  // Running + road-call + in-maintenance without WO: show mileage as context
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 500,
        color: "#929292",
        fontVariantNumeric: "tabular-nums",
      }}
    >
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
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#b5b5b5",
          }}
        >
          In shop · no active work order logged
        </div>
      );
    }
    const sev = SEVERITY_COLORS[workOrder.severity];
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 12,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            padding: "1px 7px",
            borderRadius: 999,
            background: sev.bg,
            color: sev.text,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          <span style={{ display: "flex", color: sev.dot, width: 11, height: 11 }}>
            {SEVERITY_ICONS[workOrder.severity]}
          </span>
          {SEVERITY_LABELS[workOrder.severity]}
        </span>
        <span
          style={{
            color: "#6a6a6a",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {workOrder.issue}
        </span>
      </div>
    );
  }

  if (kind === "pm-due") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          fontWeight: 500,
          color: "#929292",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <span>{formatNumber(bus.mileage)} mi total · {bus.model}</span>
        {!workOrder && (
          <span
            style={{
              display: "inline-flex",
              padding: "1px 6px",
              borderRadius: 999,
              background: "#fff7ed",
              color: "#b4541a",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.01em",
              whiteSpace: "nowrap",
            }}
          >
            No active WO
          </span>
        )}
      </div>
    );
  }

  if (kind === "road-call") {
    return (
      <div
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "#b5b5b5",
        }}
      >
        Pulled from service · awaiting intake
      </div>
    );
  }

  // Running
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 500,
        color: "#b5b5b5",
      }}
    >
      {bus.model} · {bus.year}
    </div>
  );
}
