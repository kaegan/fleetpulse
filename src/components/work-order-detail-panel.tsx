"use client";

import { useEffect, useState } from "react";
import type { Bus, BusHistoryEntry, WorkOrder } from "@/data/types";
import {
  STAGE_LABELS,
  PARTS_STATUS_LABELS,
  BLOCK_REASON_LABELS,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  SEVERITY_ICONS,
  OUTCOME_STYLES,
  PM_INTERVAL_MILES,
} from "@/lib/constants";
import { formatNumber, milesUntilPm } from "@/lib/utils";
import { BackButton } from "@/components/back-button";
import { StagePipeline } from "@/components/stage-pipeline";
import { InfoRow, InfoGrid, MiniStat } from "@/components/ui/info-row";
import { TimeDisplay } from "@/components/time-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ResponsiveSheet,
  ResponsiveSheetContent,
  ResponsiveSheetTitle,
  ResponsiveSheetDescription,
} from "@/components/ui/responsive-sheet";

interface WorkOrderDetailPanelProps {
  order: WorkOrder | null;
  /**
   * Completed historical service entry. When provided (and `order` is null),
   * the panel renders in historical mode: outcome badge in the header,
   * Service Details grid, and an optional handoff note callout. No stage
   * pipeline or parts/bay/timeline UI.
   */
  historyEntry: BusHistoryEntry | null;
  bus: Bus | null;
  onClose: () => void;
  onOpenBus: (bus: Bus) => void;
  // Drill-down back affordance. Present only when this panel was opened
  // from another panel (e.g. a bus's active work order) — see usePanelNav.
  backLabel?: string;
  onBack?: () => void;
}

export function WorkOrderDetailPanel({
  order,
  historyEntry,
  bus,
  onClose,
  onOpenBus,
  backLabel,
  onBack,
}: WorkOrderDetailPanelProps) {
  // Snapshot the last non-null record so the sheet keeps rendering its
  // contents through the close animation after the parent clears the props.
  // Only one of displayOrder/displayHistoryEntry is non-null at a time —
  // when a new record arrives, we clear the other so the branch picks the
  // right body. We do NOT clear on double-null so the outgoing content
  // stays visible during the 320ms swap handoff.
  const [displayOrder, setDisplayOrder] = useState<WorkOrder | null>(order);
  const [displayHistoryEntry, setDisplayHistoryEntry] =
    useState<BusHistoryEntry | null>(historyEntry);
  const [displayBus, setDisplayBus] = useState<Bus | null>(bus);
  useEffect(() => {
    if (order) {
      setDisplayOrder(order);
      setDisplayHistoryEntry(null);
    } else if (historyEntry) {
      setDisplayHistoryEntry(historyEntry);
      setDisplayOrder(null);
    }
    if (bus) setDisplayBus(bus);
  }, [order, historyEntry, bus]);

  const titleText = displayOrder
    ? `Work order ${displayOrder.id} details`
    : displayHistoryEntry
      ? `Service history ${displayHistoryEntry.id} details`
      : "Work order details";

  return (
    <ResponsiveSheet
      open={Boolean(order || historyEntry)}
      onOpenChange={(open) => !open && onClose()}
    >
      <ResponsiveSheetContent side="right" className="p-0">
        <ResponsiveSheetTitle className="sr-only">
          {titleText}
        </ResponsiveSheetTitle>
        <ResponsiveSheetDescription className="sr-only">
          Issue, stage progress, assignment, timeline, and the bus this work
          order is attached to.
        </ResponsiveSheetDescription>
        {(displayOrder || displayHistoryEntry) && (
          <PanelContent
            order={displayOrder}
            historyEntry={displayHistoryEntry}
            bus={displayBus}
            onOpenBus={onOpenBus}
            backLabel={backLabel}
            onBack={onBack}
          />
        )}
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}

function PanelContent({
  order,
  historyEntry,
  bus,
  onOpenBus,
  backLabel,
  onBack,
}: {
  order: WorkOrder | null;
  historyEntry: BusHistoryEntry | null;
  bus: Bus | null;
  onOpenBus: (bus: Bus) => void;
  backLabel?: string;
  onBack?: () => void;
}) {
  // Exactly one of order / historyEntry is non-null (enforced by the
  // wrapper's snapshot effect). Pull a few shared header fields off
  // whichever record is active.
  const record = order ?? historyEntry!;
  const sev = SEVERITY_COLORS[record.severity];
  // History entries don't carry a busNumber, so fall back to the bus
  // context (always passed in alongside the entry by the drill caller).
  const busNumber = order ? order.busNumber : bus?.busNumber ?? "—";
  const outcome = historyEntry ? OUTCOME_STYLES[historyEntry.outcome] : null;

  return (
    <div className="p-5 sm:p-7">
      {onBack && backLabel && <BackButton label={backLabel} onClick={onBack} />}

      {/* ── Header: issue + meta row ───────────────────────────────────── */}
      {/* pr-11 keeps the h2 clear of the sheet close button in the top-right. */}
      <h2 className="mb-2 pr-11 text-[24px] font-bold leading-tight tracking-[-0.02em] text-foreground">
        {order.issue}
      </h2>
      <div className="mb-7 flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs font-semibold text-text-muted">
          {order.id}
        </span>
        <span className="text-xs text-text-faint">&middot;</span>
        <Badge variant="outline" className="px-2.5 py-[3px]">
          Bus #{busNumber}
        </Badge>
        <Badge
          className="px-2.5 py-[3px] gap-1"
          style={{ color: sev.text, background: sev.bg }}
        >
          <span
            className="flex h-3.5 w-3.5"
            style={{ color: sev.dot }}
          >
            {SEVERITY_ICONS[record.severity]}
          </span>
          {SEVERITY_LABELS[record.severity]}
        </Badge>
        {outcome && (
          <Badge
            className="px-2.5 py-[3px]"
            style={{ color: outcome.color, background: outcome.bg }}
          >
            {outcome.label}
          </Badge>
        )}
      </div>

      {/* ── Stage pipeline ─────────────────────────────────────────────── */}
      <div className="mb-2.5">
        <SectionPill
          label="Progress"
          color="var(--color-brand)"
          bgColor="var(--color-brand-light)"
          icon={<IconClipboardListFillDuo18 />}
        />
      </div>
      <div className="mb-2 rounded-md border border-border bg-card-hover px-[18px] pt-5 pb-[18px]">
        <StagePipeline
          currentStage={order.stage}
          severity={order.severity}
          size="lg"
        />
      </div>
      <p className="mb-[26px] pl-0.5 text-xs font-medium text-text-secondary">
        Currently <strong className="text-foreground">{STAGES[order.stage]}</strong>
        {" · "}
        <TimeDisplay isoDate={order.stageEnteredAt} /> in stage
      </p>

      {/* ── Assignment ─────────────────────────────────────────────────── */}
      <div className="mb-2.5">
        <SectionPill
          label="Assignment"
          color="var(--color-stage-in-repair)"
          bgColor="var(--color-stage-in-repair-bg)"
          icon={<IconWrenchScrewdriverFillDuo18 />}
        />
      </div>
      <InfoGrid>
        <InfoRow
          label="Mechanic"
          value={order.mechanicName ?? "Unassigned"}
          muted={!order.mechanicName}
        />
        <InfoRow
          label="Bay"
          value={order.bayNumber ? `Bay ${order.bayNumber}` : "\u2014"}
          muted={!order.bayNumber}
        />
        <InfoRow
          label="Parts"
          value={
            order.partsStatus === "available"
              ? "Ready"
              : order.partsStatus === "ordered"
                ? "On order"
                : "Not needed"
          }
          valueColor={
            order.partsStatus === "available"
              ? "var(--color-severity-routine-text)"
              : order.partsStatus === "ordered"
                ? "var(--color-severity-high-text)"
                : undefined
          }
        />
      </InfoGrid>

      {/* ── Timeline ───────────────────────────────────────────────────── */}
      <div className="mb-2.5">
        <SectionPill
          label="Timeline"
          color="var(--color-stage-intake)"
          bgColor="var(--color-stage-intake-bg)"
          icon={<IconClockRotateAnticlockwiseFillDuo18 />}
        />
      </div>
      <InfoGrid cols={2}>
        <InfoRow label="Opened" value={formatOpenedDate(order.createdAt)} />
        <InfoRow
          label="In current stage"
          valueNode={<TimeDisplay isoDate={order.stageEnteredAt} />}
        />
      </InfoGrid>

      {/* ── Bus context ────────────────────────────────────────────────── */}
      <div className="mb-2.5">
        <SectionPill
          label="Bus"
          color="var(--color-stage-diagnosing)"
          bgColor="var(--color-stage-diagnosing-bg)"
          icon={<IconBusFillDuo18 />}
        />
      </div>
      {bus ? (
        <div className="rounded-md border border-border bg-card-hover p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-lg font-bold tracking-[-0.02em] text-foreground">
              Bus #{bus.busNumber}
            </span>
            <span className="text-xs font-medium text-text-muted">
              {bus.garage === "north" ? "North Garage" : "South Garage"}
            </span>
          </div>
          <div className="mb-3.5 grid grid-cols-2 gap-3">
            <MiniStat label="Model" value={`${bus.model} ${bus.year}`} />
            <MiniStat
              label="Mileage"
              value={`${formatNumber(bus.mileage)} mi`}
            />
            <MiniStat
              label="Next PM"
              value={formatPmStatus(bus)}
              valueColor={pmColor(bus)}
            />
            <MiniStat label="Last PM" value={`${formatNumber(bus.lastPmMileage)} mi`} />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onOpenBus(bus)}
          >
            View full bus details <span aria-hidden>→</span>
          </Button>
        </div>
      ) : (
        <p className="py-3 text-[13px] font-medium text-text-faint">
          Bus record not available.
        </p>
      )}
    </div>
  );
}

// ── Formatters ────────────────────────────────────────────────────────────

function formatOpenedDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Used by HistoryEntryBody. Mirrors the formatter in bus-detail-panel.tsx
// (kept inline rather than shared — three lines, two callers, one would
// import the other otherwise).
function formatHistoryDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Compact ETA formatter for header/timeline hints. Drops the year since
// everything shown here is within the next few days.
function formatEta(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  if (sameDay) return time;
  return `${d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })} ${time}`;
}

function partsColor(status: WorkOrder["partsStatus"]): string | undefined {
  switch (status) {
    case "in-stock":
      return "#166534";
    case "ordered":
      return "#92400e";
    case "needed":
      return "#991b1b";
    case "not-needed":
    default:
      return undefined;
  }
}

function formatPmStatus(bus: Bus): string {
  const miles = milesUntilPm(bus);
  if (miles <= 0) return `${formatNumber(Math.abs(miles))} mi overdue`;
  return `${formatNumber(miles)} mi`;
}

function pmColor(bus: Bus): string {
  const miles = milesUntilPm(bus);
  const progress =
    ((bus.mileage - bus.lastPmMileage) / PM_INTERVAL_MILES) * 100;
  if (miles <= 0) return "var(--color-status-maintenance)";
  if (progress > 80) return "var(--color-status-pm-due)";
  return "var(--color-status-running)";
}
