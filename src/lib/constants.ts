import type { BusStatus, Severity } from "@/data/types";

export const STAGES = [
  "Queued",
  "Diagnosed",
  "Parts Ready",
  "In Repair",
  "QA Check",
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

export const BRAND_COLOR = "#c2703e";
export const BRAND_COLOR_HOVER = "#a85d32";
