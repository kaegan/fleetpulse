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
    source: "tracker" | "kanban" | "drilldown"
  ) => capture("wo_detail_opened", { woId, source }),
};
