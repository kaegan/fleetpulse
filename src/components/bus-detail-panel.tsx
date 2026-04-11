"use client";

import { useEffect, useState } from "react";
import type { Bus, BusHistoryEntry, HistoryOutcome } from "@/data/types";
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
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  IconBusFillDuo18,
  IconGaugeFillDuo18,
  IconClipboardListFillDuo18,
  IconClockRotateAnticlockwiseFillDuo18,
} from "nucleo-ui-fill-duo-18";

interface BusDetailPanelProps {
  bus: Bus | null;
  onClose: () => void;
}

export function BusDetailPanel({ bus, onClose }: BusDetailPanelProps) {
  // Snapshot the last non-null bus so the sheet keeps rendering its contents
  // through the close animation after the parent clears `bus`.
  const [displayBus, setDisplayBus] = useState<Bus | null>(bus);
  useEffect(() => {
    if (bus) setDisplayBus(bus);
  }, [bus]);

  return (
    <Sheet open={Boolean(bus)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="p-0">
        <SheetTitle className="sr-only">
          {displayBus ? `Bus #${displayBus.busNumber} details` : "Bus details"}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Vehicle info, preventive maintenance status, active work orders, and
          service history.
        </SheetDescription>
        {displayBus && <PanelContent bus={displayBus} />}
      </SheetContent>
    </Sheet>
  );
}

function PanelContent({ bus }: { bus: Bus }) {
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
      {/* Bus number */}
      <h2
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: "#222222",
          letterSpacing: "-0.03em",
          marginBottom: 4,
        }}
      >
        Bus #{bus.busNumber}
      </h2>

      {/* Status + garage */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 28,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            padding: "4px 12px",
            borderRadius: 999,
            background:
              bus.status === "road-call" ? "#f5f5f5" : `${color}18`,
            color:
              bus.status === "running"
                ? "#166534"
                : bus.status === "pm-due"
                  ? "#92400e"
                  : bus.status === "in-maintenance"
                    ? "#991b1b"
                    : "#222222",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: color,
            }}
          />
          {STATUS_LABELS[bus.status]}
        </span>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#929292" }}>
          {bus.garage === "north" ? "North Garage" : "South Garage"}
        </span>
      </div>

      {/* Vehicle info */}
      <div style={{ marginBottom: 10 }}>
        <SectionPill label="Vehicle Info" color="#3b82f6" bgColor="#eff6ff" icon={<IconBusFillDuo18 />} />
      </div>
      <InfoGrid>
        <InfoRow label="Model" value={bus.model} />
        <InfoRow label="Year" value={String(bus.year)} />
        <InfoRow label="Mileage" value={`${formatNumber(bus.mileage)} mi`} />
      </InfoGrid>

      {/* PM Status */}
      <div style={{ marginBottom: 10 }}>
        <SectionPill label="Preventive Maintenance" color="#f59e0b" bgColor="#fffbeb" icon={<IconGaugeFillDuo18 />} />
      </div>
      <div
        style={{
          background: "#fafaf9",
          borderRadius: 14,
          padding: 16,
          marginBottom: 24,
          border: "1px solid rgba(0,0,0,0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 500, color: "#6a6a6a" }}>
            A-Service (every {formatNumber(PM_INTERVAL_MILES)} mi)
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: milesLeft <= 0 ? "#ef4444" : milesLeft < 1000 ? "#f59e0b" : "#22c55e",
            }}
          >
            {milesLeft <= 0
              ? `${formatNumber(Math.abs(milesLeft))} mi overdue`
              : `${formatNumber(milesLeft)} mi remaining`}
          </span>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: 6,
            background: "#f2f2f2",
            borderRadius: 999,
            overflow: "hidden",
            marginBottom: 10,
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pmProgress}%`,
              background:
                pmProgress >= 100
                  ? "#ef4444"
                  : pmProgress > 80
                    ? "#f59e0b"
                    : "#22c55e",
              borderRadius: 999,
              transition: "width 0.3s ease",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            fontWeight: 500,
            color: "#b5b5b5",
          }}
        >
          <span>Last PM: {formatNumber(bus.lastPmMileage)} mi</span>
          <span>Due: {formatNumber(bus.nextPmDueMileage)} mi</span>
        </div>
      </div>

      {/* Active Work Orders */}
      {busWorkOrders.length > 0 && (
        <>
          <div style={{ marginBottom: 10 }}>
            <SectionPill label="Active Work Orders" color="#ef4444" bgColor="#fef2f2" icon={<IconClipboardListFillDuo18 />} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {busWorkOrders.map((wo) => {
              const sev = SEVERITY_COLORS[wo.severity];
              return (
                <div
                  key={wo.id}
                  style={{
                    background: "#fafaf9",
                    borderRadius: 14,
                    padding: 14,
                    border: "1px solid rgba(0,0,0,0.06)",
                  }}
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
                      color: "#929292",
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
                        color: "#b5b5b5",
                      }}
                    >
                      Assigned: {wo.mechanicName}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {busWorkOrders.length === 0 && (
        <>
          <div style={{ marginBottom: 10 }}>
            <SectionPill label="Work Orders" color="#929292" bgColor="#f5f5f5" icon={<IconClipboardListFillDuo18 />} />
          </div>
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
          color="#64748b"
          bgColor="#f1f5f9"
          icon={<IconClockRotateAnticlockwiseFillDuo18 />}
        />
      </div>

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
        ⚠️
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#d4654a",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
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
}: {
  entry: BusHistoryEntry;
  currentGarage: Bus["garage"];
}) {
  const isOtherGarage = entry.garage !== currentGarage;
  const garageLabel = entry.garage === "north" ? "North" : "South";
  const outcome = OUTCOME_STYLES[entry.outcome];

  return (
    <div
      style={{
        background: "#fafaf9",
        borderRadius: 14,
        padding: 14,
        border: "1px solid rgba(0,0,0,0.06)",
      }}
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
    </div>
  );
}

const OUTCOME_STYLES: Record<HistoryOutcome, { label: string; color: string; bg: string }> = {
  completed: { label: "Completed", color: "#166534", bg: "#f0fdf4" },
  deferred: { label: "Deferred", color: "#92400e", bg: "#fffbeb" },
  recurring: { label: "Recurring", color: "#d4654a", bg: "#fdf0ed" },
};

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
