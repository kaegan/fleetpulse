import { parts as partsCatalog } from "@/data/parts";

/** Part IDs in the Accessibility category — derived from catalog, not hardcoded. */
const ACCESSIBILITY_PART_IDS = new Set(
  partsCatalog.filter((p) => p.category === "Accessibility").map((p) => p.id)
);

/** True when any part in the list belongs to the Accessibility category. */
export function hasAccessibilityPart(
  parts: Array<{ partId: string }>
): boolean {
  return parts.some((p) => ACCESSIBILITY_PART_IDS.has(p.partId));
}

/** Keywords that indicate an accessibility-equipment issue in free-text input. */
const ACCESSIBILITY_KEYWORDS = [
  "wheelchair",
  "lift",
  "ramp",
  "securement",
  "kneeling",
  "tie-down",
];

/** True when the issue description references accessibility equipment. */
export function isAccessibilityIssue(issueText: string): boolean {
  const lower = issueText.toLowerCase();
  return ACCESSIBILITY_KEYWORDS.some((kw) => lower.includes(kw));
}

/** User-facing explanation shown in every auto-escalation notice. */
export const ACCESSIBILITY_ESCALATION_NOTICE =
  "Auto-escalated to Critical. Accessibility equipment issues are always treated as Critical because riders depend on this equipment to board.";
