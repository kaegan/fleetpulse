/**
 * FleetPulse PostHog analytics — typed event wrappers.
 *
 * All calls are fire-and-forget and swallow errors so analytics can never
 * break the product. The module is safe to import server-side (the posthog-js
 * client is a no-op until the browser initialises it via the provider).
 */
import posthog from "posthog-js";

function capture(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    posthog.capture(event, props);
  } catch {
    // swallow — analytics must never break the product
  }
}

export const analytics = {
  /** Ops manager clicks "Schedule PM service" on an overdue bus. */
  pmServiceScheduled: (busId: number, overdueMiles: number) =>
    capture("pm_service_scheduled", { busId, overdueMiles }),

  /** Mechanic advances a work order to the next stage. */
  woStageAdvanced: (woId: string, fromStage: string, toStage: string) =>
    capture("wo_stage_advanced", { woId, fromStage, toStage }),

  /** User views a bus or WO that belongs to the non-selected garage. */
  crossGaragePeek: (busId: number, homeGarage: string, viewingGarage: string) =>
    capture("cross_garage_peek", { busId, homeGarage, viewingGarage }),

  /** User opens a bus detail panel from any entry point. */
  busDetailOpened: (
    busId: number,
    source: "kpi-drilldown" | "tracker" | "kanban" | "search" | "chart" | "history"
  ) => capture("bus_detail_opened", { busId, source }),

  /** User opens a work order detail panel. */
  woDetailOpened: (
    woId: string,
    source: "tracker" | "kanban" | "drilldown" | "part-panel"
  ) => capture("wo_detail_opened", { woId, source }),

  /** User opens a part detail panel from anywhere. */
  partDetailOpened: (
    partId: string,
    source: "parts-index" | "wo-panel" | "parts-risk"
  ) => capture("part_detail_opened", { partId, source }),

  /** Mechanic submits the Log Repair form, creating a new work order. */
  repairLogged: (
    busId: number,
    severity: string,
    garage: string,
    autoEscalated: boolean,
    assignedTo: string | null
  ) => capture("repair_logged", { busId, severity, garage, autoEscalated, assignedTo }),

  /** Mechanic dismisses a completed work order from the board. */
  woDismissed: (woId: string) =>
    capture("wo_dismissed", { woId }),

  /** User switches the active garage scope via the depot switcher. */
  depotScopeChanged: (from: string, to: string) =>
    capture("depot_scope_changed", { from, to }),

  /** Mechanic adds a part to a work order's parts list. */
  woPartAdded: (woId: string, partId: string, partName: string) =>
    capture("wo_part_added", { woId, partId, partName }),

  /** Mechanic requests a cross-garage parts transfer for a work order. */
  partsTransferRequested: (
    woId: string,
    partId: string,
    partName: string,
    qty: number
  ) => capture("parts_transfer_requested", { woId, partId, partName, qty }),

  /** Ops manager opens a filtered bus list via a KPI card or held-repairs link. */
  kpiDrilldownOpened: (kind: string) =>
    capture("kpi_drilldown_opened", { kind }),

  /** Mechanic switches between "My Work Orders" and "Board" views. */
  mechanicScopeToggled: (from: string, to: string) =>
    capture("mechanic_scope_toggled", { from, to }),

  /** Ops manager filters the work order tracker by severity. */
  trackerSeverityFiltered: (severity: string) =>
    capture("tracker_severity_filtered", { severity }),

  /** Ops manager clicks a stage on the bottleneck bar to filter by it. */
  trackerStageFiltered: (stage: string | null) =>
    capture("tracker_stage_filtered", { stage }),
};
