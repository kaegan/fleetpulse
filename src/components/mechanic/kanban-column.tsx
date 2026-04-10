"use client";

import { useDroppable } from "@dnd-kit/core";
import { WorkOrderCard } from "./work-order-card";
import { SectionPill } from "@/components/section-pill";
import { Card } from "@/components/ui/card";
import { KANBAN_STAGE_PILLS } from "@/lib/constants";
import type { Bus, WorkOrder } from "@/data/types";
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
  onSelectBus?: (bus: Bus) => void;
  onAdvance: (woId: string) => void;
  /** Responsive layout classes applied by the parent board. */
  className?: string;
}

export function KanbanColumn({
  stageId,
  stageName,
  orders,
  onComplete,
  onSelectBus,
  onAdvance,
  className = "",
}: KanbanColumnProps) {
  const pill = KANBAN_STAGE_PILLS[stageName] ?? { color: "#929292", bg: "#f5f5f5" };
  const { setNodeRef, isOver } = useDroppable({ id: stageId });

  return (
    <Card
      ref={setNodeRef}
      className={`rounded-[24px] p-3.5 min-h-[320px] sm:p-4 sm:min-h-[360px] lg:p-[18px] lg:min-h-[400px] ${className}`}
      style={{
        background: isOver ? "#f5e7e2" : "#fafaf9",
        border: isOver ? "1px dashed #d4654a" : "1px solid rgba(0,0,0,0.04)",
        transition: "background 120ms ease, border-color 120ms ease",
      }}
    >
      {/* Column header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <SectionPill
          label={stageName}
          color={pill.color}
          bgColor={pill.bg}
          icon={STAGE_ICONS[stageName]}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            background: orders.length > 0 ? pill.bg : "transparent",
            color: orders.length > 0 ? pill.color : "transparent",
            padding: "3px 10px",
            borderRadius: 999,
            minWidth: 20,
            textAlign: "center",
          }}
        >
          {orders.length}
        </span>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {orders.map((wo) => (
          <WorkOrderCard
            key={wo.id}
            order={wo}
            onComplete={onComplete}
            onSelectBus={onSelectBus}
            onAdvance={onAdvance}
          />
        ))}
        {orders.length === 0 && (
          <div
            style={{
              padding: 24,
              textAlign: "center",
              fontSize: 13,
              fontWeight: 500,
              color: "#b5b5b5",
            }}
          >
            {isOver ? "Drop to move here" : "No work orders"}
          </div>
        )}
      </div>
    </Card>
  );
}
