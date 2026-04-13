"use client";

import { useEffect, useRef, useState } from "react";
import type { Bus, BusHistoryEntry, HistoryOutcome, WorkOrder } from "@/data/types";
import { useFleet } from "@/contexts/fleet-context";
import {
  OUTCOME_STYLES,
  STATUS_COLORS,
  STATUS_BG,
  STATUS_TEXT,
  STATUS_LABELS,
  PM_INTERVAL_MILES,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  SEVERITY_ICONS,
  STAGE_LABELS,
} from "@/lib/constants";
import { IconAlertWarningFillDuo18 } from "nucleo-ui-fill-duo-18";
import {
  formatNumber,
  milesUntilPm,
  daysBetween,
  getCrossGarageCallout,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/back-button";
import {
  ResponsiveSheet,
  ResponsiveSheetContent,
  ResponsiveSheetTitle,
  ResponsiveSheetDescription,
} from "@/components/ui/responsive-sheet";

interface BusDetailPanelProps {
  bus: Bus | null;
  onClose: () => void;
  onSelectWorkOrder?: (order: WorkOrder) => void;
  // Ops-only: when provided, the panel renders a "Schedule PM service"
  // CTA for pm-due buses. Leaving this undefined (as mechanic view does)
  // hides the CTA — role scoping without conditional logic inside the
  // panel itself.
  onSchedulePm?: (bus: Bus) => void;
  onSelectHistoryEntry?: (entry: BusHistoryEntry) => void;
  // Drill-down back affordance. Present only when this panel was opened
  // from another panel (e.g. the PM Due list) — see usePanelNav.
  backLabel?: string;
  onBack?: () => void;
}

export function BusDetailPanel({
  bus,
  onClose,
  onSelectWorkOrder,
  onSchedulePm,
  onSelectHistoryEntry,
  backLabel,
  onBack,
}: BusDetailPanelProps) {
  // Snapshot the last non-null bus so the sheet keeps rendering its contents
  // through the close animation after the parent clears `bus`.
  const [displayBus, setDisplayBus] = useState<Bus | null>(bus);
  useEffect(() => {
    if (bus) setDisplayBus(bus);
  }, [bus]);

  // Prefer the live prop when opening so we never flash a stale bus from a
  // previous session; fall back to the snapshot only during close animation.
  const renderBus = bus ?? displayBus;

  return (
    <ResponsiveSheet
      open={Boolean(bus)}
      onOpenChange={(open) => !open && onClose()}
    >
      <ResponsiveSheetContent side="right" className="p-0">
        <ResponsiveSheetTitle className="sr-only">
          {renderBus ? `Bus #${renderBus.busNumber} details` : "Bus details"}
        </ResponsiveSheetTitle>
        <ResponsiveSheetDescription className="sr-only">
          Vehicle info, preventive maintenance status, active work orders, and
          service history.
        </ResponsiveSheetDescription>
        {renderBus && (
          <BusPanelContent
            bus={renderBus}
            onSelectWorkOrder={onSelectWorkOrder}
            onSchedulePm={onSchedulePm}
            onSelectHistoryEntry={onSelectHistoryEntry}
            backLabel={backLabel}
            onBack={onBack}
          />
        )}
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}

export function BusPanelContent({
  bus,
  onSelectWorkOrder,
  onSchedulePm,
  onSelectHistoryEntry,
  backLabel,
  onBack,
}: {
  bus: Bus;
  onSelectWorkOrder?: (order: WorkOrder) => void;
  onSchedulePm?: (bus: Bus) => void;
  onSelectHistoryEntry?: (entry: BusHistoryEntry) => void;
  backLabel?: string;
  onBack?: () => void;
}) {
  // Scroll the panel back to top when content swaps in place.
  // Target the parent scroll container (SheetContent on desktop,
  // DrawerContent's scroll wrapper on mobile) instead of an inner div
  // so vaul can correctly track scrollTop for drag-vs-scroll.
  const topRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const scrollParent = topRef.current?.closest(
      '[data-slot="sheet-content"], [data-slot="drawer-scroll"]'
    );
    scrollParent?.scrollTo(0, 0);
  }, [bus.id]);

  const { workOrders, getBusHistory } = useFleet();
  const color = STATUS_COLORS[bus.status];
  const busWorkOrders = workOrders.filter((wo) => wo.busId === bus.id);
  const milesLeft = milesUntilPm(bus);
  const canSchedulePm =
    Boolean(onSchedulePm) && busWorkOrders.length === 0;
  const OVERDUE_CAP_MILES = 2_000;
  const isOverdue = milesLeft <= 0;
  const overdueMiles = Math.abs(milesLeft);
  const fullScale = isOverdue
    ? PM_INTERVAL_MILES + OVERDUE_CAP_MILES
    : PM_INTERVAL_MILES;

  const normalPct = isOverdue
    ? (PM_INTERVAL_MILES / fullScale) * 100
    : Math.min(((bus.mileage - bus.lastPmMileage) / PM_INTERVAL_MILES) * 100, 100);

  const overduePct = isOverdue
    ? (Math.min(overdueMiles, OVERDUE_CAP_MILES) / fullScale) * 100
    : 0;

  const tickPct = isOverdue
    ? (PM_INTERVAL_MILES / fullScale) * 100
    : 100;

  const normalColor = isOverdue || normalPct > 80 ? "#f59e0b" : "#22c55e";
  const history = getBusHistory(bus.id);

  return (
    <div className="flex min-h-full flex-col">
      <div ref={topRef} className="flex-1 p-5 sm:p-7">
        {onBack && backLabel && <BackButton label={backLabel} onClick={onBack} />}

      {/* Bus number */}
      <h2 className="mb-1 text-[28px] font-semibold tracking-[-0.03em] text-[#222222]">
        Bus #{bus.busNumber}
      </h2>

      {/* Status + garage */}
      <div className="mb-7 flex items-center gap-2.5">
        <span
          className="inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-[13px] font-semibold"
          style={{
            background: STATUS_BG[bus.status],
            color: STATUS_TEXT[bus.status],
          }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: color }}
          />
          {STATUS_LABELS[bus.status]}
        </span>
        <span className="text-[13px] font-medium text-[#929292]">
          {bus.garage === "north" ? "North Garage" : "South Garage"}
        </span>
      </div>

      {/* Vehicle info */}
      <h3 className="mb-2.5 text-[11px] font-semibold tracking-[0.01em] text-[#929292]">Vehicle Info</h3>
      <InfoGrid>
        <InfoRow label="Model" value={bus.model} />
        <InfoRow label="Year" value={String(bus.year)} />
        <InfoRow label="Mileage" value={`${formatNumber(bus.mileage)} mi`} />
      </InfoGrid>

      {/* PM Status */}
      <h3 className="mb-2.5 text-[11px] font-semibold tracking-[0.01em] text-[#929292]">Preventive Maintenance</h3>
      <div className="mb-6 rounded-md border border-black/[0.04] bg-[#fafaf9] p-4">
        <div className="mb-2.5 flex justify-between">
          <span className="text-[13px] font-medium text-[#6a6a6a]">
            A-Service (every {formatNumber(PM_INTERVAL_MILES)} mi)
          </span>
          <span
            className="text-[13px] font-semibold"
            style={{
              color: milesLeft <= 0 ? "#ef4444" : milesLeft < 1000 ? "#f59e0b" : "#22c55e",
            }}
          >
            {milesLeft <= 0
              ? `${formatNumber(Math.abs(milesLeft))} mi overdue`
              : `${formatNumber(milesLeft)} mi remaining`}
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative mb-2.5 h-1.5 overflow-hidden rounded-pill bg-[#f2f2f2]">
          {/* Normal interval fill */}
          <div
            className="h-full transition-[width] duration-300 ease-out"
            style={{
              width: `${normalPct}%`,
              background: normalColor,
              borderRadius: isOverdue ? "999px 0 0 999px" : "999px",
            }}
          />
          {/* Overdue extension */}
          {isOverdue && overduePct > 0 && (
            <div
              className="absolute top-0 h-full transition-[width] duration-300 ease-out"
              style={{
                left: `${normalPct}%`,
                width: `${overduePct}%`,
                background: "#ef4444",
                borderRadius: "0 999px 999px 0",
              }}
            />
          )}
          {/* Due tick mark */}
          <div
            className="absolute top-0 h-full w-0.5"
            style={{
              left: `${tickPct}%`,
              background: isOverdue ? "#f59e0b" : "#d4d4d4",
              transform: "translateX(-50%)",
            }}
          />
        </div>

        <div className="flex justify-between text-[11px] font-medium text-[#b5b5b5]">
          <span>Last service: {formatNumber(bus.lastPmMileage)} mi</span>
          <span>Due: {formatNumber(bus.nextPmDueMileage)} mi</span>
        </div>

      </div>

      {/* Active Work Orders */}
      {busWorkOrders.length > 0 && (
        <>
          <h3 className="mb-2.5 text-[11px] font-semibold tracking-[0.01em] text-[#929292]">Active Work Orders</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {busWorkOrders.map((wo) => {
              const sev = SEVERITY_COLORS[wo.severity];
              const isInteractive = Boolean(onSelectWorkOrder);
              return (
                <button
                  key={wo.id}
                  type="button"
                  onClick={
                    onSelectWorkOrder
                      ? () => onSelectWorkOrder(wo)
                      : undefined
                  }
                  disabled={!isInteractive}
                  className={
                    isInteractive
                      ? "text-left w-full rounded-md border border-black/[0.06] bg-[#fafaf9] p-[14px] transition-colors hover:bg-[#f5f5f4] hover:border-black/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 cursor-pointer"
                      : "text-left w-full rounded-md border border-black/[0.06] bg-[#fafaf9] p-[14px]"
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#222222",
                      }}
                    >
                      {wo.issue}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: sev.text,
                        background: sev.bg,
                        padding: "2px 8px",
                        borderRadius: 999,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", color: sev.dot, width: 14, height: 14, flexShrink: 0, lineHeight: 0 }}>{SEVERITY_ICONS[wo.severity]}</span>
                      {SEVERITY_LABELS[wo.severity]}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#929292",
                    }}
                  >
                    <span style={{ fontFamily: "monospace" }}>{wo.id}</span>
                    <span>{STAGE_LABELS[wo.stage]}</span>
                  </div>
                  {wo.mechanicName && (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#b5b5b5",
                      }}
                    >
                      Mechanic: {wo.mechanicName}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {busWorkOrders.length === 0 && (
        <>
          <h3 className="mb-2.5 text-[11px] font-semibold tracking-[0.01em] text-[#929292]">Work Orders</h3>
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "#b5b5b5",
              padding: "12px 0",
              marginBottom: 16,
            }}
          >
            No active work orders for this bus.
          </p>
        </>
      )}

      {/* Service History */}
      <ServiceHistorySection
        bus={bus}
        history={history}
        onSelectEntry={onSelectHistoryEntry}
      />
      </div>

      {canSchedulePm && (
        <div className="sticky bottom-0 shrink-0 border-t border-black/[0.06] bg-card px-5 py-4 sm:px-7">
          <Button
            type="button"
            onClick={() => onSchedulePm?.(bus)}
            className="w-full"
          >
            {isOverdue
              ? `${formatNumber(Math.abs(milesLeft))} mi overdue — Schedule PM service`
              : "Schedule PM service"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Service History ──────────────────────────────────────────────────────
// Solves the cross-garage JTBD: "When a bus arrives at my garage from the
// other location, I want to see everything that's been done to it."

function ServiceHistorySection({
  bus,
  history,
  onSelectEntry,
}: {
  bus: Bus;
  history: BusHistoryEntry[];
  onSelectEntry?: (entry: BusHistoryEntry) => void;
}) {
  // Cross-garage callout: show when the most recent history entry is from the
  // *other* garage and within the last 14 days. This is the JTBD hero moment.
  const callout = getCrossGarageCallout(bus, history);

  return (
    <>
      {callout && <CrossGarageCallout entry={callout.entry} />}

      <h3 className="mb-2.5 text-[11px] font-semibold tracking-[0.01em] text-[#929292]">Service History</h3>

      {history.length === 0 ? (
        <p
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "#b5b5b5",
            padding: "12px 0",
          }}
        >
          No prior service history on record for this bus.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {history.map((entry) => (
            <HistoryEntryRow
              key={entry.id}
              entry={entry}
              currentGarage={bus.garage}
              onClick={onSelectEntry}
            />
          ))}
        </div>
      )}
    </>
  );
}

function CrossGarageCallout({ entry }: { entry: BusHistoryEntry }) {
  const days = daysBetween(entry.date, new Date());
  const otherGarageLabel = entry.garage === "north" ? "North Garage" : "South Garage";
  const whenLabel =
    days === 0 ? "earlier today" : days === 1 ? "yesterday" : `${days} days ago`;

  // Lead with the fact that matters: worked on at the other garage, recently.
  const outcomeLead =
    entry.outcome === "deferred"
      ? `${entry.mechanicName} deferred this job`
      : entry.outcome === "recurring"
        ? `${entry.mechanicName} flagged a recurring issue`
        : `${entry.mechanicName} completed work`;

  return (
    <div
      style={{
        background: "#fdf0ed",
        border: "1px solid #f5c6b8",
        borderRadius: 14,
        padding: "14px 16px",
        marginBottom: 14,
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          fontSize: 18,
          lineHeight: 1,
          flexShrink: 0,
          marginTop: 1,
        }}
        aria-hidden
      >
        <IconAlertWarningFillDuo18 />
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#d4654a",
            letterSpacing: "-0.01em",
            marginBottom: 4,
          }}
        >
          Arrived from {otherGarageLabel}
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "#6a3b2a",
            lineHeight: 1.45,
          }}
        >
          Last worked on {whenLabel} at {otherGarageLabel}. {outcomeLead}
          {entry.note ? "." : ""}
          {entry.note && (
            <>
              {" "}
              <span style={{ fontStyle: "italic", color: "#8b5a44" }}>
                &ldquo;{entry.note}&rdquo;
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryEntryRow({
  entry,
  currentGarage,
  onClick,
}: {
  entry: BusHistoryEntry;
  currentGarage: Bus["garage"];
  onClick?: (entry: BusHistoryEntry) => void;
}) {
  const isOtherGarage = entry.garage !== currentGarage;
  const garageLabel = entry.garage === "north" ? "North" : "South";
  const outcome = OUTCOME_STYLES[entry.outcome];
  const isInteractive = Boolean(onClick);

  return (
    <button
      type="button"
      onClick={onClick ? () => onClick(entry) : undefined}
      disabled={!isInteractive}
      className={
        isInteractive
          ? "w-full text-left rounded-[14px] border border-black/[0.06] bg-[#fafaf9] p-[14px] transition-colors hover:bg-[#f5f5f4] hover:border-black/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 cursor-pointer"
          : "w-full text-left rounded-[14px] border border-black/[0.06] bg-[#fafaf9] p-[14px]"
      }
    >
      {/* Top row: date + garage + outcome */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#6a6a6a",
              whiteSpace: "nowrap",
            }}
          >
            {formatHistoryDate(entry.date)}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 999,
              background: isOtherGarage ? "#fdf0ed" : "#f1f5f9",
              color: isOtherGarage ? "#d4654a" : "#64748b",
              whiteSpace: "nowrap",
            }}
          >
            {garageLabel} Garage
          </span>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: outcome.color,
            background: outcome.bg,
            padding: "2px 8px",
            borderRadius: 999,
            whiteSpace: "nowrap",
          }}
        >
          {outcome.label}
        </span>
      </div>

      {/* Issue */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#222222",
          marginBottom: 4,
        }}
      >
        {entry.issue}
      </div>

      {/* Mechanic + WO id */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
          fontWeight: 500,
          color: "#929292",
        }}
      >
        <span>{entry.mechanicName}</span>
        <span style={{ fontFamily: "monospace", color: "#b5b5b5" }}>{entry.id}</span>
      </div>

      {/* Optional handoff note */}
      {entry.note && (
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: "1px solid rgba(0,0,0,0.04)",
            fontSize: 12,
            fontWeight: 500,
            fontStyle: "italic",
            color: "#6a6a6a",
            lineHeight: 1.45,
          }}
        >
          &ldquo;{entry.note}&rdquo;
        </div>
      )}
    </button>
  );
}

function formatHistoryDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="grid grid-cols-2 gap-2.5 sm:grid-cols-3"
      style={{
        marginBottom: 24,
      }}
    >
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "#fafaf9",
        borderRadius: 10,
        padding: "10px 14px",
        border: "1px solid rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: "#b5b5b5",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#222222",
          letterSpacing: "-0.01em",
        }}
      >
        {value}
      </div>
    </div>
  );
}
