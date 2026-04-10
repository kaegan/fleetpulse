"use client";

import { WorkOrderCard } from "./work-order-card";
import type { WorkOrder } from "@/data/types";

interface KanbanColumnProps {
  stageName: string;
  orders: WorkOrder[];
}

export function KanbanColumn({ stageName, orders }: KanbanColumnProps) {
  return (
    <div
      style={{
        background: "#fafaf9",
        borderRadius: 20,
        padding: 14,
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
          paddingBottom: 10,
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase" as const,
            letterSpacing: "0.06em",
            color: "#929292",
          }}
        >
          {stageName}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            background: orders.length > 0 ? "#f2f2f2" : "transparent",
            color: orders.length > 0 ? "#6a6a6a" : "transparent",
            padding: "3px 8px",
            borderRadius: 10,
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
