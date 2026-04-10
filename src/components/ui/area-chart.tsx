"use client";

/**
 * AreaChart — sparkline-focused adaptation of Tremor Raw's AreaChart.
 *
 * Built on recharts. Renders an area + line with a vertical gradient,
 * an optional reference line target, an active hover dot, and a dark
 * tooltip pill. Tuned for the FleetPulse fleet-availability sparkline,
 * but generic enough to drop into any KPI card.
 */

import * as React from "react";
import {
  Area,
  AreaChart as RechartsAreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";

interface AreaChartProps<T> {
  data: readonly T[];
  index: keyof T & string;
  category: keyof T & string;
  /** CSS color expression — e.g. "var(--primary)" or "#22c55e" */
  color?: string;
  className?: string;
  height?: number;
  yDomain?: [number, number];
  targetValue?: number;
  targetLabel?: string;
  formatValue?: (v: number) => string;
  formatIndex?: (v: string) => string;
  /** Render the first/last index labels under the chart */
  showXAxisLabels?: boolean;
}

export function AreaChart<T>({
  data,
  index,
  category,
  color = "var(--primary)",
  className,
  height = 120,
  yDomain,
  targetValue,
  targetLabel,
  formatValue = (v) => String(v),
  formatIndex = (v) => v,
  showXAxisLabels = true,
}: AreaChartProps<T>) {
  const gradientId = React.useId();

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart
          data={data as unknown as Record<string, unknown>[]}
          margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="50%" stopColor={color} stopOpacity={0.1} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey={index as string}
            hide
            tickLine={false}
            axisLine={false}
          />
          <YAxis hide domain={yDomain ?? ["auto", "auto"]} />
          {targetValue !== undefined && (
            <ReferenceLine
              y={targetValue}
              stroke="#22c55e"
              strokeDasharray="6 4"
              strokeOpacity={0.3}
              label={{
                value: targetLabel ?? String(targetValue),
                position: "insideTopRight",
                fill: "#22c55e",
                fontSize: 10,
                fontWeight: 600,
                opacity: 0.5,
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey={category as string}
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={`url(#${gradientId})`}
            activeDot={{
              r: 4.5,
              stroke: color,
              strokeWidth: 2.5,
              fill: "#ffffff",
            }}
            isAnimationActive
            animationDuration={1000}
          />
          <RechartsTooltip
            cursor={{ stroke: color, strokeOpacity: 0.2 }}
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const point = payload[0];
              const indexValue = String(
                (point.payload as Record<string, unknown>)[index]
              );
              return (
                <div className="flex items-center gap-2 rounded-[10px] bg-[#1a1a1a] px-3 py-1.5 text-xs font-semibold text-[#e5e5e5] shadow-[0_4px_12px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,255,255,0.06)]">
                  <span className="font-normal text-[#a3a3a3]">
                    {formatIndex(indexValue)}
                  </span>
                  <span style={{ color }}>
                    {formatValue(Number(point.value))}
                  </span>
                </div>
              );
            }}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
      {showXAxisLabels && data.length > 0 && (
        <div className="mt-2 flex justify-between text-[11px] font-medium text-[#b3b3b3]">
          <span>{formatIndex(String(data[0][index]))}</span>
          <span>{formatIndex(String(data[data.length - 1][index]))}</span>
        </div>
      )}
    </div>
  );
}
