"use client";

import { useDraggable } from "@dnd-kit/core";
import type { PartsStatus, WorkOrder } from "@/data/types";
import {
  SEVERITY_LABELS,
  SEVERITY_ICONS,
  STAGE_LABELS,
  PARTS_STATUS_LABELS,
  BLOCK_REASON_LABELS,
  isTerminalStage,
  nextStage,
} from "@/lib/constants";
import { TimeDisplay } from "@/components/time-display";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SEVERITY_VARIANT = {
  critical: "destructive",
  high: "warning",
  routine: "success",
} as const;

const PARTS_VARIANT: Record<
  PartsStatus,
  "outline" | "success" | "warning" | "destructive"
> = {
  "not-needed": "outline",
  "in-stock": "success",
  needed: "destructive",
  ordered: "warning",
};

const PARTS_OPTIONS: PartsStatus[] = [
  "not-needed",
  "in-stock",
  "needed",
  "ordered",
];

interface WorkOrderCardProps {
  order: WorkOrder;
  onComplete?: (woId: string) => void;
  onSelectWorkOrder?: (order: WorkOrder) => void;
  onAdvance?: (woId: string) => void;
  onUpdateParts?: (woId: string, partsStatus: PartsStatus) => void;
  /** When rendered inside a DragOverlay we skip the draggable hook and any hover styles. */
  isOverlay?: boolean;
}

export function WorkOrderCard({
  order,
  onComplete,
  onSelectWorkOrder,
  onAdvance,
  onUpdateParts,
  isOverlay = false,
}: WorkOrderCardProps) {
  // Hooks must be called unconditionally; pass a disabled flag for overlay renders.
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: order.id,
    disabled: isOverlay,
  });

  const terminal = isTerminalStage(order.stage);
  const isIntake = order.stage === "intake";
  const isHeld = order.isHeld === true;
  const next = nextStage(order.stage);

  const handleClick = (e: React.MouseEvent) => {
    if (isOverlay || !onSelectWorkOrder) return;
    // @dnd-kit's 5px activation distance means short clicks don't fire a drag.
    // This onClick only runs on an actual click, not a drag release.
    e.stopPropagation();
    onSelectWorkOrder(order);
  };

  // Context line under the meta row. Held shows the blocker + ETA (so ops
  // sees why the card is parked), Intake shows the arrival ETA (so ops
  // knows when the bus is expected), everything else shows bay + mechanic.
  const contextLine = (() => {
    if (isHeld) {
      const reason = order.blockReason
        ? BLOCK_REASON_LABELS[order.blockReason]
        : "Held";
      const eta = order.blockEta ? ` · ETA ${formatShortEta(order.blockEta)}` : "";
      return `${reason}${eta}`;
    }
    if (isIntake) {
      const eta = order.arrivalEta
        ? `Arriving ${formatShortEta(order.arrivalEta)}`
        : "En route";
      return eta;
    }
    const parts: string[] = [];
    if (order.bayNumber) parts.push(`Bay ${order.bayNumber}`);
    if (order.mechanicName) parts.push(`Mechanic: ${order.mechanicName}`);
    return parts.join(" · ");
  })();

  return (
    <Card
      ref={isOverlay ? undefined : setNodeRef}
      {...(isOverlay ? {} : listeners)}
      {...(isOverlay ? {} : attributes)}
      onClick={handleClick}
      className={
        isOverlay
          ? "touch-none select-none cursor-grabbing border border-border shadow-panel"
          : "touch-none select-none cursor-grab border border-border shadow-card transition-all duration-150 hover:-translate-y-px hover:shadow-card-hover"
      }
      style={{
        opacity: isDragging && !isOverlay ? 0 : 1,
        ...(isHeld && !isOverlay
          ? { borderLeft: "3px dashed #b4541a", background: "#fffbf8" }
          : {}),
      }}
    >
      <CardHeader className="px-4 pb-3 pt-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="whitespace-nowrap text-[15px] font-mono tracking-tight">
            Bus #{order.busNumber}
          </CardTitle>
          <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">
            <TimeDisplay isoDate={order.stageEnteredAt} />
          </span>
        </div>
        <CardDescription className="text-[13px] leading-snug">
          {order.issue}
        </CardDescription>
      </CardHeader>

      <Separator />

      <CardContent className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant={SEVERITY_VARIANT[order.severity]}
            size="sm"
            className="gap-1"
          >
            <span className="flex h-3 w-3 shrink-0 items-center [&>svg]:h-full [&>svg]:w-full">
              {SEVERITY_ICONS[order.severity]}
            </span>
            {SEVERITY_LABELS[order.severity]}
          </Badge>
          {onUpdateParts && !isOverlay ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                  aria-label={`Parts: ${PARTS_STATUS_LABELS[order.partsStatus]}`}
                >
                  <Badge
                    variant={PARTS_VARIANT[order.partsStatus]}
                    size="sm"
                    className="cursor-pointer"
                  >
                    Parts: {PARTS_STATUS_LABELS[order.partsStatus]}
                  </Badge>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-36">
                <DropdownMenuRadioGroup
                  value={order.partsStatus}
                  onValueChange={(v) =>
                    onUpdateParts(order.id, v as PartsStatus)
                  }
                >
                  {PARTS_OPTIONS.map((value) => (
                    <DropdownMenuRadioItem key={value} value={value}>
                      {PARTS_STATUS_LABELS[value]}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Badge variant={PARTS_VARIANT[order.partsStatus]} size="sm">
              Parts: {PARTS_STATUS_LABELS[order.partsStatus]}
            </Badge>
          )}
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          <span className="font-mono">{order.id}</span>
          {contextLine && <span> · {contextLine}</span>}
        </div>
      </CardContent>

      {!isOverlay && (
        <>
          <Separator />
          <CardFooter className="justify-end px-4 py-2">
            {!terminal && onAdvance && next && (
              <Button
                variant="ghost"
                size="sm"
                disabled={isIntake}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onAdvance(order.id);
                }}
                title={
                  isIntake ? "Bus hasn't arrived at the depot yet" : undefined
                }
              >
                {STAGE_LABELS[next]} →
              </Button>
            )}
            {terminal && onComplete && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:bg-muted hover:text-foreground"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete(order.id);
                }}
              >
                Dismiss
              </Button>
            )}
          </CardFooter>
        </>
      )}
    </Card>
  );
}

// Compact ETA like "Tue 10:00am" or "10:00am" if same day.
function formatShortEta(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  if (sameDay) return time;
  const day = d.toLocaleDateString("en-US", { weekday: "short" });
  return `${day} ${time}`;
}
