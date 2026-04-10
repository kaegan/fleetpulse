"use client";

import { useId, useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { scaleLinear } from "d3-scale";
import { area, line, curveMonotoneX } from "d3-shape";
import type { AvailabilityDataPoint } from "@/data/availability-history";

interface AvailabilitySparklineProps {
  data: AvailabilityDataPoint[];
  color: string;
  height?: number;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function AvailabilitySparkline({
  data,
  color,
  height = 120,
}: AvailabilitySparklineProps) {
  const gradientId = useId();
  const glowId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setChartWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      const index = Math.round(pct * (data.length - 1));
      setHoverIndex(Math.max(0, Math.min(data.length - 1, index)));
    },
    [data.length]
  );

  const handleMouseLeave = useCallback(() => setHoverIndex(null), []);

  if (data.length < 2 || chartWidth === 0) {
    return <div ref={containerRef} style={{ width: "100%", height }} />;
  }

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);

  // Y-domain: tight below data, just enough above to show 95% target line
  const domainMin = minVal - 1;
  const domainMax = 96;

  const xScale = scaleLinear()
    .domain([0, data.length - 1])
    .range([0, chartWidth]);

  const yScale = scaleLinear()
    .domain([domainMin, domainMax])
    .range([height, 0]);

  const areaGenerator = area<AvailabilityDataPoint>()
    .x((_, i) => xScale(i))
    .y0(height)
    .y1((d) => yScale(d.value))
    .curve(curveMonotoneX);

  const lineGenerator = line<AvailabilityDataPoint>()
    .x((_, i) => xScale(i))
    .y((d) => yScale(d.value))
    .curve(curveMonotoneX);

  const areaPath = areaGenerator(data) ?? "";
  const linePath = lineGenerator(data) ?? "";

  const lastX = xScale(data.length - 1);
  const lastY = yScale(data[data.length - 1].value);
  const targetY = yScale(95);

  const hoverPoint = hoverIndex !== null ? data[hoverIndex] : null;
  const hoverX = hoverIndex !== null ? xScale(hoverIndex) : 0;
  const hoverY = hoverPoint ? yScale(hoverPoint.value) : 0;

  return (
    <div style={{ position: "relative" }}>
      {/* Hover tooltip */}
      <AnimatePresence>
        {hoverIndex !== null && hoverPoint && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            style={{
              position: "absolute",
              top: -36,
              left: hoverX,
              transform: "translateX(-50%)",
              background: "#1a1a1a",
              color: "#e5e5e5",
              padding: "5px 12px",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: "nowrap",
              pointerEvents: "none",
              boxShadow:
                "0 4px 12px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.06)",
              display: "flex",
              gap: 8,
              alignItems: "center",
              zIndex: 10,
            }}
          >
            <span style={{ color: "#a3a3a3", fontWeight: 400 }}>
              {formatDate(hoverPoint.date)}
            </span>
            <span style={{ color }}>{hoverPoint.value.toFixed(1)}%</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chart */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ width: "100%", cursor: "crosshair" }}
      >
        <svg
          width={chartWidth}
          height={height}
          style={{ display: "block", overflow: "visible" }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="50%" stopColor={color} stopOpacity={0.1} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
            <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Target line at 95% */}
          <line
            x1={0}
            y1={targetY}
            x2={chartWidth}
            y2={targetY}
            stroke="#22c55e"
            strokeWidth={1}
            strokeDasharray="6 4"
            opacity={0.3}
          />
          {/* Target label pinned to right */}
          <text
            x={chartWidth - 4}
            y={targetY - 6}
            textAnchor="end"
            fill="#22c55e"
            fontSize={10}
            fontWeight={600}
            fontFamily="inherit"
            opacity={0.5}
          >
            95% target
          </text>

          {/* Area fill */}
          <motion.path
            d={areaPath}
            fill={`url(#${gradientId})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />

          {/* Glow line */}
          <motion.path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={6}
            strokeLinecap="round"
            opacity={0.12}
            filter={`url(#${glowId})`}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />

          {/* Main line */}
          <motion.path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />

          {/* Pulsing ring on current value */}
          <motion.circle
            cx={lastX}
            cy={lastY}
            r={8}
            fill="none"
            stroke={color}
            strokeWidth={2}
            initial={{ opacity: 0 }}
            animate={{
              opacity: hoverIndex !== null ? [0] : [0.4, 0],
              r: hoverIndex !== null ? [8] : [5, 14],
            }}
            transition={{
              delay: 1.1,
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
          {/* Current value dot */}
          <motion.circle
            cx={lastX}
            cy={lastY}
            r={4.5}
            fill="#fff"
            stroke={color}
            strokeWidth={2.5}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: hoverIndex !== null ? 0 : 1,
              scale: hoverIndex !== null ? 0 : 1,
            }}
            transition={{ delay: 0.9, duration: 0.25, ease: "backOut" }}
          />

          {/* Hover crosshair + dot */}
          {hoverIndex !== null && hoverPoint && (
            <>
              <line
                x1={hoverX}
                y1={0}
                x2={hoverX}
                y2={height}
                stroke={color}
                strokeWidth={1}
                opacity={0.2}
              />
              <circle
                cx={hoverX}
                cy={hoverY}
                r={10}
                fill={color}
                opacity={0.1}
              />
              <circle
                cx={hoverX}
                cy={hoverY}
                r={4.5}
                fill="#fff"
                stroke={color}
                strokeWidth={2.5}
              />
            </>
          )}
        </svg>
      </div>

      {/* Date labels */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 8,
          fontSize: 11,
          color: "#b3b3b3",
          fontWeight: 500,
        }}
      >
        <span>{formatDate(data[0].date)}</span>
        <span>{formatDate(data[data.length - 1].date)}</span>
      </div>
    </div>
  );
}
