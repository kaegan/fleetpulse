"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { KanbanColumn } from "./kanban-column";
import { WorkOrderCard } from "./work-order-card";
import { STAGE_ORDER, STAGE_LABELS, nextStage } from "@/lib/constants";
import type {
  PartsStatus,
  WorkOrder,
  WorkOrderStage,
} from "@/data/types";

interface KanbanBoardProps {
  workOrders: WorkOrder[];
  onStageChange: (woId: string, newStage: WorkOrderStage) => void;
  onComplete: (woId: string) => void;
  onSelectWorkOrder?: (order: WorkOrder) => void;
  onUpdateParts: (woId: string, partsStatus: PartsStatus) => void;
  /** When set, cards get a layoutId for cross-view morph animations. */
  layoutPrefix?: string;
}

export function KanbanBoard({
  workOrders,
  onStageChange,
  onComplete,
  onSelectWorkOrder,
  onUpdateParts,
  layoutPrefix,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Desktop: 5px activation distance so clicks on interactive children aren't hijacked.
  // Mobile: 250ms hold delay before drag activates (Notion-style), so touch-scrolling
  // the board isn't blocked. If the finger moves >5px during the hold, it's a scroll.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const activeOrder = activeId
    ? workOrders.find((wo) => wo.id === activeId) ?? null
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const woId = String(active.id);
    const targetStage = String(over.id).replace("stage-", "") as WorkOrderStage;
    if (!STAGE_ORDER.includes(targetStage)) return;
    const order = workOrders.find((wo) => wo.id === woId);
    if (!order || order.stage === targetStage) return;

    onStageChange(woId, targetStage);
  };

  const handleDragCancel = () => setActiveId(null);

  // Disable scroll-snap and scroll-smooth while a drag is active so dnd-kit's
  // auto-scroll can pan smoothly across columns without the browser snapping
  // back mid-drag or smoothing per-frame scroll increments.
  const idleScrollClasses = activeId ? "" : "scroll-smooth snap-x snap-proximity";

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        className={`-mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:gap-2.5 sm:px-6 xl:mx-0 xl:grid xl:grid-cols-5 xl:gap-3 xl:overflow-visible xl:px-0 ${idleScrollClasses}`}
      >
        {STAGE_ORDER.map((stage) => {
          const stageOrders = workOrders.filter((wo) => wo.stage === stage);
          const next = nextStage(stage);
          return (
            <KanbanColumn
              key={stage}
              stageId={`stage-${stage}`}
              stage={stage}
              stageName={STAGE_LABELS[stage]}
              orders={stageOrders}
              className="w-72 shrink-0 snap-center xl:w-auto xl:min-w-0 xl:shrink"
              onComplete={onComplete}
              onSelectWorkOrder={onSelectWorkOrder}
              onUpdateParts={onUpdateParts}
              onAdvance={(woId) => {
                if (next) onStageChange(woId, next);
              }}
              layoutPrefix={layoutPrefix}
            />
          );
        })}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeOrder ? (
          <div style={{ transform: "rotate(2deg)", cursor: "grabbing" }}>
            <WorkOrderCard order={activeOrder} isOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
