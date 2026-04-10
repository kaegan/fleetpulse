"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";

interface KpiCardProps {
  label: string;
  value: number;
  suffix?: string;
  color: string;
  isPrimary?: boolean;
}

export function KpiCard({
  label,
  value,
  suffix = "",
  color,
  isPrimary = false,
}: KpiCardProps) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => {
    if (suffix === "%") return latest.toFixed(1);
    return Math.round(latest).toString();
  });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!hasAnimated.current) {
      hasAnimated.current = true;
      animate(motionValue, value, {
        duration: 0.8,
        ease: "easeOut",
      });
    }
  }, [motionValue, value]);

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 20,
        padding: isPrimary ? "20px 24px" : "16px 20px",
        boxShadow:
          "0px 0px 0px 1px rgba(0,0,0,0.02), 0px 2px 6px rgba(0,0,0,0.04), 0px 4px 8px rgba(0,0,0,0.08)",
        flex: isPrimary ? "1.4" : "1",
        borderTop: isPrimary ? `3px solid ${color}` : "none",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase" as const,
          letterSpacing: "0.06em",
          color: "#929292",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 2,
        }}
      >
        <motion.span
          style={{
            fontSize: isPrimary ? 36 : 28,
            fontWeight: 700,
            color,
            letterSpacing: "-0.03em",
            lineHeight: 1,
          }}
        >
          {rounded}
        </motion.span>
        {suffix && (
          <span
            style={{
              fontSize: isPrimary ? 20 : 16,
              fontWeight: 600,
              color,
              opacity: 0.7,
            }}
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
