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
 * The six kanban columns, in left-to-right order. "Held" is an off-path
 * detour for WOs blocked on parts / bay / approval.
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

/**
 * The linear five-stage pipeline used by the Domino's tracker and detail
 * panel progress bar. "Held" is intentionally omitted — it's a waiting
 * state, not a phase. A WO in Held renders as "Diagnosing" with a held
 * indicator on top.
 */
export const PIPELINE_STAGES: readonly WorkOrderStage[] = [
  "inbound",
  "triage",
  "diagnosing",
  "repairing",
  "road-test",
] as const;

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
 * Which pipeline dot to highlight when rendering a WO in the 5-stage
 * Domino's tracker. `held` collapses to `diagnosing` since that's where
 * the detour originates. Callers should additionally render a held badge
 * when `stage === "held"`.
 */
export function pipelineStageFor(stage: WorkOrderStage): WorkOrderStage {
  return stage === "held" ? "diagnosing" : stage;
}

export const STATUS_COLORS: Record<BusStatus, string> = {
  running: "var(--color-status-running)",
  "pm-due": "var(--color-status-pm-due)",
  "in-maintenance": "var(--color-status-maintenance)",
  "road-call": "var(--color-status-roadcall)",
};

export const STATUS_BG: Record<BusStatus, string> = {
  running: "var(--color-status-running-bg)",
  "pm-due": "var(--color-status-pm-due-bg)",
  "in-maintenance": "var(--color-status-maintenance-bg)",
  "road-call": "var(--color-status-roadcall-bg)",
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
    border: "var(--color-severity-critical)",
    bg: "var(--color-severity-critical-bg)",
    dot: "var(--color-severity-critical)",
    text: "var(--color-severity-critical-text)",
  },
  high: {
    border: "var(--color-severity-high)",
    bg: "var(--color-severity-high-bg)",
    dot: "var(--color-severity-high)",
    text: "var(--color-severity-high-text)",
  },
  routine: {
    border: "var(--color-severity-routine)",
    bg: "var(--color-severity-routine-bg)",
    dot: "var(--color-severity-routine)",
    text: "var(--color-severity-routine-text)",
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

export const BRAND_COLOR = "var(--color-brand)";
export const BRAND_COLOR_HOVER = "var(--color-brand-hover)";

export const KPI_PILLS: Record<string, { color: string; bg: string }> = {
  "Fleet Availability": {
    color: "var(--color-kpi-availability)",
    bg: "var(--color-kpi-availability-bg)",
  },
  Running: {
    color: "var(--color-status-running)",
    bg: "var(--color-status-running-bg)",
  },
  "PM Due": {
    color: "var(--color-status-pm-due)",
    bg: "var(--color-status-pm-due-bg)",
  },
  "In Maintenance": {
    color: "var(--color-status-maintenance)",
    bg: "var(--color-status-maintenance-bg)",
  },
  "Road Calls": {
    color: "var(--color-kpi-roadcall)",
    bg: "var(--color-kpi-roadcall-bg)",
  },
};

export const KANBAN_STAGE_PILLS: Record<string, { color: string; bg: string }> = {
  Intake: {
    color: "var(--color-stage-intake)",
    bg: "var(--color-stage-intake-bg)",
  },
  Diagnosing: {
    color: "var(--color-stage-diagnosing)",
    bg: "var(--color-stage-diagnosing-bg)",
  },
  "Parts Ready": {
    color: "var(--color-stage-parts-ready)",
    bg: "var(--color-stage-parts-ready-bg)",
  },
  "In Repair": {
    color: "var(--color-stage-in-repair)",
    bg: "var(--color-stage-in-repair-bg)",
  },
  "Road Ready": {
    color: "var(--color-stage-road-ready)",
    bg: "var(--color-stage-road-ready-bg)",
  },
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
