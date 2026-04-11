"use client";

import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PIPELINE_STAGES,
  SEVERITY_COLORS,
  STAGE_LABELS,
  pipelineStageFor,
} from "@/lib/constants";
import type { Severity, WorkOrderStage } from "@/data/types";

interface StagePipelineProps {
  currentStage: WorkOrderStage;
  severity: Severity;
  /**
   * "sm" = 26px circles, no labels (ops tracker row)
   * "lg" = 36px circles with stage labels beneath (work order detail panel)
   */
  size?: "sm" | "lg";
  /** Spring-animate circles in on mount. Default true. */
  animated?: boolean;
  /** Extra stagger so the pipeline can cascade with surrounding animations. */
  staggerDelay?: number;
}

export function StagePipeline({
  currentStage,
  severity,
  size = "sm",
  animated = true,
  staggerDelay = 0,
}: StagePipelineProps) {
  const sev = SEVERITY_COLORS[severity];
  const circleSize = size === "lg" ? 36 : 26;
  const connectorHeight = size === "lg" ? 3 : 2;
  const showLabels = size === "lg";

  // Held is a detour — collapse it to its originating phase (Diagnosing)
  // for dot positioning and render a held decoration on that dot.
  const displayStage = pipelineStageFor(currentStage);
  const currentIdx = PIPELINE_STAGES.indexOf(displayStage);
  const isHeld = currentStage === "held";
  // Warmer slate for the held state so it's visually distinct from active severity color.
  const heldBorder = "#b4541a";
  const heldBg = "#fff4ed";
  const heldDot = "#b4541a";
  const heldText = "#b4541a";

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex w-full items-start">
        {PIPELINE_STAGES.map((stage, idx) => {
          const isComplete = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const currentIsHeld = isCurrent && isHeld;

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
                background: isComplete
                  ? sev.dot
                  : currentIsHeld
                    ? heldBg
                    : isCurrent
                      ? sev.bg
                      : "#f2f2f2",
                border: currentIsHeld
                  ? `2px dashed ${heldBorder}`
                  : isCurrent
                    ? `2px solid ${sev.border}`
                    : isComplete
                      ? "none"
                      : "1px solid rgba(0,0,0,0.08)",
                color: isComplete
                  ? "#ffffff"
                  : currentIsHeld
                    ? heldDot
                    : isCurrent
                      ? sev.dot
                      : "#b5b5b5",
              }}
            >
              {isComplete ? "\u2713" : currentIsHeld ? "\u23F8" : idx + 1}
            </motion.div>
          );

          const labelText = showLabels && currentIsHeld ? "Held" : STAGE_LABELS[stage];
          const tooltipText = currentIsHeld ? `Held · ${STAGE_LABELS[stage]}` : STAGE_LABELS[stage];

          return (
            <div
              key={stage}
              style={{ flex: 1, display: "flex", alignItems: "flex-start" }}
            >
              {/* Circle column (circle + optional label) */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
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
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: currentIsHeld
                        ? heldText
                        : isCurrent
                          ? sev.text
                          : isComplete
                            ? "#6a6a6a"
                            : "#b5b5b5",
                      whiteSpace: "nowrap",
                      textAlign: "center",
                    }}
                  >
                    {labelText}
                  </span>
                )}
              </div>

              {/* Connector line — vertically centered on circle */}
              {idx < PIPELINE_STAGES.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: connectorHeight,
                    background: isComplete ? sev.dot : "rgba(0,0,0,0.06)",
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
