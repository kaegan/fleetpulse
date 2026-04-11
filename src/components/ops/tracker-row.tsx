"use client";

import { motion } from "framer-motion";
import type { WorkOrder } from "@/data/types";
import { SEVERITY_COLORS, SEVERITY_LABELS, SEVERITY_ICONS } from "@/lib/constants";
import { TimeDisplay } from "@/components/time-display";
import { hoursSince } from "@/lib/utils";
import { StagePipeline } from "@/components/stage-pipeline";
import { Badge } from "@/components/ui/badge";

interface TrackerRowProps {
  order: WorkOrder;
  index: number;
  onSelectWorkOrder?: (order: WorkOrder) => void;
}

// Threshold for "this has been sitting in the same stage for a while".
// 24h = subtle warmer tint, 48h = full-warmth "stuck" tag. Anything under 24h
// shows no tag so the common case stays quiet.
const AGING_SOFT_HOURS = 24;
const AGING_STUCK_HOURS = 48;

function getAgingTag(
  stageEnteredAt: string
): { label: string; color: string; bg: string } | null {
  const hours = hoursSince(stageEnteredAt);
  if (hours >= AGING_STUCK_HOURS) {
    const days = Math.floor(hours / 24);
    return {
      label: `Stuck ${days}d`,
      color: "#b4541a",
      bg: "#fff4ed",
    };
  }
  if (hours >= AGING_SOFT_HOURS) {
    return {
      label: "Aging 1d+",
      color: "#92400e",
      bg: "#fffbeb",
    };
  }
  return null;
}

const RESTING_SHADOW =
  "0px 0px 0px 1px rgba(0,0,0,0.02), 0px 2px 6px rgba(0,0,0,0.03), 0px 4px 8px rgba(0,0,0,0.04)";
const HOVER_SHADOW =
  "0px 0px 0px 1px rgba(0,0,0,0.04), 0px 4px 12px rgba(0,0,0,0.05), 0px 8px 18px rgba(0,0,0,0.05)";

export function TrackerRow({ order, index, onSelectWorkOrder }: TrackerRowProps) {
  const sev = SEVERITY_COLORS[order.severity];
  const agingTag = getAgingTag(order.stageEnteredAt);

  const handleClick = () => {
    onSelectWorkOrder?.(order);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3, ease: "easeOut" }}
      onClick={handleClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = HOVER_SHADOW;
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = RESTING_SHADOW;
        e.currentTarget.style.transform = "translateY(0)";
      }}
      data-slot="card"
      className="flex flex-col gap-3 rounded-[16px] bg-card p-3.5 lg:flex-row lg:items-center lg:gap-5 lg:p-[14px_18px]"
      style={{
        boxShadow: RESTING_SHADOW,
        cursor: onSelectWorkOrder ? "pointer" : "default",
        transition: "box-shadow 150ms ease, transform 150ms ease",
      }}
    >
      {/* Mobile-only top row: bus info + severity */}
      <div className="flex items-center justify-between gap-3 lg:hidden">
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#222222",
              letterSpacing: "-0.02em",
            }}
          >
            Bus #{order.busNumber}
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "#b5b5b5",
              fontFamily: "monospace",
            }}
          >
            {order.id}
          </div>
        </div>
        <Badge
          className="px-2.5 py-[3px] gap-1"
          style={{ color: sev.text, background: sev.bg }}
        >
          <span style={{ display: "flex", color: sev.dot, width: 14, height: 14 }}>{SEVERITY_ICONS[order.severity]}</span>
          {SEVERITY_LABELS[order.severity]}
        </Badge>
      </div>

      {/* Desktop-only: Bus info column */}
      <div className="hidden lg:block" style={{ minWidth: 80 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#222222",
            letterSpacing: "-0.02em",
          }}
        >
          Bus #{order.busNumber}
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "#b5b5b5",
            fontFamily: "monospace",
          }}
        >
          {order.id}
        </div>
      </div>

      {/* Issue */}
      <div
        className="lg:min-w-[180px]"
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "#6a6a6a",
        }}
      >
        {order.issue}
      </div>

      {/* Progress pipeline — Domino's Tracker */}
      <div className="flex items-center w-full lg:flex-1">
        <StagePipeline
          currentStage={order.stage}
          severity={order.severity}
          size="sm"
          staggerDelay={index * 0.06}
        />
      </div>

      {/* Mobile-only bottom: time in stage + aging tag */}
      <div
        className="flex items-center gap-2 lg:hidden"
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: "#929292",
        }}
      >
        <TimeDisplay isoDate={order.stageEnteredAt} />
        {agingTag && <AgingTag tag={agingTag} />}
      </div>

      {/* Desktop-only: Time in status + aging tag */}
      <div
        className="hidden items-center justify-end gap-2 lg:flex"
        style={{
          minWidth: 88,
          textAlign: "right",
          fontSize: 12,
          fontWeight: 500,
          color: "#929292",
        }}
      >
        {agingTag && <AgingTag tag={agingTag} />}
        <TimeDisplay isoDate={order.stageEnteredAt} />
      </div>

      {/* Desktop-only: Severity badge */}
      <Badge
        className="hidden lg:inline-flex px-2.5 py-[3px] gap-1"
        style={{ color: sev.text, background: sev.bg }}
      >
        <span style={{ display: "flex", color: sev.dot, width: 14, height: 14 }}>{SEVERITY_ICONS[order.severity]}</span>
        {SEVERITY_LABELS[order.severity]}
      </Badge>
    </motion.div>
  );
}

function AgingTag({
  tag,
}: {
  tag: { label: string; color: string; bg: string };
}) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-semibold leading-none whitespace-nowrap"
      style={{ color: tag.color, background: tag.bg }}
    >
      {tag.label}
    </span>
  );
}
