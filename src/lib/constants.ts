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

export const KANBAN_STAGE_PILLS: Record<string, { color: string; bg: string }> = {
  Intake: { color: "#64748b", bg: "#f1f5f9" },
  Diagnosing: { color: "#3b82f6", bg: "#eff6ff" },
  "Parts Ready": { color: "#f59e0b", bg: "#fffbeb" },
  "In Repair": { color: "#8b5cf6", bg: "#f5f3ff" },
  "Road Ready": { color: "#22c55e", bg: "#f0fdf4" },
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
