"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Bus, BusHistoryEntry, Garage, Part, PartRequirement, WorkOrder, WorkOrderStage } from "@/data/types";
import { analytics } from "@/lib/analytics";
import { useFleet } from "@/contexts/fleet-context";
import {
  STAGE_LABELS,
  PARTS_STATUS_LABELS,
  BLOCK_REASON_LABELS,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  SEVERITY_ICONS,
  OUTCOME_STYLES,
  PM_INTERVAL_MILES,
  getCrossDepotPartsTip,
  nextStage,
  isTerminalStage,
} from "@/lib/constants";
import { formatNumber, milesUntilPm } from "@/lib/utils";
import { ACCESSIBILITY_ESCALATION_NOTICE } from "@/lib/accessibility";
import { IconPersonWheelchairFillDuo18, IconChevronRightFillDuo18 } from "nucleo-ui-fill-duo-18";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  /** When provided, the parts section shows add/remove controls. Mechanic view passes this. */
  onUpdateParts?: (woId: string, parts: PartRequirement[]) => void;
  /** When provided, the progress section shows a stage-advance button. Mechanic view passes this. */
  onStageChange?: (woId: string, newStage: WorkOrderStage) => void;
}

export function WorkOrderDetailPanel({
  order,
  historyEntry,
  bus,
  onClose,
  onOpenBus,
  backLabel,
  onBack,
  onUpdateParts,
  onStageChange,
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

  // Prefer live props when opening so we never flash stale data from a
  // previous panel session; fall back to snapshots only during close.
  const renderOrder = order ?? displayOrder;
  const renderHistoryEntry = historyEntry ?? displayHistoryEntry;
  const renderBus = bus ?? displayBus;

  const titleText = renderOrder
    ? `Work order ${renderOrder.id} details`
    : renderHistoryEntry
      ? `Service history ${renderHistoryEntry.id} details`
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
        {(renderOrder || renderHistoryEntry) && (
          <WorkOrderPanelContent
            order={renderOrder}
            historyEntry={renderHistoryEntry}
            bus={renderBus}
            onOpenBus={onOpenBus}
            backLabel={backLabel}
            onBack={onBack}
            onUpdateParts={onUpdateParts}
            onStageChange={onStageChange}
          />
        )}
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}

export function WorkOrderPanelContent({
  order,
  historyEntry,
  bus,
  onOpenBus,
  backLabel,
  onBack,
  onUpdateParts,
  onStageChange,
}: {
  order: WorkOrder | null;
  historyEntry: BusHistoryEntry | null;
  bus: Bus | null;
  onOpenBus: (bus: Bus) => void;
  backLabel?: string;
  onBack?: () => void;
  onUpdateParts?: (woId: string, parts: PartRequirement[]) => void;
  onStageChange?: (woId: string, newStage: WorkOrderStage) => void;
}) {
  // Scroll the panel back to top when content swaps in place (same panel
  // type, different record). Without this the user would land mid-scroll
  // in the new card's content. Target both desktop (SheetContent) and
  // mobile (DrawerContent scroll wrapper).
  const topRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const scrollParent = topRef.current?.closest(
      '[data-slot="sheet-content"], [data-slot="drawer-scroll"]'
    );
    scrollParent?.scrollTo(0, 0);
  }, [order?.id, historyEntry?.id]);

  // Exactly one of order / historyEntry is non-null (enforced by the
  // wrapper's snapshot effect). Pull a few shared header fields off
  // whichever record is active.
  const record = order ?? historyEntry!;
  const sev = SEVERITY_COLORS[record.severity];
  // History entries don't carry a busNumber, so fall back to the bus
  // context (always passed in alongside the entry by the drill caller).
  const busNumber = order ? order.busNumber : bus?.busNumber ?? "—";
  const outcome = historyEntry ? OUTCOME_STYLES[historyEntry.outcome] : null;
  const { completedWorkOrders } = useFleet();
  const archivedOrder = historyEntry
    ? (completedWorkOrders.find((wo) => wo.id === historyEntry.id) ?? null)
    : null;

  return (
    <div ref={topRef} className="p-5 sm:p-7">
      {onBack && backLabel && <BackButton label={backLabel} onClick={onBack} />}

      {/* ── Header: issue + meta row ───────────────────────────────────── */}
      {/* pr-11 keeps the h2 clear of the sheet close button in the top-right. */}
      <h2 className="mb-2 pr-11 text-[24px] font-semibold leading-tight tracking-[-0.02em] text-[#222222]">
        {record.issue}
      </h2>
      <div className="mb-7 flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs font-semibold text-[#929292]">
          {record.id}
        </span>
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

      {order?.autoEscalated && (
        <div
          className="flex items-start gap-2.5 rounded-[12px] border border-[#bfdbfe] px-3 py-2.5"
          style={{ background: "#eff6ff" }}
        >
          <span className="flex h-4 w-4 flex-shrink-0" style={{ marginTop: 1, color: "#1e40af" }} aria-hidden>
            <IconPersonWheelchairFillDuo18 />
          </span>
          <span className="text-[12px] font-medium leading-[1.4]" style={{ color: "#1e40af" }}>
            {ACCESSIBILITY_ESCALATION_NOTICE}
          </span>
        </div>
      )}

      {order ? (
        <ActiveWorkOrderBody order={order} onUpdateParts={onUpdateParts} onStageChange={onStageChange} />
      ) : (
        <HistoryEntryBody entry={historyEntry!} archivedOrder={archivedOrder} />
      )}

      {/* ── Bus context ────────────────────────────────────────────────── */}
      <h3 className="mb-2.5 text-[11px] font-semibold tracking-[0.01em] text-[#929292]">Bus</h3>
      {bus ? (
        <div className="rounded-md border border-black/[0.06] bg-[#fafaf9] p-4">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-lg font-semibold tracking-[-0.02em] text-[#222222]">
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
              label="Next Service"
              value={formatPmStatus(bus)}
              valueColor={pmColor(bus)}
            />
            <MiniStat label="Last Service" value={`${formatNumber(bus.lastPmMileage)} mi`} />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onOpenBus(bus)}
          >
            View full bus details <span aria-hidden style={{ display: "inline-flex", width: 14, height: 14, verticalAlign: "middle", lineHeight: 0 }}><IconChevronRightFillDuo18 /></span>
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

// ── Body branches ────────────────────────────────────────────────────────
// Sibling components keep PanelContent readable. Both rely on the local
// InfoGrid/InfoRow/MiniStat helpers below.

function ActiveWorkOrderBody({
  order,
  onUpdateParts,
  onStageChange,
}: {
  order: WorkOrder;
  onUpdateParts?: (woId: string, parts: PartRequirement[]) => void;
  onStageChange?: (woId: string, newStage: WorkOrderStage) => void;
}) {
  const next = nextStage(order.stage);
  const terminal = isTerminalStage(order.stage);
  return (
    <>
      {/* ── Stage pipeline ─────────────────────────────────────────────── */}
      <h3 className="mb-2.5 text-[11px] font-semibold tracking-[0.01em] text-[#929292]">Progress</h3>
      <div className="mb-2 rounded-md border border-black/[0.04] bg-[#fafaf9] px-[18px] pt-5 pb-[18px]">
        <StagePipeline
          currentStage={order.stage}
          severity={order.severity}
          isHeld={order.isHeld}
          size="lg"
        />
      </div>
      <p className="pl-0.5 text-xs font-medium text-[#6a6a6a]">
        Currently{" "}
        <strong className="text-[#222222]">{STAGE_LABELS[order.stage]}</strong>
        {order.isHeld && order.blockReason && (
          <>
            {" · "}
            <span className="text-[#b4541a]">
              Held · {BLOCK_REASON_LABELS[order.blockReason]}
            </span>
            {order.blockEta && <> · ETA {formatEta(order.blockEta)}</>}
            {getCrossDepotPartsTip(order.garage, order.blockReason) && (
              <>
                {" · "}
                <span className="font-semibold text-[#16a34a]">
                  {getCrossDepotPartsTip(order.garage, order.blockReason)}
                </span>
              </>
            )}
          </>
        )}
        {order.stage === "intake" && order.arrivalEta && (
          <> · ETA {formatEta(order.arrivalEta)}</>
        )}
        {" · "}
        <TimeDisplay isoDate={order.stageEnteredAt} /> in stage
      </p>
      {onStageChange && !terminal && next && (
        <div className="mt-2.5 mb-[26px]">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStageChange(order.id, next)}
          >
            Move to {STAGE_LABELS[next]} <span aria-hidden>&rarr;</span>
          </Button>
        </div>
      )}
      {!onStageChange && <div className="mb-[26px]" />}

      {/* ── Assignment ─────────────────────────────────────────────────── */}
      <h3 className="mb-2.5 text-[11px] font-semibold tracking-[0.01em] text-[#929292]">Assignment</h3>
      <InfoGrid>
        <InfoRow
          label="Assigned Mechanic"
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

      {/* ── Parts Required ─────────────────────────────────────────────── */}
      <PartsRequiredSection order={order} onUpdateParts={onUpdateParts} />

      {/* ── Timeline ───────────────────────────────────────────────────── */}
      <h3 className="mb-2.5 text-[11px] font-semibold tracking-[0.01em] text-[#929292]">Timeline</h3>
      <InfoGrid cols={2}>
        <InfoRow label="Opened" value={formatOpenedDate(order.createdAt)} />
        <InfoRow
          label="In current stage"
          valueNode={<TimeDisplay isoDate={order.stageEnteredAt} />}
        />
      </InfoGrid>
    </>
  );
}

function HistoryEntryBody({
  entry,
  archivedOrder,
}: {
  entry: BusHistoryEntry;
  archivedOrder: WorkOrder | null;
}) {
  return (
    <>
      {/* ── Service Details ────────────────────────────────────────────── */}
      <h3 className="mb-2.5 text-[11px] font-semibold tracking-[0.01em] text-[#929292]">Service Details</h3>
      <InfoGrid>
        <InfoRow label="Mechanic" value={entry.mechanicName} />
        <InfoRow
          label="Garage"
          value={entry.garage === "north" ? "North" : "South"}
        />
        <InfoRow label="Completed" value={formatHistoryDate(entry.date)} />
      </InfoGrid>

      {/* ── Handoff note (optional) ────────────────────────────────────── */}
      {entry.note && (
        <>
          <h3 className="mb-2.5 text-[11px] font-semibold tracking-[0.01em] text-[#929292]">Handoff Note</h3>
          <div className="mb-[26px] rounded-md border border-black/[0.06] bg-[#fafaf9] px-4 py-3.5">
            <p className="text-[13px] font-medium italic leading-[1.5] text-[#6a6a6a]">
              &ldquo;{entry.note}&rdquo;
            </p>
          </div>
        </>
      )}

      {archivedOrder && (
        <>
          <PartsRequiredSection order={archivedOrder} />

          <h3 className="mb-2.5 text-[11px] font-semibold tracking-[0.01em] text-[#929292]">Original Timeline</h3>
          <InfoGrid cols={2}>
            <InfoRow label="Opened" value={formatOpenedDate(archivedOrder.createdAt)} />
            <InfoRow label="Completed" value={formatOpenedDate(archivedOrder.stageEnteredAt)} />
          </InfoGrid>
        </>
      )}
    </>
  );
}

// ── Parts Required section ───────────────────────────────────────────────

function PartsRequiredSection({
  order,
  onUpdateParts,
}: {
  order: WorkOrder;
  onUpdateParts?: (woId: string, parts: PartRequirement[]) => void;
}) {
  const { parts: partsCatalog } = useFleet();
  const parts = order.parts ?? [];
  if (parts.length === 0 && !onUpdateParts) return null;

  const handleRemove = (partId: string) => {
    onUpdateParts?.(order.id, parts.filter((p) => p.partId !== partId));
  };

  const handleAdd = (partId: string) => {
    const catalogEntry = partsCatalog.find((p) => p.id === partId);
    if (!catalogEntry) return;
    analytics.woPartAdded(order.id, catalogEntry.id, catalogEntry.name);
    onUpdateParts?.(order.id, [
      ...parts,
      { partId: catalogEntry.id, partName: catalogEntry.name, qty: 1 },
    ]);
  };

  const handleRequestTransfer = (partId: string) => {
    const req = parts.find((p) => p.partId === partId);
    if (!req) return;
    const otherGarage = order.garage === "north" ? "South" : "North";
    analytics.partsTransferRequested(order.id, req.partId, req.partName, req.qty);
    onUpdateParts?.(
      order.id,
      parts.map((p) =>
        p.partId === partId ? { ...p, transferRequested: true } : p
      )
    );
    toast(
      <span>
        Transfer requested &mdash; <strong>{req.partName}</strong> &times;{req.qty} from {otherGarage} Garage
      </span>
    );
  };

  // Parts from catalog not already on this WO.
  const availableToAdd = partsCatalog.filter(
    (cp) => !parts.some((p) => p.partId === cp.id)
  );

  return (
    <>
      <h3 className="mb-2.5 text-[11px] font-semibold tracking-[0.01em] text-[#929292]">
        Assigned Parts
      </h3>
      <div className="mb-[26px] rounded-md border border-black/[0.06] bg-[#fafaf9]">
        {parts.length > 0 ? (
          <div className="divide-y divide-black/[0.04]">
            {parts.map((req) => (
              <PartRow
                key={req.partId}
                req={req}
                garage={order.garage}
                catalogPart={
                  partsCatalog.find((part) => part.id === req.partId) ?? null
                }
                editable={!!onUpdateParts}
                onRemove={() => handleRemove(req.partId)}
                onRequestTransfer={
                  onUpdateParts
                    ? () => handleRequestTransfer(req.partId)
                    : undefined
                }
              />
            ))}
          </div>
        ) : (
          <p className="px-3.5 py-3 text-[13px] font-medium text-[#b5b5b5]">
            No parts logged yet.
          </p>
        )}
        {onUpdateParts && availableToAdd.length > 0 && (
          <div className="border-t border-black/[0.04] px-3.5 py-2.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="text-[12px] font-semibold text-[#929292] transition-colors hover:text-[#b4541a]"
                >
                  + Add part
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
                {availableToAdd.map((cp) => (
                  <DropdownMenuItem key={cp.id} onClick={() => handleAdd(cp.id)}>
                    {cp.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </>
  );
}

function PartRow({
  req,
  garage,
  catalogPart,
  editable,
  onRemove,
  onRequestTransfer,
}: {
  req: PartRequirement;
  garage: Garage;
  catalogPart: Part | null;
  editable: boolean;
  onRemove: () => void;
  onRequestTransfer?: () => void;
}) {
  const garageStock = catalogPart
    ? garage === "north"
      ? catalogPart.stockNorth
      : catalogPart.stockSouth
    : null;

  const sufficient = garageStock !== null && garageStock >= req.qty;
  const stockLabel =
    garageStock === null
      ? "Unknown"
      : garageStock === 0
        ? "Out of stock"
        : sufficient
          ? `${garageStock} in stock`
          : `${garageStock} left`;
  const stockColor =
    garageStock === null
      ? "#929292"
      : garageStock === 0
        ? "#991b1b"
        : sufficient
          ? "#166534"
          : "#92400e";

  // Cross-depot availability: show when local stock is insufficient
  const otherGarageStock = catalogPart
    ? garage === "north"
      ? catalogPart.stockSouth
      : catalogPart.stockNorth
    : null;
  const otherGarageName = garage === "north" ? "South" : "North";
  const otherHasStock =
    otherGarageStock !== null && otherGarageStock > 0 && !sufficient;

  return (
    <div className="px-3.5 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[13px] font-semibold text-[#222222]">
            {req.partName}
          </span>
          <span className="ml-1.5 text-[12px] font-medium text-[#929292]">
            &times;{req.qty}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className="text-[12px] font-semibold"
            style={{ color: stockColor }}
          >
            {stockLabel}
          </span>
          {editable && (
            <button
              type="button"
              onClick={onRemove}
              className="flex h-5 w-5 items-center justify-center rounded-full text-[#b5b5b5] transition-colors hover:bg-[#fef2f2] hover:text-[#991b1b]"
              aria-label={`Remove ${req.partName}`}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>
      {otherHasStock && (
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="text-[12px] font-medium text-[#16a34a]">
            {otherGarageStock} at {otherGarageName} Garage
          </span>
          {onRequestTransfer && !req.transferRequested && (
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2.5 text-[11px] font-semibold"
              onClick={onRequestTransfer}
            >
              Request Transfer
            </Button>
          )}
          {req.transferRequested && (
            <span className="text-[11px] font-semibold text-[#92400e]">
              Transfer requested
            </span>
          )}
        </div>
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
      <div className="mb-[3px] text-[11px] font-medium text-[#929292]">
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
  if (miles <= 0) return "#ef4444";
  if (progress > 80) return "#f59e0b";
  return "#22c55e";
}
