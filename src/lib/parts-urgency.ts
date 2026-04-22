import type { Part } from "@/data/types";
import type { DepotScope } from "@/hooks/use-depot";

export type PartUrgency = "stockout" | "at-reorder" | "at-risk-soon" | "healthy";

export interface UrgencyTreatment {
  level: PartUrgency;
  label: string;
  textColor: string;
  bgColor: string;
}

export function stockForScope(part: Part, scope: DepotScope): number {
  if (scope === "north") return part.stockNorth;
  if (scope === "south") return part.stockSouth;
  return part.stockNorth + part.stockSouth;
}

export function reorderForScope(part: Part, scope: DepotScope): number {
  if (scope === "all") return part.reorderPoint * 2;
  return part.reorderPoint;
}

export function calcDaysUntilStockout(stock: number, monthlyRate: number): number {
  if (monthlyRate <= 0) return Infinity;
  return Math.round((stock / monthlyRate) * 30);
}

export function classifyPart(part: Part, scope: DepotScope): UrgencyTreatment {
  const stock = stockForScope(part, scope);
  const reorder = reorderForScope(part, scope);
  const days = calcDaysUntilStockout(stock, part.monthlyUsageRate);

  if (stock === 0) {
    return {
      level: "stockout",
      label: "Stockout",
      textColor: "#991b1b",
      bgColor: "#fef2f2",
    };
  }
  if (stock <= reorder) {
    return {
      level: "at-reorder",
      label: `~${days}d`,
      textColor: "#92400e",
      bgColor: "#fffbeb",
    };
  }
  if (days <= 60) {
    return {
      level: "at-risk-soon",
      label: `~${days}d`,
      textColor: "#6a6a6a",
      bgColor: "#f5f5f4",
    };
  }
  return {
    level: "healthy",
    label: "Healthy",
    textColor: "#166534",
    bgColor: "#ecfdf5",
  };
}

export function isAtRisk(part: Part, scope: DepotScope): boolean {
  const level = classifyPart(part, scope).level;
  return level === "stockout" || level === "at-reorder";
}
