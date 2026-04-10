"use client";

import { motion } from "framer-motion";
import type { WorkOrder } from "@/data/types";
import { SEVERITY_COLORS, SEVERITY_LABELS } from "@/lib/constants";
import { TimeDisplay } from "@/components/time-display";

interface WorkOrderCardProps {
  order: WorkOrder;
}

export function WorkOrderCard({ order }: WorkOrderCardProps) {
  const sev = SEVERITY_COLORS[order.severity];

  return (
    <motion.div
      whileHover={{
        scale: 1.015,
        boxShadow:
          "0px 0px 0px 1px rgba(0,0,0,0.04), 0px 4px 12px rgba(0,0,0,0.08), 0px 8px 16px rgba(0,0,0,0.06)",
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      style={{
        background: "#ffffff",
        borderRadius: 14,
        padding: "14px 16px",
        borderLeft: `4px solid ${sev.border}`,
        boxShadow:
          "0px 0px 0px 1px rgba(0,0,0,0.02), 0px 2px 6px rgba(0,0,0,0.04), 0px 4px 8px rgba(0,0,0,0.08)",
        cursor: "default",
      }}
    >
      {/* Top row: Bus number + time */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#222222",
            letterSpacing: "-0.02em",
          }}
        >
          Bus #{order.busNumber}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#929292",
          }}
        >
          <TimeDisplay isoDate={order.stageEnteredAt} />
        </span>
      </div>

      {/* Issue description */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "#6a6a6a",
          marginBottom: 10,
          lineHeight: 1.4,
        }}
      >
        {order.issue}
      </div>

      {/* Bottom row: WO ID + severity badge + bay */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "#b5b5b5",
            fontFamily: "monospace",
          }}
        >
          {order.id}
        </span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {order.bayNumber && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#6a6a6a",
                background: "#f2f2f2",
                padding: "2px 8px",
                borderRadius: 6,
              }}
            >
              Bay {order.bayNumber}
            </span>
          )}
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: sev.text,
              background: sev.bg,
              padding: "2px 8px",
              borderRadius: 6,
            }}
          >
            {SEVERITY_LABELS[order.severity]}
          </span>
        </div>
      </div>

      {/* Mechanic name if assigned */}
      {order.mechanicName && (
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: "1px solid rgba(0,0,0,0.04)",
            fontSize: 12,
            fontWeight: 500,
            color: "#929292",
          }}
        >
          {order.mechanicName}
        </div>
      )}
    </motion.div>
  );
}
