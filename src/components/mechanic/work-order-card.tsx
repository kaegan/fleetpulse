"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Bus, WorkOrder } from "@/data/types";
import { buses } from "@/data/buses";
import { SEVERITY_LABELS, SEVERITY_ICONS, STAGES } from "@/lib/constants";
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
import { IconCheckFillDuo18 } from "nucleo-ui-fill-duo-18";

const SEVERITY_VARIANT = {
  critical: "destructive",
  high: "warning",
  routine: "success",
} as const;

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
      className={
        isOverlay
          ? "touch-none select-none cursor-grabbing border border-black/[0.06] shadow-panel"
          : "touch-none select-none cursor-grab border border-black/[0.06] shadow-card transition-all duration-150 hover:-translate-y-px hover:shadow-card-hover"
      }
      style={{ opacity: isDragging && !isOverlay ? 0 : 1 }}
    >
      <CardHeader className="px-4 pb-3 pt-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="whitespace-nowrap text-[15px] tracking-tight">
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
            <span className="flex h-3 w-3">
              {SEVERITY_ICONS[order.severity]}
            </span>
            {SEVERITY_LABELS[order.severity]}
          </Badge>
          {order.partsStatus !== "n/a" && (
            <Badge
              variant={order.partsStatus === "available" ? "success" : "warning"}
              size="sm"
            >
              {order.partsStatus === "available" ? "Ready" : "Ordered"}
            </Badge>
          )}
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          <span className="font-mono">{order.id}</span>
          {order.bayNumber && <span> · Bay {order.bayNumber}</span>}
          {order.mechanicName && <span> · {order.mechanicName}</span>}
        </div>
      </CardContent>

      {!isOverlay && (
        <>
          <Separator />
          <CardFooter className="justify-end px-4 py-2">
            {!isRoadReady && onAdvance && (
              <Button
                variant="ghost"
                size="sm"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onAdvance(order.id);
                }}
              >
                {STAGES[order.stage + 1]} →
              </Button>
            )}
            {isRoadReady && onComplete && (
              <Button
                variant="ghost"
                size="sm"
                className="text-severity-routine hover:bg-severity-routine-bg hover:text-severity-routine"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete(order.id);
                }}
              >
                <span className="flex h-3.5 w-3.5">
                  <IconCheckFillDuo18 />
                </span>
                Mark complete
              </Button>
            )}
          </CardFooter>
        </>
      )}
    </Card>
  );
}
