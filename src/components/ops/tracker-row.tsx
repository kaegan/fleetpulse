"use client";

import { motion } from "framer-motion";
import type { WorkOrder } from "@/data/types";
import { STAGES, SEVERITY_COLORS, SEVERITY_LABELS } from "@/lib/constants";
import { TimeDisplay } from "@/components/time-display";

interface TrackerRowProps {
  order: WorkOrder;
  index: number;
}

export function TrackerRow({ order, index }: TrackerRowProps) {
  const sev = SEVERITY_COLORS[order.severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3, ease: "easeOut" }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "14px 18px",
        background: "#ffffff",
        borderRadius: 16,
        boxShadow:
          "0px 0px 0px 1px rgba(0,0,0,0.02), 0px 2px 6px rgba(0,0,0,0.03), 0px 4px 8px rgba(0,0,0,0.04)",
      }}
    >
      {/* Bus info */}
      <div style={{ minWidth: 80 }}>
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
        style={{
          minWidth: 180,
          fontSize: 13,
          fontWeight: 500,
          color: "#6a6a6a",
        }}
      >
        {order.issue}
      </div>

      {/* Progress pipeline — Domino's Tracker */}
      <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
        {STAGES.map((stage, idx) => {
          const isComplete = idx < order.stage;
          const isCurrent = idx === order.stage;

          return (
            <div
              key={stage}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
              }}
            >
              {/* Circle */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: index * 0.06 + idx * 0.08,
                  type: "spring",
                  stiffness: 500,
                  damping: 25,
                }}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  flexShrink: 0,
                  background: isComplete
                    ? sev.dot
                    : isCurrent
                      ? sev.bg
                      : "#f2f2f2",
                  border: isCurrent
                    ? `2px solid ${sev.border}`
                    : isComplete
                      ? "none"
                      : "1px solid rgba(0,0,0,0.08)",
                  color: isComplete
                    ? "#ffffff"
                    : isCurrent
                      ? sev.dot
                      : "#b5b5b5",
                }}
                title={stage}
              >
                {isComplete ? "✓" : idx + 1}
              </motion.div>

              {/* Connector line */}
              {idx < STAGES.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    background: isComplete ? sev.dot : "rgba(0,0,0,0.06)",
                    marginLeft: 2,
                    marginRight: 2,
                    borderRadius: 1,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Time in status */}
      <div
        style={{
          minWidth: 60,
          textAlign: "right",
          fontSize: 12,
          fontWeight: 500,
          color: "#929292",
        }}
      >
        <TimeDisplay isoDate={order.stageEnteredAt} />
      </div>

      {/* Severity badge */}
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: sev.text,
          background: sev.bg,
          padding: "3px 10px",
          borderRadius: 999,
          whiteSpace: "nowrap",
        }}
      >
        {SEVERITY_LABELS[order.severity]}
      </span>
    </motion.div>
  );
}
