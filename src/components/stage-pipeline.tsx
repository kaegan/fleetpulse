"use client";

import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { STAGES, SEVERITY_COLORS } from "@/lib/constants";
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

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex w-full items-start">
        {STAGES.map((stage, idx) => {
          const isComplete = idx < currentStage;
          const isCurrent = idx === currentStage;

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
                  : isCurrent
                    ? sev.bg
                    : "#f2f2f2",
                border: isCurrent
                  ? `2px solid ${sev.border}`
                  : isComplete
                    ? "none"
                    : "1px solid rgba(0,0,0,0.08)",
                color: isComplete
                  ? "#ffffff"
                  : isCurrent
                    ? sev.dot
                    : "#b5b5b5",
              }}
            >
              {isComplete ? "\u2713" : idx + 1}
            </motion.div>
          );

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
                  // Labels provide the name inline, so tooltips would be redundant.
                  circle
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>{circle}</TooltipTrigger>
                    <TooltipContent>{stage}</TooltipContent>
                  </Tooltip>
                )}
                {showLabels && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: isCurrent
                        ? sev.text
                        : isComplete
                          ? "#6a6a6a"
                          : "#b5b5b5",
                      whiteSpace: "nowrap",
                      textAlign: "center",
                    }}
                  >
                    {stage}
                  </span>
                )}
              </div>

              {/* Connector line — vertically centered on circle */}
              {idx < STAGES.length - 1 && (
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
