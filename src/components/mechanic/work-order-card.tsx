"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Bus, WorkOrder } from "@/data/types";
import { buses } from "@/data/buses";
import { SEVERITY_COLORS, SEVERITY_LABELS, SEVERITY_ICONS, STAGES } from "@/lib/constants";
import { TimeDisplay } from "@/components/time-display";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IconCheckFillDuo18 } from "nucleo-ui-fill-duo-18";

interface WorkOrderCardProps {
  order: WorkOrder;
  onComplete?: (woId: string) => void;
  onSelectBus?: (bus: Bus) => void;
  onAdvance?: (woId: string) => void;
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
  onAdvance,
  isOverlay = false,
}: WorkOrderCardProps) {
  const sev = SEVERITY_COLORS[order.severity];

  // Hooks must be called unconditionally; pass a disabled flag for overlay renders.
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: order.id,
    disabled: isOverlay,
  });

  const isRoadReady = order.stage === 4;

  const handleClick = (e: React.MouseEvent) => {
    if (isOverlay || !onSelectBus) return;
    // @dnd-kit's 5px activation distance means short clicks don't fire a drag.
    // This onClick only runs on an actual click, not a drag release.
    e.stopPropagation();
    const bus = buses.find((b) => b.id === order.busId);
    if (bus) onSelectBus(bus);
  };

  return (
    <Card
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
      className="rounded-[16px] p-4"
      style={{
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
        <div className="mb-2.5">
          <Badge
            className="px-2 py-[2px]"
            style={{
              color: order.partsStatus === "available" ? "#166534" : "#92400e",
              background: order.partsStatus === "available" ? "#f0fdf4" : "#fffbeb",
            }}
          >
            {order.partsStatus === "available"
              ? "\u2713 Parts ready"
              : "\u23F3 Parts ordered"}
          </Badge>
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
            <Badge variant="muted" className="px-2 py-[2px]">
              Bay {order.bayNumber}
            </Badge>
          )}
          <Badge
            className="px-2 py-[2px] gap-1"
            style={{ color: sev.text, background: sev.bg }}
          >
            <span style={{ display: "flex", color: sev.dot, width: 14, height: 14 }}>
              {SEVERITY_ICONS[order.severity]}
            </span>
            {SEVERITY_LABELS[order.severity]}
          </Badge>
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

      {/* Advance action — shown on stages 0–3. Large tap target for dirty-hands tablet use. */}
      {!isRoadReady && onAdvance && !isOverlay && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onAdvance(order.id);
          }}
          className="mt-2.5 inline-flex w-full min-h-11 items-center justify-center gap-1.5 rounded-[10px] border border-transparent bg-[#f4f4f4] py-2.5 text-[13px] font-semibold text-[#444444] transition-colors hover:bg-[#ebebeb] cursor-pointer"
        >
          Move to {STAGES[order.stage + 1]} →
        </button>
      )}

      {/* Terminal Complete action — only on stage 4 (Road Ready). Subtle text link, not a CTA. */}
      {isRoadReady && onComplete && !isOverlay && (
        <button
          // Stop drag listeners from hijacking the click.
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onComplete(order.id);
          }}
          className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-[#bbf7d0] bg-transparent py-1.5 text-xs font-semibold text-[#166534] transition-colors hover:border-solid hover:bg-[#f0fdf4] cursor-pointer"
        >
          <span style={{ display: "flex", width: 14, height: 14 }}>
            <IconCheckFillDuo18 />
          </span>
          Mark complete
        </button>
      )}
    </Card>
  );
}
