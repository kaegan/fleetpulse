"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { parts as partsCatalog } from "@/data/parts";
import { useFleet } from "@/contexts/fleet-context";
import { useDepot, type DepotScope } from "@/hooks/use-depot";
import type { Part } from "@/data/types";

interface PartsRiskEntry {
  part: Part;
  garageStock: number;
  daysUntilStockout: number;
  affectedWoCount: number;
}

function stockForScope(part: Part, scope: DepotScope): number {
  if (scope === "north") return part.stockNorth;
  if (scope === "south") return part.stockSouth;
  return part.stockNorth + part.stockSouth;
}

function reorderForScope(part: Part, scope: DepotScope): number {
  // Per-garage reorderPoint when scoped; doubled when viewing both garages.
  if (scope === "all") return part.reorderPoint * 2;
  return part.reorderPoint;
}

function calcDaysUntilStockout(stock: number, monthlyRate: number): number {
  if (monthlyRate <= 0) return Infinity;
  return Math.round((stock / monthlyRate) * 30);
}

const MAX_ROWS = 5;

const SCOPE_SUFFIX: Record<DepotScope, string> = {
  all: "across both garages",
  north: "in garage",
  south: "in garage",
};

export function PartsRiskPanel() {
  const { scope } = useDepot();
  const { workOrders } = useFleet();

  const entries = useMemo<PartsRiskEntry[]>(() => {
    // Count how many scoped WOs reference each part.
    const woPartCounts = new Map<string, number>();
    for (const wo of workOrders) {
      if (scope !== "all" && wo.garage !== scope) continue;
      for (const req of wo.parts ?? []) {
        woPartCounts.set(req.partId, (woPartCounts.get(req.partId) ?? 0) + 1);
      }
    }

    return partsCatalog
      .map((part) => {
        const garageStock = stockForScope(part, scope);
        const reorder = reorderForScope(part, scope);
        const days = calcDaysUntilStockout(garageStock, part.monthlyUsageRate);
        return {
          part,
          garageStock,
          daysUntilStockout: days,
          affectedWoCount: woPartCounts.get(part.id) ?? 0,
        };
      })
      .filter((e) => e.garageStock <= reorderForScope(e.part, scope) || e.daysUntilStockout <= 60)
      .sort((a, b) => a.daysUntilStockout - b.daysUntilStockout)
      .slice(0, MAX_ROWS);
  }, [scope, workOrders]);

  if (entries.length === 0) {
    return (
      <Card className="flex flex-col items-start gap-3 rounded-lg p-5 shadow-card sm:flex-row sm:items-center sm:gap-4 sm:p-6">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-[5px] text-[13px] font-semibold leading-none tracking-[0.01em]"
          style={{ background: "#f5f5f5", color: "#6a6a6a" }}
        >
          Parts Stocked
        </span>
        <p className="m-0 text-[14px] font-medium text-[#6a6a6a]">
          All parts above reorder levels. No stockout risk right now.
        </p>
      </Card>
    );
  }

  return (
    <Card className="rounded-lg p-5 shadow-card sm:p-6">
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: "#222222",
            letterSpacing: "-0.02em",
            margin: 0,
            marginBottom: 3,
          }}
        >
          Parts at Risk
        </h2>
        <p
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "#929292",
            margin: 0,
          }}
        >
          {entries.length} approaching stockout &middot; {SCOPE_SUFFIX[scope]}
        </p>
      </div>

      {/* Ranked rows */}
      <div>
        {entries.map((entry, idx) => (
          <PartsRiskRow key={entry.part.id} entry={entry} rank={idx + 1} isLast={idx === entries.length - 1} />
        ))}
      </div>
    </Card>
  );
}

function PartsRiskRow({
  entry,
  rank,
  isLast,
}: {
  entry: PartsRiskEntry;
  rank: number;
  isLast: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const { part, garageStock, daysUntilStockout, affectedWoCount } = entry;

  const isStockout = garageStock === 0;
  const isAtReorder = !isStockout && daysUntilStockout <= 30;

  // Color treatment
  const urgencyColor = isStockout ? "#991b1b" : isAtReorder ? "#92400e" : "#222222";
  const urgencyBg = isStockout ? "#fef2f2" : isAtReorder ? "#fffbeb" : "#f5f5f4";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="grid w-full items-center gap-3 p-[12px_14px] grid-cols-[auto_1fr_auto] sm:gap-4 sm:p-[14px_18px] sm:grid-cols-[auto_1fr_auto_auto_auto]"
      style={{
        borderBottom: isLast ? "none" : "1px solid #f0f0f0",
        background: hovered ? "#fafaf9" : "#ffffff",
        transition: "background 0.12s ease-out",
      }}
    >
      {/* Rank */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 20,
          height: 20,
          borderRadius: 999,
          background: urgencyBg,
          color: urgencyColor,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "-0.01em",
          flexShrink: 0,
        }}
      >
        {rank}
      </span>

      {/* Part name + stock */}
      <div style={{ minWidth: 0 }}>
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#222222",
            letterSpacing: "-0.01em",
            display: "block",
          }}
        >
          {part.name}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#929292",
          }}
        >
          {garageStock} in stock &middot; ~{part.monthlyUsageRate}/mo
        </span>
      </div>

      {/* Projected stockout badge */}
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "3px 10px",
          borderRadius: 999,
          background: urgencyBg,
          color: urgencyColor,
          fontSize: 12,
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {isStockout ? "Stockout" : `~${daysUntilStockout}d`}
      </span>

      {/* Lead time — hidden on mobile */}
      <span
        className="hidden sm:inline-block"
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "#929292",
          whiteSpace: "nowrap",
        }}
      >
        {part.leadTimeDays}d lead
      </span>

      {/* WO count — hidden on mobile */}
      {affectedWoCount > 0 && (
        <span
          className="hidden sm:inline-flex"
          style={{
            alignItems: "center",
            padding: "3px 10px",
            borderRadius: 999,
            background: "#f5f5f4",
            color: "#6a6a6a",
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {affectedWoCount} WO{affectedWoCount === 1 ? "" : "s"}
        </span>
      )}
    </div>
  );
}
