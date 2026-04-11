"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkOrders } from "@/contexts/work-orders-context";
import { triageRationales } from "@/data/triage-rationales";
import { getTopTriageRecommendations } from "@/lib/triage";
import { useDepot, filterByDepot } from "@/hooks/use-depot";
import { SEVERITY_COLORS, SEVERITY_LABELS, SEVERITY_ICONS } from "@/lib/constants";
import type { WorkOrder } from "@/data/types";

interface TriagePanelProps {
  onSelectWorkOrder?: (order: WorkOrder) => void;
}

const SCOPE_SUFFIX: Record<"all" | "north" | "south", string> = {
  all: "across both garages",
  north: "in North Garage",
  south: "in South Garage",
};

const SKIP_REASONS = ["Already on it", "Lower priority", "Wrong info"] as const;
type SkipReason = (typeof SKIP_REASONS)[number];

type RowState =
  | { status: "open" }
  | { status: "skipping" } // showing reason chips
  | { status: "accepted" }
  | { status: "skipped"; reason: SkipReason };

export function TriagePanel({ onSelectWorkOrder }: TriagePanelProps) {
  const { scope } = useDepot();
  const { workOrders } = useWorkOrders();

  // Top 3 picks are computed once per render against the scoped work orders.
  // We deliberately do NOT recompute after a row is dismissed — the user
  // dismissed *these specific* recommendations, the panel shouldn't quietly
  // backfill more.
  const recommendations = useMemo(() => {
    const scoped = filterByDepot(workOrders, scope);
    return getTopTriageRecommendations(scoped, 3);
  }, [scope, workOrders]);

  // Per-row state. Keyed by WO id, scoped to mount — no persistence.
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});

  const setState = (id: string, state: RowState) =>
    setRowStates((prev) => ({ ...prev, [id]: state }));

  const reset = () => setRowStates({});

  const visible = recommendations.filter(({ wo }) => {
    const s = rowStates[wo.id];
    return !s || s.status === "open" || s.status === "skipping";
  });

  const allDismissed =
    recommendations.length > 0 && visible.length === 0;

  if (recommendations.length === 0) {
    return null; // No active triage candidates — don't render the panel at all.
  }

  return (
    <Card className="mb-6 rounded-lg p-5 shadow-card sm:p-6">
      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#222222",
            letterSpacing: "-0.02em",
            margin: 0,
            marginBottom: 4,
          }}
        >
          What to fix first
        </h2>
        <p
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "#929292",
            margin: 0,
          }}
        >
          Auto-prioritized from severity, age in stage, and parts state &middot;{" "}
          {recommendations.length} suggestion
          {recommendations.length === 1 ? "" : "s"} {SCOPE_SUFFIX[scope]}
        </p>
      </div>

      {/* Recommendation rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <AnimatePresence initial={false}>
          {recommendations.map(({ wo }, idx) => {
            const state = rowStates[wo.id] ?? { status: "open" };
            if (state.status === "accepted" || state.status === "skipped") {
              return null;
            }
            return (
              <RecommendationRow
                key={wo.id}
                wo={wo}
                rank={idx + 1}
                rationale={triageRationales[wo.id] ?? ""}
                state={state}
                onShowReasons={() => setState(wo.id, { status: "skipping" })}
                onCancelReasons={() => setState(wo.id, { status: "open" })}
                onAccept={() => setState(wo.id, { status: "accepted" })}
                onSkip={(reason) =>
                  setState(wo.id, { status: "skipped", reason })
                }
                onSelect={() => onSelectWorkOrder?.(wo)}
              />
            );
          })}
        </AnimatePresence>

        {allDismissed && (
          <DismissedState
            counts={tallyDismissals(rowStates)}
            onReset={reset}
          />
        )}
      </div>
    </Card>
  );
}

interface RecommendationRowProps {
  wo: WorkOrder;
  rank: number;
  rationale: string;
  state: RowState;
  onShowReasons: () => void;
  onCancelReasons: () => void;
  onAccept: () => void;
  onSkip: (reason: SkipReason) => void;
  onSelect: () => void;
}

function RecommendationRow({
  wo,
  rank,
  rationale,
  state,
  onShowReasons,
  onCancelReasons,
  onAccept,
  onSkip,
  onSelect,
}: RecommendationRowProps) {
  const sev = SEVERITY_COLORS[wo.severity];
  const showingReasons = state.status === "skipping";

  // Stop click bubbling so action buttons don't trigger the row's onSelect.
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      onClick={onSelect}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "12px 14px",
        borderRadius: 12,
        background: "#fafaf9",
        border: "1px solid #f0f0f0",
        cursor: "pointer",
        transition: "background 0.12s ease-out, border-color 0.12s ease-out",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#f5f5f4";
        e.currentTarget.style.borderColor = "#e5e5e5";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#fafaf9";
        e.currentTarget.style.borderColor = "#f0f0f0";
      }}
    >
      {/* Top row: rank + bus + WO id + severity + actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 20,
            height: 20,
            borderRadius: 999,
            background: "#fdf0ed",
            color: "#d4654a",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            flexShrink: 0,
          }}
        >
          {rank}
        </span>

        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#222222",
            letterSpacing: "-0.02em",
          }}
        >
          Bus #{wo.busNumber}
        </span>

        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "#b5b5b5",
            fontFamily: "monospace",
          }}
        >
          {wo.id}
        </span>

        <Badge
          className="px-2 py-[2px] gap-1 text-[10px]"
          style={{ color: sev.text, background: sev.bg }}
        >
          <span
            style={{
              display: "flex",
              color: sev.dot,
              width: 12,
              height: 12,
            }}
          >
            {SEVERITY_ICONS[wo.severity]}
          </span>
          {SEVERITY_LABELS[wo.severity]}
        </Badge>

        {/* Spacer pushes actions to the right on wider rows */}
        <div style={{ flex: 1, minWidth: 0 }} />

        {/* Action buttons / reason chips */}
        {!showingReasons && (
          <div
            onClick={stop}
            style={{ display: "flex", gap: 6, flexShrink: 0 }}
          >
            <button
              type="button"
              onClick={(e) => {
                stop(e);
                onAccept();
              }}
              style={{
                all: "unset",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                color: "#166534",
                background: "#f0fdf4",
                padding: "4px 10px",
                borderRadius: 999,
                transition: "background 0.12s ease-out",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#dcfce7";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f0fdf4";
              }}
            >
              Got it
            </button>
            <button
              type="button"
              onClick={(e) => {
                stop(e);
                onShowReasons();
              }}
              style={{
                all: "unset",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                color: "#6a6a6a",
                background: "#f0f0f0",
                padding: "4px 10px",
                borderRadius: 999,
                transition: "background 0.12s ease-out",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#e5e5e5";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f0f0f0";
              }}
            >
              Skip
            </button>
          </div>
        )}
      </div>

      {/* Rationale text */}
      <p
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "#4a4a4a",
          lineHeight: 1.5,
          margin: 0,
          marginLeft: 30,
        }}
      >
        {rationale}
      </p>

      {/* Reason chips — shown after Skip is pressed */}
      <AnimatePresence>
        {showingReasons && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={stop}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
              marginLeft: 30,
              marginTop: 2,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#929292",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginRight: 4,
              }}
            >
              Why skip?
            </span>
            {SKIP_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={(e) => {
                  stop(e);
                  onSkip(reason);
                }}
                style={{
                  all: "unset",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#4a4a4a",
                  background: "#ffffff",
                  border: "1px solid #e5e5e5",
                  padding: "3px 10px",
                  borderRadius: 999,
                  transition:
                    "background 0.12s ease-out, border-color 0.12s ease-out",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fdf0ed";
                  e.currentTarget.style.borderColor = "#d4654a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.borderColor = "#e5e5e5";
                }}
              >
                {reason}
              </button>
            ))}
            <button
              type="button"
              onClick={(e) => {
                stop(e);
                onCancelReasons();
              }}
              style={{
                all: "unset",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 500,
                color: "#929292",
                padding: "3px 6px",
              }}
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface DismissedStateProps {
  counts: { accepted: number; skipped: number };
  onReset: () => void;
}

function DismissedState({ counts, onReset }: DismissedStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22 }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 14px",
        borderRadius: 12,
        background: "#fafaf9",
        border: "1px dashed #e5e5e5",
        flexWrap: "wrap",
      }}
    >
      <p
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "#6a6a6a",
          margin: 0,
        }}
      >
        You&apos;ve reviewed all suggestions
        {counts.accepted > 0 || counts.skipped > 0 ? " — " : "."}
        {counts.accepted > 0 && (
          <span style={{ color: "#166534", fontWeight: 600 }}>
            {counts.accepted} acknowledged
          </span>
        )}
        {counts.accepted > 0 && counts.skipped > 0 && (
          <span style={{ color: "#929292" }}>, </span>
        )}
        {counts.skipped > 0 && (
          <span style={{ color: "#6a6a6a", fontWeight: 600 }}>
            {counts.skipped} skipped
          </span>
        )}
      </p>
      <button
        type="button"
        onClick={onReset}
        style={{
          all: "unset",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 600,
          color: "#d4654a",
          padding: "4px 10px",
          borderRadius: 999,
          transition: "background 0.12s ease-out",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#fdf0ed";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        Reset
      </button>
    </motion.div>
  );
}

function tallyDismissals(rowStates: Record<string, RowState>): {
  accepted: number;
  skipped: number;
} {
  let accepted = 0;
  let skipped = 0;
  for (const state of Object.values(rowStates)) {
    if (state.status === "accepted") accepted++;
    if (state.status === "skipped") skipped++;
  }
  return { accepted, skipped };
}
