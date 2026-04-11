"use client";

import { useEffect, useState } from "react";
import type { Bus, BusHistoryEntry, HistoryOutcome, WorkOrder } from "@/data/types";
import { workOrders } from "@/data/work-orders";
import { getBusHistory } from "@/data/bus-history";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  PM_INTERVAL_MILES,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  SEVERITY_ICONS,
  STAGES,
} from "@/lib/constants";
import {
  formatNumber,
  milesUntilPm,
  daysBetween,
  getCrossGarageCallout,
} from "@/lib/utils";
import { SectionPill } from "@/components/section-pill";
import { BackButton } from "@/components/back-button";
import { InfoRow, InfoGrid } from "@/components/ui/info-row";
import {
  ResponsiveSheet,
  ResponsiveSheetContent,
  ResponsiveSheetTitle,
  ResponsiveSheetDescription,
} from "@/components/ui/responsive-sheet";
import {
  IconBusFillDuo18,
  IconGaugeFillDuo18,
  IconClipboardListFillDuo18,
  IconClockRotateAnticlockwiseFillDuo18,
} from "nucleo-ui-fill-duo-18";

interface BusDetailPanelProps {
  bus: Bus | null;
  onClose: () => void;
  onSelectWorkOrder?: (order: WorkOrder) => void;
  // Drill-down back affordance. Present only when this panel was opened
  // from another panel (e.g. the PM Due list) — see usePanelNav.
  backLabel?: string;
  onBack?: () => void;
}

export function BusDetailPanel({
  bus,
  onClose,
  onSelectWorkOrder,
  backLabel,
  onBack,
}: BusDetailPanelProps) {
  // Snapshot the last non-null bus so the sheet keeps rendering its contents
  // through the close animation after the parent clears `bus`.
  const [displayBus, setDisplayBus] = useState<Bus | null>(bus);
  useEffect(() => {
    if (bus) setDisplayBus(bus);
  }, [bus]);

  return (
    <ResponsiveSheet
      open={Boolean(bus)}
      onOpenChange={(open) => !open && onClose()}
    >
      <ResponsiveSheetContent side="right" className="p-0">
        <ResponsiveSheetTitle className="sr-only">
          {displayBus ? `Bus #${displayBus.busNumber} details` : "Bus details"}
        </ResponsiveSheetTitle>
        <ResponsiveSheetDescription className="sr-only">
          Vehicle info, preventive maintenance status, active work orders, and
          service history.
        </ResponsiveSheetDescription>
        {displayBus && (
          <PanelContent
            bus={displayBus}
            onSelectWorkOrder={onSelectWorkOrder}
            backLabel={backLabel}
            onBack={onBack}
          />
        )}
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}

function PanelContent({
  bus,
  onSelectWorkOrder,
  backLabel,
  onBack,
}: {
  bus: Bus;
  onSelectWorkOrder?: (order: WorkOrder) => void;
  backLabel?: string;
  onBack?: () => void;
}) {
  const color = STATUS_COLORS[bus.status];
  const busWorkOrders = workOrders.filter((wo) => wo.busId === bus.id);
  const milesLeft = milesUntilPm(bus);
  const pmProgress = Math.min(
    ((bus.mileage - bus.lastPmMileage) / PM_INTERVAL_MILES) * 100,
    100
  );
  const history = getBusHistory(bus.id);

  return (
    <div className="p-5 sm:p-7">
      {onBack && backLabel && <BackButton label={backLabel} onClick={onBack} />}

      {/* Bus number */}
      <h2 className="mb-1 text-[28px] font-bold tracking-[-0.03em] text-foreground">
        Bus #{bus.busNumber}
      </h2>

      {/* Status + garage */}
      <div className="mb-7 flex items-center gap-2.5">
        <span
          className="inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-[13px] font-semibold"
          style={{
            background:
              bus.status === "road-call"
                ? "var(--color-status-roadcall-bg)"
                : bus.status === "running"
                  ? "var(--color-status-running-bg)"
                  : bus.status === "pm-due"
                    ? "var(--color-status-pm-due-bg)"
                    : "var(--color-status-maintenance-bg)",
            color:
              bus.status === "running"
                ? "var(--color-severity-routine-text)"
                : bus.status === "pm-due"
                  ? "var(--color-severity-high-text)"
                  : bus.status === "in-maintenance"
                    ? "var(--color-severity-critical-text)"
                    : "var(--color-text-primary)",
          }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: color }}
          />
          {STATUS_LABELS[bus.status]}
        </span>
        <span className="text-[13px] font-medium text-text-muted">
          {bus.garage === "north" ? "North Garage" : "South Garage"}
        </span>
      </div>

      {/* Vehicle info */}
      <div style={{ marginBottom: 10 }}>
        <SectionPill label="Vehicle Info" color="var(--color-stage-diagnosing)" bgColor="var(--color-stage-diagnosing-bg)" icon={<IconBusFillDuo18 />} />
      </div>
      <InfoGrid>
        <InfoRow label="Model" value={bus.model} />
        <InfoRow label="Year" value={String(bus.year)} />
        <InfoRow label="Mileage" value={`${formatNumber(bus.mileage)} mi`} />
      </InfoGrid>

      {/* PM Status */}
      <div style={{ marginBottom: 10 }}>
        <SectionPill label="Preventive Maintenance" color="var(--color-status-pm-due)" bgColor="var(--color-status-pm-due-bg)" icon={<IconGaugeFillDuo18 />} />
      </div>
      <div className="mb-6 rounded-md border border-border bg-card-hover p-4">
        <div className="mb-2.5 flex justify-between">
          <span className="text-[13px] font-medium text-text-secondary">
            A-Service (every {formatNumber(PM_INTERVAL_MILES)} mi)
          </span>
          <span
            className="text-[13px] font-semibold"
            style={{
              color:
                milesLeft <= 0
                  ? "var(--color-status-maintenance)"
                  : milesLeft < 1000
                    ? "var(--color-status-pm-due)"
                    : "var(--color-status-running)",
            }}
          >
            {milesLeft <= 0
              ? `${formatNumber(Math.abs(milesLeft))} mi overdue`
              : `${formatNumber(milesLeft)} mi remaining`}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-2.5 h-1.5 overflow-hidden rounded-pill bg-muted">
          <div
            className="h-full rounded-pill transition-[width] duration-300 ease-out"
            style={{
              width: `${pmProgress}%`,
              background:
                pmProgress >= 100
                  ? "var(--color-status-maintenance)"
                  : pmProgress > 80
                    ? "var(--color-status-pm-due)"
                    : "var(--color-status-running)",
            }}
          />
        </div>

        <div className="flex justify-between text-[11px] font-medium text-text-faint">
          <span>Last PM: {formatNumber(bus.lastPmMileage)} mi</span>
          <span>Due: {formatNumber(bus.nextPmDueMileage)} mi</span>
        </div>
      </div>

      {/* Active Work Orders */}
      {busWorkOrders.length > 0 && (
        <>
          <div style={{ marginBottom: 10 }}>
            <SectionPill label="Active Work Orders" color="var(--color-status-maintenance)" bgColor="var(--color-status-maintenance-bg)" icon={<IconClipboardListFillDuo18 />} />
          </div>
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
                      ? "text-left w-full rounded-md border border-border bg-card-hover p-[14px] transition-colors hover:bg-muted hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 cursor-pointer"
                      : "text-left w-full rounded-md border border-border bg-card-hover p-[14px]"
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
                        color: "var(--color-text-primary)",
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
                      <span style={{ display: "flex", color: sev.dot, width: 14, height: 14 }}>{SEVERITY_ICONS[wo.severity]}</span>
                      {SEVERITY_LABELS[wo.severity]}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      fontWeight: 500,
                      color: "var(--color-text-muted)",
                    }}
                  >
                    <span style={{ fontFamily: "monospace" }}>{wo.id}</span>
                    <span>{STAGES[wo.stage]}</span>
                  </div>
                  {wo.mechanicName && (
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 12,
                        fontWeight: 500,
                        color: "var(--color-text-faint)",
                      }}
                    >
                      Assigned: {wo.mechanicName}
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
          <div style={{ marginBottom: 10 }}>
            <SectionPill label="Work Orders" color="var(--color-text-muted)" bgColor="var(--color-surface-warm)" icon={<IconClipboardListFillDuo18 />} />
          </div>
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--color-text-faint)",
              padding: "12px 0",
              marginBottom: 16,
            }}
          >
            No active work orders for this bus.
          </p>
        </>
      )}

      {/* Service History */}
      <ServiceHistorySection bus={bus} history={history} />
    </div>
  );
}

// ── Service History ──────────────────────────────────────────────────────
// Solves the cross-garage JTBD: "When a bus arrives at my garage from the
// other location, I want to see everything that's been done to it."

function ServiceHistorySection({
  bus,
  history,
}: {
  bus: Bus;
  history: BusHistoryEntry[];
}) {
  // Cross-garage callout: show when the most recent history entry is from the
  // *other* garage and within the last 14 days. This is the JTBD hero moment.
  const callout = getCrossGarageCallout(bus, history);

  return (
    <>
      {callout && <CrossGarageCallout entry={callout.entry} />}

      <div style={{ marginBottom: 10 }}>
        <SectionPill
          label="Service History"
          color="var(--color-stage-intake)"
          bgColor="var(--color-stage-intake-bg)"
          icon={<IconClockRotateAnticlockwiseFillDuo18 />}
        />
      </div>

      {history.length === 0 ? (
        <p className="py-3 text-[13px] font-medium text-text-faint">
          No prior service history on record for this bus.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {history.map((entry) => (
            <HistoryEntryRow
              key={entry.id}
              entry={entry}
              currentGarage={bus.garage}
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

  const outcomeLead =
    entry.outcome === "deferred"
      ? `${entry.mechanicName} deferred this job`
      : entry.outcome === "recurring"
        ? `${entry.mechanicName} flagged a recurring issue`
        : `${entry.mechanicName} completed work`;

  return (
    <div className="mb-3.5 flex items-start gap-3 rounded-[14px] border border-brand/25 bg-brand-light px-4 py-3.5">
      <span className="mt-0.5 shrink-0 text-lg leading-none" aria-hidden>
        ⚠️
      </span>
      <div className="flex-1">
        <div className="mb-1 text-[12px] font-bold uppercase tracking-[0.04em] text-brand">
          Arrived from {otherGarageLabel}
        </div>
        <div className="text-[13px] font-medium leading-[1.45] text-text-secondary">
          Last worked on {whenLabel} at {otherGarageLabel}. {outcomeLead}
          {entry.note ? "." : ""}
          {entry.note && (
            <>
              {" "}
              <span className="italic text-text-muted">
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
}: {
  entry: BusHistoryEntry;
  currentGarage: Bus["garage"];
}) {
  const isOtherGarage = entry.garage !== currentGarage;
  const garageLabel = entry.garage === "north" ? "North" : "South";
  const outcome = OUTCOME_STYLES[entry.outcome];

  return (
    <div className="rounded-[14px] border border-border bg-card-hover p-3.5">
      {/* Top row: date + garage + outcome */}
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-xs font-semibold whitespace-nowrap text-text-secondary">
            {formatHistoryDate(entry.date)}
          </span>
          <span
            className="rounded-pill px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap"
            style={{
              background: isOtherGarage
                ? "var(--color-brand-light)"
                : "var(--color-stage-intake-bg)",
              color: isOtherGarage
                ? "var(--color-brand)"
                : "var(--color-stage-intake)",
            }}
          >
            {garageLabel} Garage
          </span>
        </div>
        <span
          className="rounded-pill px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap"
          style={{ color: outcome.color, background: outcome.bg }}
        >
          {outcome.label}
        </span>
      </div>

      {/* Issue */}
      <div className="mb-1 text-[13px] font-semibold text-foreground">
        {entry.issue}
      </div>

      {/* Mechanic + WO id */}
      <div className="flex justify-between text-xs font-medium text-text-muted">
        <span>{entry.mechanicName}</span>
        <span className="font-mono text-text-faint">{entry.id}</span>
      </div>

      {/* Optional handoff note */}
      {entry.note && (
        <div className="mt-2 border-t border-border pt-2 text-xs font-medium italic leading-[1.45] text-text-secondary">
          &ldquo;{entry.note}&rdquo;
        </div>
      )}
    </div>
  );
}

const OUTCOME_STYLES: Record<HistoryOutcome, { label: string; color: string; bg: string }> = {
  completed: {
    label: "Completed",
    color: "var(--color-severity-routine-text)",
    bg: "var(--color-severity-routine-bg)",
  },
  deferred: {
    label: "Deferred",
    color: "var(--color-severity-high-text)",
    bg: "var(--color-severity-high-bg)",
  },
  recurring: {
    label: "Recurring",
    color: "var(--color-brand)",
    bg: "var(--color-brand-light)",
  },
};

function formatHistoryDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

