import type {
  BlockReason,
  BusStatus,
  HistoryOutcome,
  PartsStatus,
  Severity,
  WorkOrderStage,
} from "@/data/types";
import { createElement, type ReactNode } from "react";
import {
  IconTriangleWarningFillDuo18,
  IconAlertWarningFillDuo18,
  IconCheckFillDuo18,
} from "nucleo-ui-fill-duo-18";

export const SEVERITY_ICONS: Record<Severity, ReactNode> = {
  critical: createElement(IconTriangleWarningFillDuo18),
  high: createElement(IconAlertWarningFillDuo18),
  routine: createElement(IconCheckFillDuo18),
};

/**
 * The five stages in order — canonical for both the mechanic kanban and every
 * view that renders repair progress (detail panel stepper, Domino's tracker
 * rows, future surfaces). Any new progress view should derive its state from
 * `getStageStates`, not re-implement the stage comparison logic inline.
 *
 * "Held" is an orthogonal boolean flag on the work order, not a pipeline stage.
 */
export const STAGE_ORDER: readonly WorkOrderStage[] = [
  "intake",
  "triage",
  "repair",
  "road-test",
  "done",
] as const;

export const STAGE_LABELS: Record<WorkOrderStage, string> = {
  intake: "Intake",
  triage: "Triage",
  repair: "Repair",
  "road-test": "Road Test",
  done: "Done",
};

export function stageIndex(stage: WorkOrderStage): number {
  return STAGE_ORDER.indexOf(stage);
}

/**
 * Next stage for the "advance" card action. Dragging still goes through
 * `resolveStageTransition` in the mechanic view, which enforces parts
 * gating. `nextStage` just defines the default forward target.
 */
export function nextStage(stage: WorkOrderStage): WorkOrderStage | null {
  switch (stage) {
    case "intake":
      return "triage";
    case "triage":
      return "repair";
    case "repair":
      return "road-test";
    case "road-test":
      return "done";
    case "done":
      return null;
  }
}

/** True once a WO has reached Done (the terminal forward stage). */
export function isTerminalStage(stage: WorkOrderStage): boolean {
  return stage === "done";
}

/**
 * The visual state of a single stage dot in any repair-progress view.
 *
 * - `complete`      — WO has passed this stage
 * - `current`       — WO is actively in this stage
 * - `current-held`  — WO is in this stage AND blocked (isHeld flag)
 * - `pending`       — stage not yet reached
 */
export type StageState =
  | "complete"
  | "current"
  | "current-held"
  | "pending";

/**
 * Canonical per-stage state resolver for any view that renders WO progress.
 * Use this instead of re-deriving state from (currentStage, idx) comparisons
 * inline — keeps Held semantics consistent across every surface (detail
 * panel, tracker rows, card widgets…).
 */
export function getStageStates(
  currentStage: WorkOrderStage,
  isHeld?: boolean,
): Array<{ stage: WorkOrderStage; state: StageState }> {
  const currentIdx = STAGE_ORDER.indexOf(currentStage);
  return STAGE_ORDER.map((stage, idx) => {
    if (idx === currentIdx) {
      return {
        stage,
        state: isHeld ? "current-held" : "current",
      };
    }
    if (idx < currentIdx) {
      return { stage, state: "complete" };
    }
    return { stage, state: "pending" };
  });
}

/** Used for data-viz (fleet health chart dots, legend swatches).
 *  Distinct from STATUS_BG/STATUS_TEXT which style UI badges. */
export const STATUS_COLORS: Record<BusStatus, string> = {
  running: "#22c55e",
  "pm-due": "#f59e0b",
  "in-maintenance": "#ef4444",
  "road-call": "#222222",
};

export const STATUS_BG: Record<BusStatus, string> = {
  running: "#f5f5f5",
  "pm-due": "#fdf0ed",
  "in-maintenance": "#f5f5f5",
  "road-call": "#f5f5f5",
};

/** Text color for status badges — darker shade of each STATUS_COLORS entry. */
export const STATUS_TEXT: Record<BusStatus, string> = {
  running: "#222222",
  "pm-due": "#6a3b2a",
  "in-maintenance": "#3f3f3f",
  "road-call": "#222222",
};

export const STATUS_LABELS: Record<BusStatus, string> = {
  running: "Running",
  "pm-due": "Preventive Maintenance Due",
  "in-maintenance": "In Maintenance",
  "road-call": "Road Call",
};

export const SEVERITY_COLORS: Record<
  Severity,
  { border: string; bg: string; dot: string; text: string }
> = {
  critical: {
    border: "#ef4444",
    bg: "#fef2f2",
    dot: "#ef4444",
    text: "#991b1b",
  },
  high: {
    border: "#f59e0b",
    bg: "#fffbeb",
    dot: "#f59e0b",
    text: "#92400e",
  },
  routine: {
    border: "#22c55e",
    bg: "#f0fdf4",
    dot: "#22c55e",
    text: "#166534",
  },
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  routine: "Routine",
};

/**
 * Outcome label + colors for completed service history entries.
 * Used by both the history list inside BusDetailPanel and the historical
 * mode of WorkOrderDetailPanel.
 */
export const OUTCOME_STYLES: Record<
  HistoryOutcome,
  { label: string; color: string; bg: string }
> = {
  completed: { label: "Completed", color: "#166534", bg: "#f0fdf4" },
  deferred: { label: "Deferred", color: "#92400e", bg: "#fffbeb" },
  recurring: { label: "Recurring", color: "#d4654a", bg: "#fdf0ed" },
};

export const PM_INTERVAL_MILES = 6_000; // A-service every 6,000 miles

// No auth in V1 — hardcoded "signed-in" mechanic for the Mine/All filter demo.
// Torres, M. has 2 WOs in North Garage, which gives a legible Mine(2)/All(6) split.
export const CURRENT_MECHANIC = "Torres, M.";

export const BRAND_COLOR = "#d4654a";
export const BRAND_COLOR_HOVER = "#be5840";

export const KPI_PILLS: Record<string, { color: string; bg: string }> = {
  "Fleet Availability": { color: "#6a6a6a", bg: "#f5f5f5" },
  Running: { color: "#6a6a6a", bg: "#f5f5f5" },
  "Preventive Maintenance Due": { color: "#6a6a6a", bg: "#f5f5f5" },
  "PM Compliance": { color: "#6a6a6a", bg: "#f5f5f5" },
  "In Maintenance": { color: "#6a6a6a", bg: "#f5f5f5" },
  "Road Calls": { color: "#6a6a6a", bg: "#f5f5f5" },
};

/**
 * Pill color per kanban stage. Neutral across the board; Done gets a
 * quiet green. Held is an orthogonal overlay — see HELD_PILL.
 */
export const KANBAN_STAGE_PILLS: Record<
  WorkOrderStage,
  { color: string; bg: string }
> = {
  intake: { color: "#6a6a6a", bg: "#f5f5f5" },
  triage: { color: "#6a6a6a", bg: "#f5f5f5" },
  repair: { color: "#6a6a6a", bg: "#f5f5f5" },
  "road-test": { color: "#6a6a6a", bg: "#f5f5f5" },
  done: { color: "#166534", bg: "#f0fdf4" },
};

/** Copper accent for held-state badges and pills. */
export const HELD_PILL = { color: "#b4541a", bg: "#fff4ed" } as const;

export const PARTS_STATUS_LABELS: Record<PartsStatus, string> = {
  "not-needed": "Not needed",
  "in-stock": "In stock",
  needed: "Needed",
  ordered: "Ordered",
};

export const BLOCK_REASON_LABELS: Record<BlockReason, string> = {
  "parts-ordered": "Parts ordered",
  "parts-needed": "Parts needed",
  "awaiting-approval": "Awaiting approval",
  "awaiting-customer": "Awaiting customer",
  other: "Held",
};

/**
 * Quick-start chips for the Mechanic "Log new repair" flow.
 * Tapping a chip fills the issue field with the default string, which the
 * mechanic can then refine inline. "Other" clears the field and focuses it.
 */
export const ISSUE_TEMPLATES: Array<{ label: string; defaultIssue: string }> = [
  { label: "Brakes", defaultIssue: "Brake pad replacement" },
  { label: "HVAC", defaultIssue: "HVAC compressor failure" },
  { label: "Transmission", defaultIssue: "Transmission fluid leak" },
  { label: "Wheelchair ramp", defaultIssue: "Wheelchair ramp hydraulic" },
  { label: "Electrical", defaultIssue: "Alternator replacement" },
  { label: "Oil change", defaultIssue: "Engine oil change (PM-A)" },
  { label: "Coolant flush", defaultIssue: "Coolant system flush (PM-B)" },
  { label: "Tires", defaultIssue: "Tire rotation" },
  { label: "Other", defaultIssue: "" },
];

/** Fleet availability thresholds — defines the three-tier color system.
 *  Below industry avg → coral. Above avg, below target → amber. At/above target → green. */
export const AVAILABILITY_THRESHOLDS = { industryAvg: 84, target: 95 } as const;

export function getAvailabilityTierColor(rate: number): string {
  if (rate < AVAILABILITY_THRESHOLDS.industryAvg) return "#d4654a";
  if (rate < AVAILABILITY_THRESHOLDS.target) return "#d97706";
  return "#22c55e";
}

/** MTIM (Mean Time In Maintenance) benchmark thresholds in hours.
 *  Industry average is 12–18h. ≤12h = excellent, 12–18h = acceptable, >18h = concerning. */
export const MTIM_THRESHOLDS = { excellent: 12, concerning: 18 } as const;

