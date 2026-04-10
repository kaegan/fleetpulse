"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import { SectionPill } from "@/components/section-pill";
import { Card } from "@/components/ui/card";
import { AreaChart } from "@/components/ui/area-chart";
import type { AvailabilityDataPoint } from "@/data/availability-history";

interface KpiCardProps {
  label: string;
  value: number;
  suffix?: string;
  color: string;
  isPrimary?: boolean;
  pillColor: string;
  pillBg: string;
  pillIcon?: ReactNode;
  forecast?: number;
  sparklineData?: AvailabilityDataPoint[];
}

function formatSparkDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
  forecast,
  sparklineData,
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

  // Tight Y domain for sparkline: just under the lowest point, just above 95% target.
  const sparkDomain = useMemo<[number, number] | undefined>(() => {
    if (!sparklineData || sparklineData.length === 0) return undefined;
    const minVal = Math.min(...sparklineData.map((d) => d.value));
    return [minVal - 1, 96];
  }, [sparklineData]);

  return (
    <Card
      className={
        "rounded-[24px] shadow-card " +
        (isPrimary
          ? "p-5 sm:p-6 md:p-[28px_32px]"
          : "p-4 sm:p-5 md:p-[24px_28px]")
      }
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
          className={
            isPrimary
              ? "text-5xl sm:text-6xl md:text-[72px]"
              : "text-[32px] sm:text-[36px] md:text-[40px]"
          }
          style={{
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
            className={
              isPrimary
                ? "text-2xl sm:text-3xl md:text-[36px]"
                : "text-lg sm:text-xl md:text-[24px]"
            }
            style={{
              fontWeight: 600,
              color,
              opacity: 0.5,
            }}
          >
            {suffix}
          </span>
        )}
      </div>
      {sparklineData ? (
        <div style={{ marginTop: 20, paddingTop: 24 }}>
          <AreaChart
            data={sparklineData}
            index="date"
            category="value"
            color={color}
            height={120}
            yDomain={sparkDomain}
            targetValue={95}
            targetLabel="95% target"
            formatValue={(v) => `${v.toFixed(1)}%`}
            formatIndex={formatSparkDate}
          />
        </div>
      ) : suffix === "%" ? (
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
      ) : null}
      {forecast !== undefined && (
        <div
          style={{
            marginTop: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "#6a6a6a",
            }}
          >
            Tomorrow (est.)
          </span>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: forecast > value ? "#22c55e" : "#6a6a6a",
            }}
          >
            {forecast.toFixed(1)}%
          </span>
          {forecast > value && (
            <span style={{ fontSize: 13, color: "#22c55e", fontWeight: 600 }}>
              +{(forecast - value).toFixed(1)}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
