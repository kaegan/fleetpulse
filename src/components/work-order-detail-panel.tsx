"use client";

import { useEffect, useState } from "react";
import type { Bus, WorkOrder } from "@/data/types";
import {
  STAGES,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  SEVERITY_ICONS,
  PM_INTERVAL_MILES,
} from "@/lib/constants";
import { formatNumber, milesUntilPm } from "@/lib/utils";
import { SectionPill } from "@/components/section-pill";
import { StagePipeline } from "@/components/stage-pipeline";
import { TimeDisplay } from "@/components/time-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
}

export function WorkOrderDetailPanel({
  order,
  bus,
  onClose,
  onOpenBus,
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
    <Sheet open={Boolean(order)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="p-0">
        <SheetTitle className="sr-only">
          {displayOrder
            ? `Work order ${displayOrder.id} details`
            : "Work order details"}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Issue, stage progress, assignment, timeline, and the bus this work
          order is attached to.
        </SheetDescription>
        {displayOrder && (
          <PanelContent
            order={displayOrder}
            bus={displayBus}
            onOpenBus={onOpenBus}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function PanelContent({
  order,
  bus,
  onOpenBus,
}: {
  order: WorkOrder;
  bus: Bus | null;
  onOpenBus: (bus: Bus) => void;
}) {
  const sev = SEVERITY_COLORS[order.severity];

  return (
    <div className="p-5 sm:p-7">
      {/* ── Header: issue + meta row ───────────────────────────────────── */}
      <h2
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: "#222222",
          letterSpacing: "-0.02em",
          marginBottom: 8,
          lineHeight: 1.2,
          paddingRight: 44, // keep clear of the sheet close button
        }}
      >
        {order.issue}
      </h2>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 28,
        }}
      >
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 12,
            fontWeight: 600,
            color: "#929292",
          }}
        >
          {order.id}
        </span>
        <span style={{ fontSize: 12, color: "#d4d4d4" }}>&middot;</span>
        <Badge variant="outline" className="px-2.5 py-[3px]">
          Bus #{order.busNumber}
        </Badge>
        <Badge
          className="px-2.5 py-[3px] gap-1"
          style={{ color: sev.text, background: sev.bg }}
        >
          <span
            style={{
              display: "flex",
              color: sev.dot,
              width: 14,
              height: 14,
            }}
          >
            {SEVERITY_ICONS[order.severity]}
          </span>
          {SEVERITY_LABELS[order.severity]}
        </Badge>
      </div>

      {/* ── Stage pipeline ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 10 }}>
        <SectionPill
          label="Progress"
          color="#d4654a"
          bgColor="#fdf0ed"
          icon={<IconClipboardListFillDuo18 />}
        />
      </div>
      <div
        style={{
          background: "#fafaf9",
          borderRadius: 14,
          padding: "20px 18px 18px",
          marginBottom: 8,
          border: "1px solid rgba(0,0,0,0.04)",
        }}
      >
        <StagePipeline
          currentStage={order.stage}
          severity={order.severity}
          size="lg"
        />
      </div>
      <p
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "#6a6a6a",
          marginBottom: 26,
          paddingLeft: 2,
        }}
      >
        Currently <strong style={{ color: "#222222" }}>{STAGES[order.stage]}</strong>
        {" · "}
        <TimeDisplay isoDate={order.stageEnteredAt} /> in stage
      </p>

      {/* ── Assignment ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 10 }}>
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
          value={
            order.partsStatus === "available"
              ? "Ready"
              : order.partsStatus === "ordered"
                ? "On order"
                : "Not needed"
          }
          valueColor={
            order.partsStatus === "available"
              ? "#166534"
              : order.partsStatus === "ordered"
                ? "#92400e"
                : undefined
          }
        />
      </InfoGrid>

      {/* ── Timeline ───────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 10 }}>
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
      <div style={{ marginBottom: 10 }}>
        <SectionPill
          label="Bus"
          color="#3b82f6"
          bgColor="#eff6ff"
          icon={<IconBusFillDuo18 />}
        />
      </div>
      {bus ? (
        <div
          style={{
            background: "#fafaf9",
            borderRadius: 14,
            padding: 16,
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#222222",
                letterSpacing: "-0.02em",
              }}
            >
              Bus #{bus.busNumber}
            </span>
            <span style={{ fontSize: 12, fontWeight: 500, color: "#929292" }}>
              {bus.garage === "north" ? "North Garage" : "South Garage"}
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 14,
            }}
          >
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
        <p
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "#b5b5b5",
            padding: "12px 0",
          }}
        >
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
        cols === 2
          ? "grid grid-cols-2 gap-2.5"
          : "grid grid-cols-2 gap-2.5 sm:grid-cols-3"
      }
      style={{ marginBottom: 26 }}
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
          color: valueColor ?? (muted ? "#929292" : "#222222"),
          letterSpacing: "-0.01em",
        }}
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
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: "#b5b5b5",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: valueColor ?? "#222222",
        }}
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
