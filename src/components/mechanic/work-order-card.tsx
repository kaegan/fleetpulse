"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Bus, WorkOrder } from "@/data/types";
import { buses } from "@/data/buses";
import { SEVERITY_COLORS, SEVERITY_LABELS, SEVERITY_ICONS } from "@/lib/constants";
import { TimeDisplay } from "@/components/time-display";
import { IconCheckFillDuo18 } from "nucleo-ui-fill-duo-18";

interface WorkOrderCardProps {
  order: WorkOrder;
  onComplete?: (woId: string) => void;
  onSelectBus?: (bus: Bus) => void;
  /** When rendered inside a DragOverlay we skip the draggable hook and any hover styles. */
  isOverlay?: boolean;
}

const RESTING_SHADOW =
  "0px 0px 0px 1px rgba(0,0,0,0.02), 0px 2px 4px rgba(0,0,0,0.03), 0px 3px 6px rgba(0,0,0,0.04)";
const HOVER_SHADOW =
  "0px 0px 0px 1px rgba(0,0,0,0.04), 0px 4px 10px rgba(0,0,0,0.06), 0px 8px 16px rgba(0,0,0,0.05)";

export function WorkOrderCard({
  order,
  onComplete,
  onSelectBus,
  isOverlay = false,
}: WorkOrderCardProps) {
  const sev = SEVERITY_COLORS[order.severity];

  // Hooks must be called unconditionally; pass a disabled flag for overlay renders.
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: order.id,
    disabled: isOverlay,
  });

  const isQaCheck = order.stage === 4;

  const handleClick = (e: React.MouseEvent) => {
    if (isOverlay || !onSelectBus) return;
    // @dnd-kit's 5px activation distance means short clicks don't fire a drag.
    // This onClick only runs on an actual click, not a drag release.
    e.stopPropagation();
    const bus = buses.find((b) => b.id === order.busId);
    if (bus) onSelectBus(bus);
  };

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      {...(isOverlay ? {} : listeners)}
      {...(isOverlay ? {} : attributes)}
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (isOverlay || isDragging) return;
        e.currentTarget.style.boxShadow = HOVER_SHADOW;
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        if (isOverlay) return;
        e.currentTarget.style.boxShadow = RESTING_SHADOW;
        e.currentTarget.style.transform = "translateY(0)";
      }}
      style={{
        background: "#ffffff",
        borderRadius: 16,
        padding: "14px 16px",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: isOverlay
          ? "0px 10px 30px rgba(0,0,0,0.15), 0px 4px 12px rgba(0,0,0,0.1)"
          : RESTING_SHADOW,
        cursor: isOverlay ? "grabbing" : "grab",
        opacity: isDragging && !isOverlay ? 0 : 1,
        touchAction: "none",
        userSelect: "none",
        transition: "box-shadow 150ms ease, transform 150ms ease",
      }}
    >
      {/* Top row: Bus number + time */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "#222222",
            letterSpacing: "-0.02em",
          }}
        >
          Bus #{order.busNumber}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#929292",
          }}
        >
          <TimeDisplay isoDate={order.stageEnteredAt} />
        </span>
      </div>

      {/* Issue description */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "#6a6a6a",
          marginBottom: 10,
          lineHeight: 1.4,
        }}
      >
        {order.issue}
      </div>

      {/* Parts status */}
      {order.partsStatus !== "n/a" && (
        <div style={{ marginBottom: 10 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color:
                order.partsStatus === "available" ? "#166534" : "#92400e",
              background:
                order.partsStatus === "available" ? "#f0fdf4" : "#fffbeb",
              padding: "2px 8px",
              borderRadius: 999,
            }}
          >
            {order.partsStatus === "available"
              ? "\u2713 Parts ready"
              : "\u23F3 Parts ordered"}
          </span>
        </div>
      )}

      {/* Bottom row: WO ID + severity badge + bay */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "#b5b5b5",
            fontFamily: "monospace",
          }}
        >
          {order.id}
        </span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {order.bayNumber && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#6a6a6a",
                background: "#f2f2f2",
                padding: "2px 8px",
                borderRadius: 999,
              }}
            >
              Bay {order.bayNumber}
            </span>
          )}
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: sev.text,
              background: sev.bg,
              padding: "2px 8px",
              borderRadius: 999,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span style={{ display: "flex", color: sev.dot, width: 14, height: 14 }}>{SEVERITY_ICONS[order.severity]}</span>
            {SEVERITY_LABELS[order.severity]}
          </span>
        </div>
      </div>

      {/* Mechanic name if assigned */}
      {order.mechanicName && (
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: "1px solid rgba(0,0,0,0.04)",
            fontSize: 12,
            fontWeight: 500,
            color: "#929292",
          }}
        >
          {order.mechanicName}
        </div>
      )}

      {/* Terminal Complete action — only on stage 4 (QA Check). Subtle text link, not a CTA. */}
      {isQaCheck && onComplete && !isOverlay && (
        <button
          // Stop drag listeners from hijacking the click.
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onComplete(order.id);
          }}
          style={{
            marginTop: 10,
            width: "100%",
            padding: "6px 0",
            fontSize: 12,
            fontWeight: 600,
            color: "#166534",
            background: "transparent",
            border: "1px dashed #bbf7d0",
            borderRadius: 10,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f0fdf4";
            e.currentTarget.style.borderStyle = "solid";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderStyle = "dashed";
          }}
        >
          <span style={{ display: "flex", width: 14, height: 14 }}>
            <IconCheckFillDuo18 />
          </span>
          Mark complete
        </button>
      )}
    </div>
  );
}
