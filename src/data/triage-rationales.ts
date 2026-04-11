/**
 * Hand-authored rationales, one per work order, written to imitate the
 * structured output of a well-prompted LLM. Each rationale follows the same
 * implicit contract: cite the severity, cite age or parts state, recommend
 * a specific action, and name the business impact.
 *
 * These are mocked so the demo runs without an API key. The contract
 * captured here is exactly what we'd ask the LLM for if we wired up Claude:
 *
 *   "In one sentence, recommend an action for this work order. Cite
 *   severity, cite hours in stage, cite parts state, and name the
 *   business consequence (bay rotation, dispatch impact, ADA service)."
 */

export const triageRationales: Record<string, string> = {
  "WO-1248":
    "Critical fluid leak with parts in hand, approaching two days in Parts Ready — bay rotation blocker. Pull forward first; it's the highest-leverage repair available today.",

  "WO-1255":
    "Critical air brake fault stuck in Diagnosing overnight, waiting on a compressor part. Shop time isn't the constraint — escalate procurement before it slips another day.",

  "WO-1253":
    "High-severity alternator with parts ready and no aging risk yet. Lowest-friction win on the board — green-light the moment a bay opens.",

  "WO-1247":
    "Critical brake job already in active repair with parts in hand. No action needed — flagged so dispatch knows Bus 147 is on track for end-of-shift release.",

  "WO-1250":
    "Wheelchair-ramp hydraulic, parts on order. Routine until the part lands, but worth tracking against ADA service commitments — these can't ship a route without it.",

  "WO-1249":
    "HVAC repair already in Road Ready with parts in hand. Sign off on QA and release — no triage decision needed here.",

  "WO-1251":
    "Routine PM oil change in active repair, no aging risk. Let it close out naturally; pulling resources here would only delay a critical job.",

  "WO-1252":
    "Routine tire rotation in intake, fresh ticket, no urgency. Leave for end-of-day fill-in work between higher-priority repairs.",

  "WO-1254":
    "Routine PM coolant flush sitting in intake since yesterday. Schedule for tomorrow's first slot in North — clearing PMs before they age into criticals is exactly what this dashboard is for.",

  "WO-1256":
    "High-severity steering leak in Road Ready, parts in hand. Sign off on QA and release — Bus 112 should be back in service by end of shift.",
};
