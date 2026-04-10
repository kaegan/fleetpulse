"use client";

import { KanbanColumn } from "./kanban-column";
import { STAGES } from "@/lib/constants";
import type { WorkOrder, WorkOrderStage } from "@/data/types";

interface KanbanBoardProps {
  workOrders: WorkOrder[];
  onAdvance?: (woId: string) => void;
}

export function KanbanBoard({ workOrders, onAdvance }: KanbanBoardProps) {
  return (
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
            stageName={stage}
            orders={stageOrders}
            onAdvance={onAdvance}
          />
        );
      })}
    </div>
  );
}
