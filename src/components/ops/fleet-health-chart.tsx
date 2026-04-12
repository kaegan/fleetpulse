"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { scaleLinear } from "d3-scale";
import {
  forceSimulation,
  forceX,
  forceY,
  forceCollide,
  type SimulationNodeDatum,
} from "d3-force";
import { buses } from "@/data/buses";
import type { Bus, BusStatus } from "@/data/types";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import { milesUntilPm, formatNumber } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useDepot, filterByDepot } from "@/hooks/use-depot";

interface FleetHealthChartProps {
  onBusClick: (bus: Bus) => void;
}

interface PositionedBus extends Bus {
  x: number;
  y: number;
}

const HEIGHT = 340;
const PAD_R = 32; // axis tick label clearance on the right
const PAD_L_DESKTOP = 160; // reserved for healthy-tail summary on the left
const PAD_L_MOBILE = 16; // on narrow viewports the summary renders inline below the chart
const PAD_T = 24;
const PAD_B = 56;
const CIRCLE_R = 5.2;
const MOBILE_BREAKPOINT = 640;

// Chart only plots buses in the "needs attention" range.
// Everything further left (more miles remaining) collapses into a single summary label.
// Time/wear flows left→right: fresh buses on the left, overdue buses on the right.
const X_DOMAIN_MIN = -2000;
const X_DOMAIN_MAX = 3000;
const HEALTHY_THRESHOLD = 3000;

const BUS_STATUSES: BusStatus[] = [
  "running",
  "pm-due",
  "in-maintenance",
  "road-call",
];

function computeLayout(width: number) {
  const bandY = PAD_T;
  const bandH = HEIGHT - PAD_T - PAD_B;
  const cy = bandY + bandH / 2;
  const padL = width < MOBILE_BREAKPOINT ? PAD_L_MOBILE : PAD_L_DESKTOP;

  // Domain is flipped so the scale produces mirrored positions:
  // higher milesUntilPm (healthy) → left edge, lower (overdue) → right edge.
  const xScale = scaleLinear()
    .domain([X_DOMAIN_MAX, X_DOMAIN_MIN])
    .range([padL, width - PAD_R]);

  return { bandY, bandH, cy, xScale, padL };
}

function runSimulation(
  busList: Bus[],
  xFn: (b: Bus) => number,
  centerY: number,
  bandTop: number,
  bandBottom: number
): PositionedBus[] {
  const nodes = busList.map((b) => ({
    ...b,
    x: xFn(b),
    y: centerY,
  }));

  const sim = forceSimulation(nodes as unknown as SimulationNodeDatum[])
    .force(
      "x",
      forceX<PositionedBus>((d) => xFn(d)).strength(1)
    )
    .force("y", forceY<PositionedBus>(centerY).strength(0.08))
    .force("collide", forceCollide(CIRCLE_R + 0.8).iterations(2))
    .stop();

  for (let i = 0; i < 200; i++) sim.tick();

  // Clamp y to band so extreme collisions don't spill outside
  return nodes.map((n) => ({
    ...n,
    y: Math.max(bandTop + CIRCLE_R, Math.min(bandBottom - CIRCLE_R, n.y)),
  })) as PositionedBus[];
}

export function FleetHealthChart({ onBusClick }: FleetHealthChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [hoveredBus, setHoveredBus] = useState<PositionedBus | null>(null);
  const [activeStatus, setActiveStatus] = useState<BusStatus | null>(null);
  const [hoveredStatus, setHoveredStatus] = useState<BusStatus | null>(null);
  // Depot scope is global (top-bar `DepotSwitcher` → `useDepot`), so the chart
  // follows whatever garage the user has focused without its own local pill.
  const { scope } = useDepot();

  // Measure container width (responsive)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const filteredBuses = useMemo(
    () => filterByDepot(buses, scope),
    [scope]
  );

  // Split into buses in the "action" range and the healthy tail (which we summarize).
  const { visibleBuses, healthyTailCount } = useMemo(() => {
    const visible: Bus[] = [];
    let healthy = 0;
    for (const b of filteredBuses) {
      const m = milesUntilPm(b);
      if (m > HEALTHY_THRESHOLD) {
        healthy++;
        continue;
      }
      visible.push(b);
    }
    return {
      visibleBuses: visible,
      healthyTailCount: healthy,
    };
  }, [filteredBuses]);

  const layout = useMemo(() => (width ? computeLayout(width) : null), [width]);

  const positions = useMemo<PositionedBus[]>(() => {
    if (!layout) return [];
    const xFn = (b: Bus) =>
      layout.xScale(
        Math.max(X_DOMAIN_MIN, Math.min(X_DOMAIN_MAX, milesUntilPm(b)))
      );
    return runSimulation(
      visibleBuses,
      xFn,
      layout.cy,
      layout.bandY,
      layout.bandY + layout.bandH
    );
  }, [layout, visibleBuses]);

  const highlightedStatus = hoveredStatus ?? activeStatus;

  const dueX = layout?.xScale(0) ?? 0;
  const axisY = layout ? layout.bandY + layout.bandH + 6 : 0;
  const isMobile = width !== null && width < MOBILE_BREAKPOINT;

  return (
    <Card className="rounded-lg p-5 shadow-card sm:p-6">
      {/* Header: title + caption on left, status legend on right.
          Depot filter used to live here as a local pill — it's now the
          global switcher in the top bar (`src/components/top-bar.tsx`), so
          the chart reads scope from `useDepot` and follows along. */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#222222",
              letterSpacing: "-0.01em",
              margin: 0,
              marginBottom: 3,
            }}
          >
            Fleet Health Distribution
          </h2>
          <p
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#929292",
              margin: 0,
            }}
          >
            Each dot is one bus, positioned by miles until its next preventive maintenance service.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <ToggleGroup
            type="single"
            value={activeStatus ?? ""}
            onValueChange={(v) => setActiveStatus((v || null) as BusStatus | null)}
            aria-label="Filter by status"
            className="bg-transparent gap-1 p-0"
          >
            {BUS_STATUSES.map((status) => {
              const isActive = activeStatus === status;
              const isDimmed = activeStatus !== null && activeStatus !== status;
              return (
                <ToggleGroupItem
                  key={status}
                  value={status}
                  onMouseEnter={() => setHoveredStatus(status)}
                  onMouseLeave={() => setHoveredStatus(null)}
                  aria-label={`Filter to ${STATUS_LABELS[status]}`}
                  className="rounded-full px-2.5 py-[5px] gap-1.5 text-[11px] font-medium text-[#6a6a6a] data-[state=on]:bg-[#f5f5f7] data-[state=on]:text-[#6a6a6a] data-[state=on]:shadow-none"
                  style={{
                    opacity: isDimmed ? 0.45 : 1,
                    transition: "opacity 0.15s, background 0.15s",
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      background: STATUS_COLORS[status],
                      border:
                        status === "road-call"
                          ? "1.5px solid #dc2626"
                          : "none",
                      boxSizing: "border-box",
                    }}
                  />
                  {STATUS_LABELS[status]}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        </div>
      </div>

      {/* Chart container */}
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "100%",
          height: HEIGHT,
        }}
      >
        {layout && width && (
          <svg
            width={width}
            height={HEIGHT}
            viewBox={`0 0 ${width} ${HEIGHT}`}
            style={{ display: "block", overflow: "visible" }}
          >
            {/* Overdue region shade — right of the PM Due line */}
            <rect
              x={dueX}
              y={layout.bandY - 10}
              width={width - PAD_R - dueX}
              height={layout.bandH + 18}
              fill="#f59e0b"
              fillOpacity={0.06}
            />

            {/* PM Due reference line */}
            <line
              x1={dueX}
              y1={layout.bandY - 14}
              x2={dueX}
              y2={axisY}
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
            <text
              x={dueX}
              y={layout.bandY - 20}
              fontSize={11}
              fontWeight={600}
              fill="#f59e0b"
              textAnchor="middle"
            >
              PM due
            </text>

            {/* Axis line */}
            <line
              x1={layout.padL}
              y1={axisY}
              x2={width - PAD_R}
              y2={axisY}
              stroke="#e5e5e5"
              strokeWidth={1}
            />

            {/* Axis ticks + labels — no negative numbers, use "past" / "left" */}
            {(
              [
                [-2000, "2,000", "past"],
                [-1000, "1,000", "past"],
                [0, "Due", null],
                [1000, "1,000", "left"],
                [2000, "2,000", "left"],
                [3000, "3,000", null],
              ] as const
            ).map(([v, num, suffix]) => {
              const x = layout.xScale(v);
              return (
                <g key={v}>
                  <line
                    x1={x}
                    y1={axisY}
                    x2={x}
                    y2={axisY + 5}
                    stroke="#d4d4d4"
                    strokeWidth={1}
                  />
                  <text
                    x={x}
                    y={axisY + 18}
                    fontSize={10}
                    fill="#6a6a6a"
                    textAnchor="middle"
                    fontWeight={v === 0 ? 600 : 400}
                  >
                    {num}
                  </text>
                  {suffix && (
                    <text
                      x={x}
                      y={axisY + 30}
                      fontSize={9}
                      fill="#a3a3a3"
                      textAnchor="middle"
                    >
                      mi {suffix}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Healthy tail summary — hidden on mobile, rendered as an inline
                callout below the chart instead. Sits off the LEFT edge: these
                buses have the most miles remaining before their next PM. */}
            {healthyTailCount > 0 && !isMobile && (
              <g>
                <line
                  x1={layout.padL - 10}
                  y1={layout.bandY + 8}
                  x2={layout.padL - 10}
                  y2={layout.bandY + layout.bandH - 8}
                  stroke="#e5e5e5"
                  strokeWidth={1}
                />
                <text
                  x={layout.padL - 24}
                  y={layout.cy - 16}
                  fontSize={11}
                  fontWeight={700}
                  fill="#22c55e"
                  textAnchor="end"
                  letterSpacing="0.04em"
                >
                  + {healthyTailCount}
                </text>
                <text
                  x={layout.padL - 24}
                  y={layout.cy + 1}
                  fontSize={11}
                  fontWeight={600}
                  fill="#222222"
                  textAnchor="end"
                >
                  on schedule
                </text>
                <text
                  x={layout.padL - 24}
                  y={layout.cy + 16}
                  fontSize={10}
                  fill="#929292"
                  textAnchor="end"
                >
                  3,000+ mi until PM service
                </text>
              </g>
            )}

            {/* Bus circles — staggered fade-in group (re-animates on depot scope change) */}
            <motion.g
              key={scope}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {positions.map((p) => {
                const isRoadCall = p.status === "road-call";
                const isHovered = hoveredBus?.id === p.id;
                const isDimmed =
                  highlightedStatus !== null &&
                  highlightedStatus !== p.status;
                return (
                  <circle
                    key={p.id}
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 7 : CIRCLE_R}
                    fill={STATUS_COLORS[p.status]}
                    stroke={isRoadCall ? "#dc2626" : "none"}
                    strokeWidth={isRoadCall ? 1.5 : 0}
                    style={{
                      cursor: "pointer",
                      opacity: isDimmed ? 0.12 : 1,
                      transition:
                        "opacity 0.2s ease-out, r 0.15s ease-out",
                    }}
                    onMouseEnter={() => setHoveredBus(p)}
                    onMouseLeave={() => setHoveredBus(null)}
                    onClick={() => onBusClick(p)}
                  />
                );
              })}
            </motion.g>
          </svg>
        )}

        {/* Tooltip (absolute-positioned React, not SVG).
            The outer div owns the static `translate(-50%, -100%)` that
            anchors the tooltip's bottom-center to the bus dot. The inner
            motion.div handles the enter/exit animation — we keep these on
            separate elements because framer-motion overwrites inline
            `transform` strings, which would otherwise clobber the anchor. */}
        <AnimatePresence>
          {hoveredBus && (
            <div
              style={{
                position: "absolute",
                left: hoveredBus.x,
                top: hoveredBus.y - 16,
                transform: "translate(-50%, -100%)",
                zIndex: 100,
                pointerEvents: "none",
              }}
            >
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96 }}
              transition={{ duration: 0.12 }}
              style={{
                position: "relative",
                background: "#222222",
                color: "#ffffff",
                padding: "8px 12px",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: "nowrap",
                boxShadow: "0px 4px 14px rgba(0,0,0,0.22)",
              }}
            >
              <div>Bus #{hoveredBus.busNumber}</div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.7)",
                  marginTop: 3,
                  display: "flex",
                  gap: 6,
                }}
              >
                <span>{STATUS_LABELS[hoveredBus.status]}</span>
                <span>·</span>
                <span>{formatNumber(hoveredBus.mileage)} mi</span>
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color:
                    milesUntilPm(hoveredBus) < 0
                      ? "#fbbf24"
                      : "rgba(255,255,255,0.85)",
                  marginTop: 3,
                }}
              >
                {milesUntilPm(hoveredBus) < 0
                  ? `${formatNumber(
                      Math.abs(milesUntilPm(hoveredBus))
                    )} mi overdue for PM service`
                  : `${formatNumber(milesUntilPm(hoveredBus))} mi to next PM service`}
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
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile-only: healthy-tail summary rendered inline below the chart.
          On desktop this appears as SVG text inside the plot area. */}
      {isMobile && healthyTailCount > 0 && (
        <div
          className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5"
          style={{
            background: "#f0fdf4",
            border: "1px solid #dcfce7",
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#22c55e",
              letterSpacing: "0.02em",
            }}
          >
            + {healthyTailCount}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#222222",
            }}
          >
            on schedule
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "#6a6a6a",
            }}
          >
            (3,000+ mi until PM service)
          </span>
        </div>
      )}
    </Card>
  );
}
