import type { BusStatus, Severity } from "@/data/types";
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

export const STAGES = [
  "Intake",
  "Diagnosing",
  "Parts Ready",
  "In Repair",
  "Road Ready",
] as const;

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
