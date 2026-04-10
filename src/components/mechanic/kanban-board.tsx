"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { KanbanColumn } from "./kanban-column";
import { WorkOrderCard } from "./work-order-card";
import { STAGES } from "@/lib/constants";
import type { Bus, WorkOrder, WorkOrderStage } from "@/data/types";

interface KanbanBoardProps {
  workOrders: WorkOrder[];
  onStageChange: (woId: string, newStage: WorkOrderStage) => void;
  onComplete: (woId: string) => void;
  onSelectBus?: (bus: Bus) => void;
}

export function KanbanBoard({
  workOrders,
  onStageChange,
  onComplete,
  onSelectBus,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // 5px activation distance so clicks on interactive children aren't hijacked as drags.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
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
    const targetStage = Number(String(over.id).replace("stage-", "")) as WorkOrderStage;
    const order = workOrders.find((wo) => wo.id === woId);
    if (!order || order.stage === targetStage) return;

    onStageChange(woId, targetStage);
  };

  const handleDragCancel = () => setActiveId(null);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 12,
        }}
      >
        {STAGES.map((stage, idx) => {
          const stageOrders = workOrders.filter(
            (wo) => wo.stage === (idx as WorkOrderStage)
          );
          return (
            <KanbanColumn
              key={stage}
              stageId={`stage-${idx}`}
              stageName={stage}
              orders={stageOrders}
              onComplete={onComplete}
              onSelectBus={onSelectBus}
              onAdvance={(woId) => {
                if (idx < STAGES.length - 1) {
                  onStageChange(woId, (idx + 1) as WorkOrderStage);
                }
              }}
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
