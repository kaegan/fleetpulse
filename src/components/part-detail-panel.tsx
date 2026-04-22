"use client";

import { useMemo } from "react";
import type { Part, WorkOrder } from "@/data/types";
import { useFleet } from "@/contexts/fleet-context";
import { SEVERITY_COLORS, SEVERITY_LABELS } from "@/lib/constants";
import {
  calcDaysUntilStockout,
  classifyPart,
  stockForScope,
} from "@/lib/parts-urgency";
import { useDepot } from "@/hooks/use-depot";
import { BackButton } from "@/components/back-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface PartDetailPanelContentProps {
  part: Part;
  /** When set, clicking an active WO row drills into its panel. */
  onSelectWorkOrder?: (wo: WorkOrder) => void;
  backLabel?: string;
  onBack?: () => void;
}

export function PartDetailPanelContent({
  part,
  onSelectWorkOrder,
  backLabel,
  onBack,
}: PartDetailPanelContentProps) {
  const { parts, workOrders } = useFleet();
  const { scope } = useDepot();

  const live = parts.find((p) => p.id === part.id) ?? part;
  const urgency = classifyPart(live, scope);
  const needsAttention =
    urgency.level === "stockout" || urgency.level === "at-reorder";
  const scopedStock = stockForScope(live, scope);
  const scopedDays = calcDaysUntilStockout(scopedStock, live.monthlyUsageRate);

  const runningLowMessage =
    urgency.level === "stockout"
      ? `Out of stock. Lead time ${live.leadTimeDays} days to restock.`
      : urgency.level === "at-reorder"
        ? `Only ${scopedStock} left — about ~${scopedDays}d at current usage · Lead time ${live.leadTimeDays}d.`
        : null;

  const activeWos = useMemo<WorkOrder[]>(
    () =>
      workOrders.filter(
        (wo) =>
          wo.stage !== "done" &&
          (wo.parts ?? []).some((req) => req.partId === live.id)
      ),
    [workOrders, live.id]
  );

  return (
    <div className="p-5 sm:p-7">
      {onBack && backLabel && <BackButton label={backLabel} onClick={onBack} />}

      <div className="mb-2 flex items-start justify-between gap-3 pr-11">
        <h2 className="text-[24px] font-semibold leading-tight tracking-[-0.02em] text-[#222222]">
          {live.name}
        </h2>
      </div>
      <div className="mb-7 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{live.category}</Badge>
        {needsAttention && (
          <Badge
            style={{ color: urgency.textColor, background: urgency.bgColor }}
          >
            {urgency.label}
          </Badge>
        )}
      </div>

      <h3 className="mb-2.5 text-[11px] font-semibold tracking-[0.01em] text-[#929292]">
        Stock on Hand
      </h3>
      <div className="mb-[26px] grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <GarageStockCard
          label="North Garage"
          count={live.stockNorth}
          reorderPoint={live.reorderPoint}
        />
        <GarageStockCard
          label="South Garage"
          count={live.stockSouth}
          reorderPoint={live.reorderPoint}
        />
      </div>

      {runningLowMessage && (
        <div className="mb-[26px] rounded-md border border-[#fde68a] bg-[#fffbeb] px-4 py-3">
          <h3 className="mb-1 text-[11px] font-semibold tracking-[0.01em] text-[#92400e]">
            Running low
          </h3>
          <p className="text-[13px] font-medium leading-[1.5] text-[#78350f]">
            {runningLowMessage}
          </p>
        </div>
      )}

      <h3 className="mb-2.5 text-[11px] font-semibold tracking-[0.01em] text-[#929292]">
        Active Work Orders
      </h3>
      {activeWos.length === 0 ? (
        <Card className="mb-6 rounded-md border border-black/[0.06] bg-[#fafaf9] px-3.5 py-3">
          <p className="text-[13px] font-medium text-[#b5b5b5]">
            No active work orders need this part right now.
          </p>
        </Card>
      ) : (
        <Card className="mb-6 overflow-hidden rounded-md border border-black/[0.06] bg-[#fafaf9] p-0">
          {activeWos.map((wo, idx) => (
            <div key={wo.id}>
              {idx > 0 && <Separator className="bg-black/[0.04]" />}
              <WoLinkRow wo={wo} onClick={onSelectWorkOrder} />
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function GarageStockCard({
  label,
  count,
  reorderPoint,
}: {
  label: string;
  count: number;
  reorderPoint: number;
}) {
  const numberColor = stockColor(count, reorderPoint);

  return (
    <Card className="rounded-md border border-border bg-card-hover p-4 shadow-none">
      <div className="mb-2 text-[11px] font-medium text-[#929292]">
        {label}
      </div>
      <span
        className="block text-[32px] font-semibold leading-none tracking-[-0.03em]"
        style={{ color: numberColor }}
      >
        {count}
      </span>
      <div className="mt-2 text-[11px] font-medium text-[#b5b5b5]">
        Reorder at {reorderPoint}
      </div>
    </Card>
  );
}

function stockColor(count: number, reorderPoint: number): string {
  if (count === 0) return "#991b1b";
  if (count <= reorderPoint) return "#92400e";
  return "#222222";
}

function WoLinkRow({
  wo,
  onClick,
}: {
  wo: WorkOrder;
  onClick?: (wo: WorkOrder) => void;
}) {
  const sev = SEVERITY_COLORS[wo.severity];
  const Content = (
    <>
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="font-mono text-[11px] font-semibold text-[#929292]">
          {wo.id}
        </span>
        <span className="truncate text-[13px] font-semibold text-[#222222]">
          {wo.issue}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant="outline" size="sm">
          Bus #{wo.busNumber}
        </Badge>
        <Badge
          size="sm"
          style={{ color: sev.text, background: sev.bg }}
        >
          {SEVERITY_LABELS[wo.severity]}
        </Badge>
      </div>
    </>
  );

  if (!onClick) {
    return (
      <div className="flex items-center justify-between gap-3 px-3.5 py-3">
        {Content}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onClick(wo)}
      className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left transition-colors hover:bg-black/[0.02] focus-visible:bg-black/[0.03] focus-visible:outline-none"
    >
      {Content}
    </button>
  );
}
