"use client";

import { useEffect, useMemo, useRef } from "react";
import type { WorkOrder } from "@/data/types";
import { useFleet } from "@/contexts/fleet-context";
import { filterByDepot, useDepot } from "@/hooks/use-depot";
import {
  BLOCK_REASON_LABELS,
  HELD_PILL,
  SEVERITY_COLORS,
  SEVERITY_ICONS,
  SEVERITY_LABELS,
  getCrossDepotPartsTip,
} from "@/lib/constants";
import { formatTimeInStatus } from "@/lib/utils";

interface HeldRepairsPanelProps {
  onSelectWorkOrder: (wo: WorkOrder) => void;
}

function formatShortEta(iso: string): string {
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
  const day = d.toLocaleDateString("en-US", { weekday: "short" });
  return `${day} ${time}`;
}

export function HeldRepairsPanelContent({
  onSelectWorkOrder,
}: HeldRepairsPanelProps) {
  const topRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    topRef.current
      ?.closest('[data-slot="sheet-content"]')
      ?.scrollTo(0, 0);
  }, []);

  const { scope } = useDepot();
  const { workOrders } = useFleet();

  const rows = useMemo(() => {
    const held = workOrders.filter((wo) => wo.isHeld);
    const scoped = filterByDepot(held, scope);
    // Longest time in shop first (oldest createdAt)
    return [...scoped].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [workOrders, scope]);

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
          Repairs on hold
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
          {rows.length === 0
            ? "No repairs are currently on hold. All clear."
            : "Sorted by time in shop. These repairs are blocked — unstick them by checking parts ETAs or escalating."}
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
          {rows.map((wo) => (
            <HeldWoRow
              key={wo.id}
              wo={wo}
              onClick={() => onSelectWorkOrder(wo)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HeldWoRow({
  wo,
  onClick,
}: {
  wo: WorkOrder;
  onClick: () => void;
}) {
  const sev = SEVERITY_COLORS[wo.severity];

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-md border border-black/[0.06] bg-[#fafaf9] p-[12px_14px] transition-colors hover:bg-[#f5f5f4] hover:border-black/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 cursor-pointer"
    >
      {/* Top row: bus # + garage + dwell time */}
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
            Bus #{wo.busNumber}
          </span>
          <span
            style={{
              display: "inline-flex",
              padding: "2px 8px",
              borderRadius: 999,
              background: "#f5f5f5",
              color: "#6a6a6a",
              fontSize: 11,
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          >
            {wo.garage}
          </span>
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#6a6a6a",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatTimeInStatus(wo.createdAt)} in shop
        </span>
      </div>

      {/* Second row: severity + issue */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 12,
          marginBottom: 4,
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
            {SEVERITY_ICONS[wo.severity]}
          </span>
          {SEVERITY_LABELS[wo.severity]}
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
          {wo.issue}
        </span>
      </div>

      {/* Third row: block reason + ETA */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
        }}
      >
        {wo.blockReason && (
          <span
            style={{
              display: "inline-flex",
              padding: "1px 7px",
              borderRadius: 999,
              background: HELD_PILL.bg,
              color: HELD_PILL.color,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {BLOCK_REASON_LABELS[wo.blockReason]}
          </span>
        )}
        {wo.blockEta && (
          <span
            style={{
              color: "#929292",
              fontWeight: 500,
            }}
          >
            ETA {formatShortEta(wo.blockEta)}
          </span>
        )}
        {getCrossDepotPartsTip(wo.garage, wo.blockReason) && (
          <span
            style={{
              color: "#16a34a",
              fontWeight: 600,
              fontSize: 11,
            }}
          >
            {getCrossDepotPartsTip(wo.garage, wo.blockReason)}
          </span>
        )}
      </div>
    </button>
  );
}
