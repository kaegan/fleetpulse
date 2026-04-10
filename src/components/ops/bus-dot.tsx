"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Bus } from "@/data/types";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";

interface BusDotProps {
  bus: Bus;
  onClick: (bus: Bus) => void;
}

export function BusDot({ bus, onClick }: BusDotProps) {
  const [hovered, setHovered] = useState(false);
  const dotRef = useRef<HTMLDivElement>(null);

  const color = STATUS_COLORS[bus.status];
  const isRoadCall = bus.status === "road-call";

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <motion.div
        ref={dotRef}
        whileHover={{ scale: 1.8, zIndex: 10 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        onClick={() => onClick(bus)}
        style={{
          width: 14,
          height: 14,
          borderRadius: 3,
          background: color,
          opacity: isRoadCall ? 1 : 0.85,
          border: isRoadCall ? "1.5px solid #ef4444" : "none",
          cursor: "pointer",
          position: "relative",
        }}
      />

      {/* Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              left: "50%",
              transform: "translateX(-50%)",
              background: "#222222",
              color: "#ffffff",
              padding: "6px 10px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: "nowrap",
              zIndex: 100,
              boxShadow: "0px 4px 12px rgba(0,0,0,0.2)",
              pointerEvents: "none",
            }}
          >
            <div>Bus #{bus.busNumber}</div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "rgba(255,255,255,0.7)",
                marginTop: 2,
              }}
            >
              {STATUS_LABELS[bus.status]}
            </div>
            {/* Arrow */}
            <div
              style={{
                position: "absolute",
                bottom: -4,
                left: "50%",
                transform: "translateX(-50%) rotate(45deg)",
                width: 8,
                height: 8,
                background: "#222222",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
