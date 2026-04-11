"use client";

import { useDroppable } from "@dnd-kit/core";
import { WorkOrderCard } from "./work-order-card";
import { SectionPill } from "@/components/section-pill";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { KANBAN_STAGE_PILLS } from "@/lib/constants";
import type { WorkOrder } from "@/data/types";
import {
  IconClipboardFillDuo18,
  IconMagnifierCheckFillDuo18,
  IconBox2CheckFillDuo18,
  IconWrenchFillDuo18,
  IconBadgeCheckFillDuo18,
} from "nucleo-ui-fill-duo-18";

const STAGE_ICONS: Record<string, React.ReactNode> = {
  Intake: <IconClipboardFillDuo18 />,
  Diagnosing: <IconMagnifierCheckFillDuo18 />,
  "Parts Ready": <IconBox2CheckFillDuo18 />,
  "In Repair": <IconWrenchFillDuo18 />,
  "Road Ready": <IconBadgeCheckFillDuo18 />,
};

interface KanbanColumnProps {
  stageId: string;
  stageName: string;
  orders: WorkOrder[];
  onComplete: (woId: string) => void;
  onSelectWorkOrder?: (order: WorkOrder) => void;
  onAdvance: (woId: string) => void;
  /** Responsive layout classes applied by the parent board. */
  className?: string;
}

export function KanbanColumn({
  stageId,
  stageName,
  orders,
  onComplete,
  onSelectWorkOrder,
  onAdvance,
  className = "",
}: KanbanColumnProps) {
  const pill = KANBAN_STAGE_PILLS[stageName] ?? { color: "#929292", bg: "#f5f5f5" };
  const { setNodeRef, isOver } = useDroppable({ id: stageId });

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "min-h-80 rounded-lg border p-3.5 transition-colors duration-150 sm:p-4 lg:min-h-96 lg:p-3 xl:p-4",
        isOver
          ? "border-dashed border-brand bg-[#f5e7e2]"
          : "border-black/[0.04] bg-surface-hover",
        className
      )}
    >
      {/* Column header */}
      <div className="mb-3.5 flex items-center justify-between gap-2">
        <SectionPill
          label={stageName}
          color={pill.color}
          bgColor={pill.bg}
          icon={STAGE_ICONS[stageName]}
        />
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
          <WorkOrderCard
            key={wo.id}
            order={wo}
            onComplete={onComplete}
            onSelectWorkOrder={onSelectWorkOrder}
            onAdvance={onAdvance}
          />
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
