"use client";

import { useEffect, useState } from "react";
import type { Bus, WorkOrder } from "@/data/types";
import {
  STAGE_LABELS,
  PARTS_STATUS_LABELS,
  BLOCK_REASON_LABELS,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  SEVERITY_ICONS,
  PM_INTERVAL_MILES,
} from "@/lib/constants";
import { formatNumber, milesUntilPm } from "@/lib/utils";
import { SectionPill } from "@/components/section-pill";
import { BackButton } from "@/components/back-button";
import { StagePipeline } from "@/components/stage-pipeline";
import { TimeDisplay } from "@/components/time-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ResponsiveSheet,
  ResponsiveSheetContent,
  ResponsiveSheetTitle,
  ResponsiveSheetDescription,
} from "@/components/ui/responsive-sheet";
import {
  IconClipboardListFillDuo18,
  IconWrenchScrewdriverFillDuo18,
  IconClockRotateAnticlockwiseFillDuo18,
  IconBusFillDuo18,
} from "nucleo-ui-fill-duo-18";

interface WorkOrderDetailPanelProps {
  order: WorkOrder | null;
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
  bus,
  onClose,
  onOpenBus,
  backLabel,
  onBack,
}: WorkOrderDetailPanelProps) {
  // Snapshot the last non-null order so the sheet keeps rendering its contents
  // through the close animation after the parent clears `order` (mirrors the
  // BusDetailPanel pattern).
  const [displayOrder, setDisplayOrder] = useState<WorkOrder | null>(order);
  const [displayBus, setDisplayBus] = useState<Bus | null>(bus);
  useEffect(() => {
    if (order) setDisplayOrder(order);
    if (bus) setDisplayBus(bus);
  }, [order, bus]);

  return (
    <ResponsiveSheet
      open={Boolean(order)}
      onOpenChange={(open) => !open && onClose()}
    >
      <ResponsiveSheetContent side="right" className="p-0">
        <ResponsiveSheetTitle className="sr-only">
          {displayOrder
            ? `Work order ${displayOrder.id} details`
            : "Work order details"}
        </ResponsiveSheetTitle>
        <ResponsiveSheetDescription className="sr-only">
          Issue, stage progress, assignment, timeline, and the bus this work
          order is attached to.
        </ResponsiveSheetDescription>
        {displayOrder && (
          <PanelContent
            order={displayOrder}
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
  bus,
  onOpenBus,
  backLabel,
  onBack,
}: {
  order: WorkOrder;
  bus: Bus | null;
  onOpenBus: (bus: Bus) => void;
  backLabel?: string;
  onBack?: () => void;
}) {
  const sev = SEVERITY_COLORS[order.severity];

  return (
    <div className="p-5 sm:p-7">
      {onBack && backLabel && <BackButton label={backLabel} onClick={onBack} />}

      {/* ── Header: issue + meta row ───────────────────────────────────── */}
      {/* pr-11 keeps the h2 clear of the sheet close button in the top-right. */}
      <h2 className="mb-2 pr-11 text-[24px] font-bold leading-tight tracking-[-0.02em] text-[#222222]">
        {order.issue}
      </h2>
      <div className="mb-7 flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs font-semibold text-[#929292]">
          {order.id}
        </span>
        <span className="text-xs text-[#d4d4d4]">&middot;</span>
        <Badge variant="outline" className="px-2.5 py-[3px]">
          Bus #{order.busNumber}
        </Badge>
        <Badge
          className="px-2.5 py-[3px] gap-1"
          style={{ color: sev.text, background: sev.bg }}
        >
          <span
            className="flex h-3.5 w-3.5"
            style={{ color: sev.dot }}
          >
            {SEVERITY_ICONS[order.severity]}
          </span>
          {SEVERITY_LABELS[order.severity]}
        </Badge>
      </div>

      {/* ── Stage pipeline ─────────────────────────────────────────────── */}
      <div className="mb-2.5">
        <SectionPill
          label="Progress"
          color="#d4654a"
          bgColor="#fdf0ed"
          icon={<IconClipboardListFillDuo18 />}
        />
      </div>
      <div className="mb-2 rounded-md border border-black/[0.04] bg-[#fafaf9] px-[18px] pt-5 pb-[18px]">
        <StagePipeline
          currentStage={order.stage}
          severity={order.severity}
          size="lg"
        />
      </div>
      <p className="mb-[26px] pl-0.5 text-xs font-medium text-[#6a6a6a]">
        Currently{" "}
        <strong className="text-[#222222]">{STAGE_LABELS[order.stage]}</strong>
        {order.stage === "held" && order.blockReason && (
          <>
            {" · "}
            <span className="text-[#b4541a]">
              {BLOCK_REASON_LABELS[order.blockReason]}
            </span>
            {order.blockEta && <> · ETA {formatEta(order.blockEta)}</>}
          </>
        )}
        {order.stage === "inbound" && order.arrivalEta && (
          <> · ETA {formatEta(order.arrivalEta)}</>
        )}
        {" · "}
        <TimeDisplay isoDate={order.stageEnteredAt} /> in stage
      </p>

      {/* ── Assignment ─────────────────────────────────────────────────── */}
      <div className="mb-2.5">
        <SectionPill
          label="Assignment"
          color="#8b5cf6"
          bgColor="#f5f3ff"
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
          value={PARTS_STATUS_LABELS[order.partsStatus]}
          valueColor={partsColor(order.partsStatus)}
        />
      </InfoGrid>

      {/* ── Timeline ───────────────────────────────────────────────────── */}
      <div className="mb-2.5">
        <SectionPill
          label="Timeline"
          color="#64748b"
          bgColor="#f1f5f9"
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
          color="#3b82f6"
          bgColor="#eff6ff"
          icon={<IconBusFillDuo18 />}
        />
      </div>
      {bus ? (
        <div className="rounded-md border border-black/[0.06] bg-[#fafaf9] p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-lg font-bold tracking-[-0.02em] text-[#222222]">
              Bus #{bus.busNumber}
            </span>
            <span className="text-xs font-medium text-[#929292]">
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
        <p className="py-3 text-[13px] font-medium text-[#b5b5b5]">
          Bus record not available.
        </p>
      )}
    </div>
  );
}

// ── Local presentational helpers ─────────────────────────────────────────
// Inlined (not shared with BusDetailPanel) to keep the diff surface small.
// Consolidate in a follow-up if three+ panels end up needing them.

function InfoGrid({
  children,
  cols = 3,
}: {
  children: React.ReactNode;
  cols?: 2 | 3;
}) {
  return (
    <div
      className={
        "mb-[26px] grid grid-cols-2 gap-2.5 " +
        (cols === 3 ? "sm:grid-cols-3" : "")
      }
    >
      {children}
    </div>
  );
}

function InfoRow({
  label,
  value,
  valueNode,
  valueColor,
  muted,
}: {
  label: string;
  value?: string;
  valueNode?: React.ReactNode;
  valueColor?: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-sm border border-black/[0.04] bg-[#fafaf9] px-3.5 py-2.5">
      <div className="mb-1 text-[11px] font-medium text-[#b5b5b5]">
        {label}
      </div>
      <div
        className="text-sm font-semibold tracking-[-0.01em]"
        style={{ color: valueColor ?? (muted ? "#929292" : "#222222") }}
      >
        {valueNode ?? value}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div>
      <div className="mb-[3px] text-[10px] font-semibold uppercase tracking-[0.04em] text-[#b5b5b5]">
        {label}
      </div>
      <div
        className="text-[13px] font-semibold"
        style={{ color: valueColor ?? "#222222" }}
      >
        {value}
      </div>
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
  if (miles <= 0) return "#ef4444";
  if (progress > 80) return "#f59e0b";
  return "#22c55e";
}
