"use client";

import { WorkOrderCard } from "./work-order-card";
import { SectionPill } from "@/components/section-pill";
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
  Queued: <IconClipboardFillDuo18 />,
  Diagnosed: <IconMagnifierCheckFillDuo18 />,
  "Parts Ready": <IconBox2CheckFillDuo18 />,
  "In Repair": <IconWrenchFillDuo18 />,
  "QA Check": <IconBadgeCheckFillDuo18 />,
};

interface KanbanColumnProps {
  stageName: string;
  orders: WorkOrder[];
}

export function KanbanColumn({ stageName, orders }: KanbanColumnProps) {
  const pill = KANBAN_STAGE_PILLS[stageName] ?? { color: "#929292", bg: "#f5f5f5" };

  return (
    <div
      style={{
        background: "#fafaf9",
        borderRadius: 24,
        padding: 18,
        minHeight: 400,
        border: "1px solid rgba(0,0,0,0.04)",
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
          <WorkOrderCard key={wo.id} order={wo} />
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
            No work orders
          </div>
        )}
      </div>
    </div>
  );
}
