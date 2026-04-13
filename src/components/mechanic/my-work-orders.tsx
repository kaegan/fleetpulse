"use client";

import { motion } from "framer-motion";
import type { PartsStatus, WorkOrder, WorkOrderStage } from "@/data/types";
import {
  SEVERITY_LABELS,
  SEVERITY_ICONS,
  STAGE_LABELS,
  PARTS_STATUS_LABELS,
  BLOCK_REASON_LABELS,
  isTerminalStage,
  nextStage,
  prevStage,
  getCrossDepotPartsTip,
} from "@/lib/constants";
import { StagePipeline } from "@/components/stage-pipeline";
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

interface MyWorkOrdersProps {
  workOrders: WorkOrder[];
  onStageChange: (woId: string, newStage: WorkOrderStage) => void;
  onComplete: (woId: string) => void;
  onSelectWorkOrder: (order: WorkOrder) => void;
  onUpdateParts: (woId: string, partsStatus: PartsStatus) => void;
  /** When set, cards get a layoutId for cross-view morph animations. */
  layoutPrefix?: string;
}

const LAYOUT_TRANSITION = { type: "spring", stiffness: 300, damping: 30 } as const;

export function MyWorkOrders({
  workOrders,
  onStageChange,
  onComplete,
  onSelectWorkOrder,
  onUpdateParts,
  layoutPrefix,
}: MyWorkOrdersProps) {
  if (workOrders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p
          style={{ fontSize: 15, fontWeight: 600, color: "#222222" }}
        >
          No work orders assigned
        </p>
        <p style={{ fontSize: 13, fontWeight: 500, color: "#929292" }}>
          Switch to Board to see what&rsquo;s happening across the garage,
          or log a new repair.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      {workOrders.map((order) => (
        <motion.div
          key={order.id}
          layoutId={layoutPrefix ? `${layoutPrefix}-${order.id}` : undefined}
          layout={!!layoutPrefix}
          transition={LAYOUT_TRANSITION}
        >
          <MyWorkOrderCard
            order={order}
            onStageChange={onStageChange}
            onComplete={onComplete}
            onSelectWorkOrder={onSelectWorkOrder}
            onUpdateParts={onUpdateParts}
          />
        </motion.div>
      ))}
    </div>
  );
}

// ─── Expanded task card ──────────────────────────────────────────────────────

function MyWorkOrderCard({
  order,
  onStageChange,
  onComplete,
  onSelectWorkOrder,
  onUpdateParts,
}: {
  order: WorkOrder;
  onStageChange: (woId: string, newStage: WorkOrderStage) => void;
  onComplete: (woId: string) => void;
  onSelectWorkOrder: (order: WorkOrder) => void;
  onUpdateParts: (woId: string, partsStatus: PartsStatus) => void;
}) {
  const terminal = isTerminalStage(order.stage);
  const isIntake = order.stage === "intake";
  const isHeld = order.isHeld === true;
  const next = nextStage(order.stage);
  const prev = prevStage(order.stage);

  const contextLine = (() => {
    if (isHeld) {
      const reason = order.blockReason
        ? BLOCK_REASON_LABELS[order.blockReason]
        : "Held";
      const eta = order.blockEta
        ? ` · ETA ${formatShortEta(order.blockEta)}`
        : "";
      const tip = getCrossDepotPartsTip(order.garage, order.blockReason);
      return `${reason}${eta}${tip ? ` · ${tip}` : ""}`;
    }
    if (isIntake) {
      return order.arrivalEta
        ? `Arriving ${formatShortEta(order.arrivalEta)}`
        : "En route";
    }
    const parts: string[] = [];
    if (order.bayNumber) parts.push(`Bay ${order.bayNumber}`);
    if (order.mechanicName) parts.push(order.mechanicName);
    return parts.join(" · ");
  })();

  return (
    <Card
      className={
        "cursor-pointer border shadow-card transition-all duration-150 hover:-translate-y-px hover:shadow-card-hover" +
        (isHeld ? " border-border" : " border-border")
      }
      style={isHeld ? { background: "#fff8f3" } : undefined}
      onClick={() => onSelectWorkOrder(order)}
    >
      {/* Header: Bus # + severity + time */}
      <CardHeader className="px-5 pb-3 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CardTitle className="text-lg tracking-tight">
              Bus #{order.busNumber}
            </CardTitle>
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
          </div>
          <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">
            <TimeDisplay isoDate={order.stageEnteredAt} />
          </span>
        </div>
        <CardDescription className="mt-1 text-[15px] leading-snug">
          {order.issue}
        </CardDescription>
      </CardHeader>

      {/* Stage pipeline */}
      <CardContent className="px-5 pb-4 pt-1">
        <StagePipeline
          currentStage={order.stage}
          severity={order.severity}
          isHeld={order.isHeld}
          size="lg"
          animated={false}
        />
      </CardContent>

      <Separator />

      {/* Meta: parts + context */}
      <CardContent className="px-5 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
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
          <span className="text-xs text-muted-foreground">
            <span className="font-mono">{order.id}</span>
            {contextLine && <span> · {contextLine}</span>}
          </span>
        </div>
      </CardContent>

      <Separator />

      {/* Action footer */}
      <CardFooter className={`px-5 py-2.5 ${prev ? "justify-between" : "justify-end"}`}>
        {prev && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onStageChange(order.id, prev);
            }}
          >
            &larr; {STAGE_LABELS[prev]}
          </Button>
        )}
        {!terminal && next && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onStageChange(order.id, next);
            }}
          >
            {STAGE_LABELS[next]} &rarr;
          </Button>
        )}
        {terminal && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onComplete(order.id);
            }}
          >
            Dismiss
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

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
