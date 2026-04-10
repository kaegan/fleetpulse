"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import { SectionPill } from "@/components/section-pill";

interface KpiCardProps {
  label: string;
  value: number;
  suffix?: string;
  color: string;
  isPrimary?: boolean;
  pillColor: string;
  pillBg: string;
  pillIcon?: ReactNode;
}

export function KpiCard({
  label,
  value,
  suffix = "",
  color,
  isPrimary = false,
  pillColor,
  pillBg,
  pillIcon,
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
        borderRadius: 24,
        padding: isPrimary ? "28px 32px" : "24px 28px",
        boxShadow:
          "0px 0px 0px 1px rgba(0,0,0,0.02), 0px 2px 6px rgba(0,0,0,0.03), 0px 4px 8px rgba(0,0,0,0.04)",
        flex: isPrimary ? "1.4" : "1",
      }}
    >
      <div style={{ marginBottom: isPrimary ? 20 : 14 }}>
        <SectionPill
          label={label}
          color={pillColor}
          bgColor={pillBg}
          icon={pillIcon}
        />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 4,
        }}
      >
        <motion.span
          style={{
            fontSize: isPrimary ? 72 : 40,
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
              fontSize: isPrimary ? 36 : 24,
              fontWeight: 600,
              color,
              opacity: 0.5,
            }}
          >
            {suffix}
          </span>
        )}
      </div>
      {suffix === "%" && (
        <div
          style={{
            marginTop: 20,
            height: 8,
            background: "#f2f2f2",
            borderRadius: 999,
            overflow: "hidden",
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{
              height: "100%",
              background: color,
              borderRadius: 999,
            }}
          />
        </div>
      )}
    </div>
  );
}
