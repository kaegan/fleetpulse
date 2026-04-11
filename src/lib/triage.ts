import type { WorkOrder } from "@/data/types";
import { hoursSince } from "@/lib/utils";

/**
 * Triage scoring: deterministic ranking of which work orders the ops manager
 * should pull forward next. The ranking lives in code, not an LLM — we want
 * the math to be predictable and explainable. The natural-language rationale
 * (in src/data/triage-rationales.ts) is the part that imitates AI output.
 *
 * The four signals we weigh, in plain language:
 *  - severity: critical work always sits above high; high above routine
 *  - age in stage: work that's been sitting moves up so bottlenecks surface
 *  - parts state: parts-in-hand work outranks parts-on-order (the latter is
 *    blocked, so pulling it forward has no effect — escalate procurement)
 *  - ready to start: Parts Ready jobs get a small nudge — they have zero
 *    diagnostic friction and can start the moment a bay opens
 *
 * Stages 3 (In Repair) and 4 (Road Ready) are excluded — those buses are
 * already in or past the bay, so there's nothing to "pull forward".
 */

export interface TriageScored {
  wo: WorkOrder;
  score: number;
}

const SEVERITY_SCORE = {
  critical: 100,
  high: 60,
  routine: 20,
} as const;

// Each hour in stage adds 1.5 points, capped so a week-old routine never
// outranks a fresh critical.
const AGE_PER_HOUR = 1.5;
const AGE_CAP = 50;

// Parts available is a +20 boost (do it now). Parts on order is a -30
// penalty — pulling forward a blocked work order has no effect on throughput.
const PARTS_AVAILABLE_BOOST = 20;
const PARTS_ORDERED_PENALTY = -30;

// Small nudge for Parts Ready work — zero diagnostic friction, ready to
// start the moment a bay opens.
const READY_TO_START_BOOST = 10;

export function scoreWorkOrder(wo: WorkOrder, now: Date = new Date()): number {
  // Stage 3 (In Repair) and 4 (Road Ready) are already in or past a bay —
  // there's nothing to "pull forward".
  if (wo.stage === 3 || wo.stage === 4) return -Infinity;

  const severity = SEVERITY_SCORE[wo.severity];

  const hoursInStage = hoursSince(wo.stageEnteredAt, now);
  const age = Math.min(hoursInStage * AGE_PER_HOUR, AGE_CAP);

  const parts =
    wo.partsStatus === "available"
      ? PARTS_AVAILABLE_BOOST
      : wo.partsStatus === "ordered"
        ? PARTS_ORDERED_PENALTY
        : 0;

  const readyToStart = wo.stage === 2 ? READY_TO_START_BOOST : 0;

  return severity + age + parts + readyToStart;
}

/** Top-N work orders to pull forward, sorted by score descending. */
export function getTopTriageRecommendations(
  workOrders: WorkOrder[],
  n = 3,
  now: Date = new Date()
): TriageScored[] {
  return workOrders
    .map((wo) => ({ wo, score: scoreWorkOrder(wo, now) }))
    .filter(({ score }) => score > 0 && Number.isFinite(score))
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}
