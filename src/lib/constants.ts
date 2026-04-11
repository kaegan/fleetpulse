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
 * The six stages in order — canonical for both the mechanic kanban and every
 * view that renders repair progress (detail panel stepper, Domino's tracker
 * rows, future surfaces). Any new progress view should derive its state from
 * `getStageStates`, not re-implement the stage comparison logic inline.
 */
export const STAGE_ORDER: readonly WorkOrderStage[] = [
  "inbound",
  "triage",
  "diagnosing",
  "held",
  "repairing",
  "road-test",
] as const;

export const STAGE_LABELS: Record<WorkOrderStage, string> = {
  inbound: "Inbound",
  triage: "Triage",
  diagnosing: "Diagnosing",
  held: "Held",
  repairing: "Repairing",
  "road-test": "Road Test",
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
    case "inbound":
      return "triage";
    case "triage":
      return "diagnosing";
    case "diagnosing":
      return "repairing";
    case "held":
      return "repairing";
    case "repairing":
      return "road-test";
    case "road-test":
      return null;
  }
}

/** True once a WO has reached Road Test (the terminal forward stage). */
export function isTerminalStage(stage: WorkOrderStage): boolean {
  return stage === "road-test";
}

/**
 * The visual state of a single stage dot in any repair-progress view.
 *
 * - `complete`      — WO has passed this stage
 * - `current`       — WO is actively in this stage
 * - `current-held`  — WO is blocked in this stage (Held column)
 * - `skipped`       — stage was bypassed (Held when WO went straight through)
 * - `pending`       — stage not yet reached
 */
export type StageState =
  | "complete"
  | "current"
  | "current-held"
  | "skipped"
  | "pending";

/**
 * Canonical per-stage state resolver for any view that renders WO progress.
 * Use this instead of re-deriving state from (currentStage, idx) comparisons
 * inline — keeps Held semantics, skipped semantics, and future additions
 * consistent across every surface (detail panel, tracker rows, card widgets…).
 */
export function getStageStates(
  currentStage: WorkOrderStage,
): Array<{ stage: WorkOrderStage; state: StageState }> {
  const currentIdx = STAGE_ORDER.indexOf(currentStage);
  return STAGE_ORDER.map((stage, idx) => {
    if (idx === currentIdx) {
      return {
        stage,
        state: currentStage === "held" ? "current-held" : "current",
      };
    }
    if (idx < currentIdx) {
      // Held is skippable — most WOs pass straight from Diagnosing to
      // Repairing without entering Held. Render as skipped (not complete)
      // so the dot stays visually muted rather than showing a green check.
      if (stage === "held") {
        return { stage, state: "skipped" };
      }
      return { stage, state: "complete" };
    }
    return { stage, state: "pending" };
  });
}

export const STATUS_COLORS: Record<BusStatus, string> = {
  running: "#22c55e",
  "pm-due": "#f59e0b",
  "in-maintenance": "#ef4444",
  "road-call": "#222222",
};

export const STATUS_BG: Record<BusStatus, string> = {
  running: "#f0fdf4",
  "pm-due": "#fffbeb",
  "in-maintenance": "#fef2f2",
  "road-call": "#f5f5f5",
};

export const STATUS_LABELS: Record<BusStatus, string> = {
  running: "Running",
  "pm-due": "PM Due",
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
  "Fleet Availability": { color: "#7c3aed", bg: "#f5f3ff" },
  Running: { color: "#22c55e", bg: "#f0fdf4" },
  "PM Due": { color: "#f59e0b", bg: "#fffbeb" },
  "In Maintenance": { color: "#ef4444", bg: "#fef2f2" },
  "Road Calls": { color: "#64748b", bg: "#f1f5f9" },
};

/**
 * Pill color per kanban stage. Gradient: cool upstream → amber held →
 * purple active → green terminal, preserving the existing visual rhythm.
 */
export const KANBAN_STAGE_PILLS: Record<
  WorkOrderStage,
  { color: string; bg: string }
> = {
  inbound: { color: "#64748b", bg: "#f1f5f9" },
  triage: { color: "#0ea5e9", bg: "#f0f9ff" },
  diagnosing: { color: "#3b82f6", bg: "#eff6ff" },
  held: { color: "#b4541a", bg: "#fff4ed" },
  repairing: { color: "#8b5cf6", bg: "#f5f3ff" },
  "road-test": { color: "#22c55e", bg: "#f0fdf4" },
};

export const PARTS_STATUS_LABELS: Record<PartsStatus, string> = {
  "not-needed": "Not needed",
  "in-stock": "In stock",
  needed: "Needed",
  ordered: "Ordered",
};

export const BLOCK_REASON_LABELS: Record<BlockReason, string> = {
  "parts-ordered": "Parts ordered",
  "parts-needed": "Parts needed",
  "awaiting-bay": "Awaiting bay",
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
