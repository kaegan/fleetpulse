"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Bus, WorkOrder } from "@/data/types";
import { buses } from "@/data/buses";
import { SEVERITY_COLORS, SEVERITY_LABELS, SEVERITY_ICONS, STAGES } from "@/lib/constants";
import { TimeDisplay } from "@/components/time-display";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { IconCheckFillDuo18 } from "nucleo-ui-fill-duo-18";

interface WorkOrderCardProps {
  order: WorkOrder;
  onComplete?: (woId: string) => void;
  onSelectBus?: (bus: Bus) => void;
  onAdvance?: (woId: string) => void;
  /** When rendered inside a DragOverlay we skip the draggable hook and any hover styles. */
  isOverlay?: boolean;
}

export function WorkOrderCard({
  order,
  onComplete,
  onSelectBus,
  onAdvance,
  isOverlay = false,
}: WorkOrderCardProps) {
  const sev = SEVERITY_COLORS[order.severity];

  // Hooks must be called unconditionally; pass a disabled flag for overlay renders.
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: order.id,
    disabled: isOverlay,
  });

  const isRoadReady = order.stage === 4;

  const handleClick = (e: React.MouseEvent) => {
    if (isOverlay || !onSelectBus) return;
    // @dnd-kit's 5px activation distance means short clicks don't fire a drag.
    // This onClick only runs on an actual click, not a drag release.
    e.stopPropagation();
    const bus = buses.find((b) => b.id === order.busId);
    if (bus) onSelectBus(bus);
  };

  return (
    <Card
      ref={isOverlay ? undefined : setNodeRef}
      {...(isOverlay ? {} : listeners)}
      {...(isOverlay ? {} : attributes)}
      onClick={handleClick}
      className={cn(
        "touch-none select-none rounded-2xl border border-black/[0.06] p-4 transition-all duration-150",
        isOverlay
          ? "cursor-grabbing shadow-panel"
          : "cursor-grab shadow-card hover:-translate-y-px hover:shadow-card-hover"
      )}
      style={{
        opacity: isDragging && !isOverlay ? 0 : 1,
      }}
    >
      {/* Top row: bus number + time in stage */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[15px] font-bold tracking-tight text-foreground">
          Bus #{order.busNumber}
        </span>
        <span className="text-xs font-medium text-text-muted">
          <TimeDisplay isoDate={order.stageEnteredAt} />
        </span>
      </div>

      {/* Issue description */}
      <div className="mb-2.5 text-[13px] font-medium leading-snug text-muted-foreground">
        {order.issue}
      </div>

      {/* Parts status */}
      {order.partsStatus !== "n/a" && (
        <div className="mb-2.5">
          <Badge
            className="px-2 py-[2px]"
            style={{
              color: order.partsStatus === "available" ? "#166534" : "#92400e",
              background: order.partsStatus === "available" ? "#f0fdf4" : "#fffbeb",
            }}
          >
            {order.partsStatus === "available"
              ? "\u2713 Parts ready"
              : "\u23F3 Parts ordered"}
          </Badge>
        </div>
      )}

      {/* Bottom row: WO ID + bay + severity. flex-wrap so the badge cluster
          drops to a second line when the column gets tight. */}
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
        <span className="font-mono text-[11px] font-medium text-text-faint">
          {order.id}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          {order.bayNumber && (
            <Badge variant="muted" className="px-2 py-[2px]">
              Bay {order.bayNumber}
            </Badge>
          )}
          <Badge
            className="gap-1 px-2 py-[2px]"
            style={{ color: sev.text, background: sev.bg }}
          >
            <span className="flex h-3.5 w-3.5" style={{ color: sev.dot }}>
              {SEVERITY_ICONS[order.severity]}
            </span>
            {SEVERITY_LABELS[order.severity]}
          </Badge>
        </div>
      </div>

      {/* Mechanic name if assigned */}
      {order.mechanicName && (
        <div className="mt-2 border-t border-black/[0.04] pt-2 text-xs font-medium text-text-muted">
          {order.mechanicName}
        </div>
      )}

      {/* Advance action — shown on stages 0–3. Large tap target for dirty-hands tablet use. */}
      {!isRoadReady && onAdvance && !isOverlay && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onAdvance(order.id);
          }}
          className="mt-2.5 inline-flex w-full min-h-11 items-center justify-center gap-1.5 rounded-[10px] border border-transparent bg-[#f4f4f4] py-2.5 text-[13px] font-semibold text-[#444444] transition-colors hover:bg-[#ebebeb] cursor-pointer"
        >
          Move to {STAGES[order.stage + 1]} →
        </button>
      )}

      {/* Terminal Complete action — only on stage 4 (Road Ready). Subtle text link, not a CTA. */}
      {isRoadReady && onComplete && !isOverlay && (
        <button
          // Stop drag listeners from hijacking the click.
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onComplete(order.id);
          }}
          className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-[#bbf7d0] bg-transparent py-1.5 text-xs font-semibold text-[#166534] transition-colors hover:border-solid hover:bg-[#f0fdf4] cursor-pointer"
        >
          <span className="flex h-3.5 w-3.5">
            <IconCheckFillDuo18 />
          </span>
          Mark complete
        </button>
      )}
    </Card>
  );
}
