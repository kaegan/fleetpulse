"use client";

import { motion } from "framer-motion";
import type { WorkOrder } from "@/data/types";

interface BayCardProps {
  bayNumber: number;
  occupant: WorkOrder | null;
}

export function BayCard({ bayNumber, occupant }: BayCardProps) {
  const isOpen = !occupant;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      style={{
        flex: "1 1 0",
        minWidth: 110,
        padding: "12px 14px",
        borderRadius: 14,
        background: isOpen ? "#f0fdf4" : "#ffffff",
        border: isOpen ? "1px solid #dcfce7" : "1px solid rgba(0,0,0,0.06)",
        boxShadow: isOpen
          ? "none"
          : "0px 0px 0px 1px rgba(0,0,0,0.02), 0px 2px 6px rgba(0,0,0,0.04), 0px 4px 8px rgba(0,0,0,0.08)",
        textAlign: "center",
        cursor: "default",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase" as const,
          letterSpacing: "0.06em",
          color: "#929292",
          marginBottom: 4,
        }}
      >
        Bay {bayNumber}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: isOpen ? "#22c55e" : "#222222",
          letterSpacing: "-0.01em",
        }}
      >
        {isOpen ? "Open" : `#${occupant.busNumber}`}
      </div>
    </motion.div>
  );
}
