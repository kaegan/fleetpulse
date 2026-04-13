"use client";

import { motion } from "framer-motion";
import { useDroppable } from "@dnd-kit/core";
import { WorkOrderCard } from "./work-order-card";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { KANBAN_STAGE_PILLS } from "@/lib/constants";
import type { PartsStatus, WorkOrder, WorkOrderStage } from "@/data/types";
import {
  IconTruckFillDuo18,
  IconMagnifierCheckFillDuo18,
  IconWrenchFillDuo18,
  IconBadgeCheckFillDuo18,
  IconCheckFillDuo18,
} from "nucleo-ui-fill-duo-18";

const STAGE_ICONS: Record<WorkOrderStage, React.ReactNode> = {
  intake: <IconTruckFillDuo18 />,
  triage: <IconMagnifierCheckFillDuo18 />,
  repair: <IconWrenchFillDuo18 />,
  "road-test": <IconBadgeCheckFillDuo18 />,
  done: <IconCheckFillDuo18 />,
};

const LAYOUT_TRANSITION = { type: "spring", stiffness: 300, damping: 30 } as const;

interface KanbanColumnProps {
  stageId: string;
  stage: WorkOrderStage;
  stageName: string;
  orders: WorkOrder[];
  onComplete: (woId: string) => void;
  onSelectWorkOrder?: (order: WorkOrder) => void;
  onAdvance: (woId: string) => void;
  onUpdateParts: (woId: string, partsStatus: PartsStatus) => void;
  /** Responsive layout classes applied by the parent board. */
  className?: string;
  /** When set, cards get a layoutId for cross-view morph animations. */
  layoutPrefix?: string;
}

export function KanbanColumn({
  stageId,
  stage,
  stageName,
  orders,
  onComplete,
  onSelectWorkOrder,
  onAdvance,
  onUpdateParts,
  className = "",
  layoutPrefix,
}: KanbanColumnProps) {
  const pill = KANBAN_STAGE_PILLS[stage];
  const { setNodeRef, isOver } = useDroppable({ id: stageId });

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "min-h-80 rounded-lg border p-3.5 transition-colors duration-150 sm:p-4 xl:min-h-96 xl:p-3 2xl:p-4",
        isOver
          ? "border-dashed border-brand bg-brand-light"
          : "border-border bg-secondary",
        className
      )}
    >
      {/* Column header */}
      <div className="mb-3.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="flex h-[14px] w-[14px] shrink-0 items-center justify-center text-[#a0a0a0] [&>svg]:h-[14px] [&>svg]:w-[14px]">
            {STAGE_ICONS[stage]}
          </span>
          <span className="text-[12px] font-semibold text-[#6a6a6a] tracking-[0.01em] truncate">
            {stageName}
          </span>
        </div>
        <span
          className="min-w-5 shrink-0 rounded-full px-2.5 py-[3px] text-center text-[11px] font-bold"
          style={{
            background: orders.length > 0 ? pill.bg : "transparent",
            color: orders.length > 0 ? pill.color : "transparent",
          }}
        >
          {orders.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2.5">
        {orders.map((wo) => (
          <motion.div
            key={wo.id}
            layoutId={layoutPrefix ? `${layoutPrefix}-${wo.id}` : undefined}
            layout={!!layoutPrefix}
            transition={LAYOUT_TRANSITION}
          >
            <WorkOrderCard
              order={wo}
              onComplete={onComplete}
              onSelectWorkOrder={onSelectWorkOrder}
              onAdvance={onAdvance}
              onUpdateParts={onUpdateParts}
            />
          </motion.div>
        ))}
        {orders.length === 0 && (
          <div className="p-6 text-center text-[13px] font-medium text-text-faint">
            {isOver ? "Drop to move here" : "No work orders"}
          </div>
        )}
      </div>
    </Card>
  );
}
