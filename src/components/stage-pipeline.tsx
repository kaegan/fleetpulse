"use client";

import { motion } from "framer-motion";
import { IconHandFillDuo18 } from "nucleo-ui-fill-duo-18";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  STAGE_ORDER,
  PIPELINE_NEUTRAL,
  STAGE_LABELS,
  getStageStates,
} from "@/lib/constants";
import { formatDurationMs, getStageDurations } from "@/lib/utils";
import type { ReactNode } from "react";
import type { Severity, StageHistoryEntry, WorkOrderStage } from "@/data/types";

interface StagePipelineProps {
  currentStage: WorkOrderStage;
  severity: Severity;
  /** Whether the WO is blocked (orthogonal held state). */
  isHeld?: boolean;
  /**
   * "sm" = 26px circles, no labels (ops tracker row)
   * "lg" = 36px circles with stage labels beneath (work order detail panel)
   */
  size?: "sm" | "lg";
  /** Spring-animate circles in on mount. Default true. */
  animated?: boolean;
  /** Extra stagger so the pipeline can cascade with surrounding animations. */
  staggerDelay?: number;
  /** Stage transition history. When provided (lg mode), per-stage dwell times
   *  are shown beneath each stage label for bottleneck visibility. */
  stageHistory?: StageHistoryEntry[];
}

// Held palette — neutral dashed treatment so it reads as blocked via
// shape language (dashed border + hand icon), not via color.
const HELD_BORDER = "#6a6a6a";
const HELD_BG = "#f5f5f5";
const HELD_TEXT = "#6a6a6a";

export function StagePipeline({
  currentStage,
  severity,
  isHeld,
  size = "sm",
  animated = true,
  staggerDelay = 0,
  stageHistory,
}: StagePipelineProps) {
  const pal = PIPELINE_NEUTRAL;
  const circleSize = size === "lg" ? 36 : 26;
  const connectorHeight = size === "lg" ? 3 : 2;
  const showLabels = size === "lg";

  const stageStates = getStageStates(currentStage, isHeld);
  const durations = showLabels && stageHistory ? getStageDurations(stageHistory) : null;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex w-full items-start">
        {stageStates.map(({ stage, state }, idx) => {
          const isLast = idx === STAGE_ORDER.length - 1;

          // ── Circle styling ──────────────────────────────────────────────
          let bg: string;
          let border: string;
          let color: string;
          let glyph: ReactNode;

          switch (state) {
            case "complete":
              bg = pal.dot;
              border = "none";
              color = "#ffffff";
              glyph = "\u2713";
              break;
            case "current":
              bg = pal.bg;
              border = `2px solid ${pal.border}`;
              color = pal.dot;
              glyph = String(idx + 1);
              break;
            case "current-held":
              bg = HELD_BG;
              border = `2px dashed ${HELD_BORDER}`;
              color = HELD_TEXT;
              glyph = <IconHandFillDuo18 style={{ width: size === "lg" ? 14 : 11, height: size === "lg" ? 14 : 11 }} />;
              break;
            case "pending":
            default:
              bg = "#f2f2f2";
              border = "1px solid rgba(0,0,0,0.08)";
              color = "#b5b5b5";
              glyph = String(idx + 1);
              break;
          }

          // ── Connector color (leads OUT of this stage to the next) ──
          // Solid when the WO has left this stage (complete or skipped).
          // "current" and "current-held" mean the WO is still here, so the
          // outgoing connector stays muted.
          const connectorSolid = state === "complete";

          // ── Label text & color ─────────────────────────────────────────
          const labelText = STAGE_LABELS[stage];
          const labelColor =
            state === "current-held"
              ? HELD_TEXT
              : state === "current"
                ? pal.text
                : state === "complete"
                  ? "#6a6a6a"
                  : "#b5b5b5"; // pending muted

          const tooltipText =
            state === "current-held"
              ? `${STAGE_LABELS[stage]} · Held`
              : STAGE_LABELS[stage];

          const circle = (
            <motion.div
              initial={animated ? { scale: 0, opacity: 0 } : false}
              animate={{ scale: 1, opacity: 1 }}
              transition={
                animated
                  ? {
                      delay: staggerDelay + idx * 0.08,
                      type: "spring",
                      stiffness: 500,
                      damping: 25,
                    }
                  : { duration: 0 }
              }
              style={{
                width: circleSize,
                height: circleSize,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: size === "lg" ? 12 : 10,
                fontWeight: 700,
                flexShrink: 0,
                background: bg,
                border,
                color,
              }}
            >
              {glyph}
            </motion.div>
          );

          return (
            <div
              key={stage}
              style={{
                // Last item takes only its circle width so there's no
                // trailing dead space at the right of the row.
                flex: isLast ? "none" : 1,
                display: "flex",
                alignItems: "flex-start",
              }}
            >
              {/* Circle column — fixed width so label text doesn't push
                  connectors narrower (the old spacing bug). */}
              <div
                style={{
                  width: circleSize,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: durations ? 4 : 8,
                  flexShrink: 0,
                }}
              >
                {showLabels ? (
                  circle
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>{circle}</TooltipTrigger>
                    <TooltipContent>{tooltipText}</TooltipContent>
                  </Tooltip>
                )}
                {showLabels && (
                  <>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: labelColor,
                        whiteSpace: "nowrap",
                        textAlign: "center",
                      }}
                    >
                      {labelText}
                    </span>
                    {durations?.has(stage) && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          fontFamily: "var(--font-mono, monospace)",
                          color: state === "current" || state === "current-held" ? "#6a6a6a" : "#929292",
                          whiteSpace: "nowrap",
                          textAlign: "center",
                        }}
                      >
                        {formatDurationMs(durations.get(stage)!)}
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Connector line — not rendered after the last circle */}
              {!isLast && (
                <div
                  style={{
                    flex: 1,
                    height: connectorHeight,
                    background: connectorSolid ? pal.dot : "rgba(0,0,0,0.06)",
                    marginLeft: 2,
                    marginRight: 2,
                    marginTop: circleSize / 2 - connectorHeight / 2,
                    borderRadius: 1,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
