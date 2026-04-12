"use client";

import { useCallback, useRef, useState } from "react";

export interface NavEntry {
  /**
   * Discriminant used by consumers to decide which panel content to render.
   * E.g. `"bus" | "workOrder" | "historyEntry"`.
   */
  kind: string;
  /**
   * Short destination noun rendered in the NEXT panel's back button as
   * `Back to {label}`. E.g. `"PM Due"`, `"WO-90123"`, `"Bus #4012"`.
   * Keep it short — the back button is a breadcrumb, not a sentence.
   */
  label: string;
}

export interface BackButtonProps {
  label: string;
  onBack: () => void;
}

export interface UsePanelNavResult<T extends NavEntry> {
  /**
   * Top-of-stack entry, or `null` when nothing is open.
   * Consumers gate their panel content on this being the expected kind.
   */
  current: T | null;
  /**
   * Back-button props for whichever panel `current` represents, or
   * `null` when there's nothing beneath (the user arrived here via
   * `open`, not `drill`).
   */
  backButton: BackButtonProps | null;
  /**
   * Root entry: resets the stack to a single entry. Use when the click
   * is starting a fresh navigation (KPI strip → list, tracker → WO).
   */
  open: (entry: T) => void;
  /**
   * Push a new entry on top of whatever is currently visible, wiring
   * up the back button automatically. If nothing is open, behaves
   * exactly like `open`.
   */
  drill: (entry: T) => void;
  /**
   * Dismiss everything — used by the sheet's close (X) button.
   */
  close: () => void;
}

/**
 * Shared stack-based drill-down nav for right-side sheet panels.
 *
 * Each view declares its own discriminated union of entry types
 * (`{ kind: string; label: string; ...payload }`) and the hook handles
 * stack management. Consumers render a single sheet that stays open
 * throughout navigation — content transitions in-place, so there is no
 * close/open animation cycle when drilling between panel types.
 *
 * Design notes:
 * - Full stack instead of single-level undo, so multi-hop drills
 *   (list → bus → WO → bus-again) get a correct back history for free
 *   without per-pair handler plumbing.
 * - `open` resets the stack; `drill` preserves it. Every drill-down
 *   click handler just calls `drill(entry)` — no per-pair "fromX"
 *   closure capture needed.
 * - stackRef is a synchronous mirror of `stack` so imperative handlers
 *   (drill, back) can read the current stack without stale-closure
 *   hazards between React's render phase and the commit phase.
 *
 * @example
 * type OpsEntry =
 *   | { kind: "busList"; label: string; busListKind: BusListKind }
 *   | { kind: "bus"; label: string; bus: Bus }
 *   | { kind: "workOrder"; label: string; workOrder: WorkOrder };
 *
 * const nav = usePanelNav<OpsEntry>();
 * // List → bus:
 * const onSelectBusFromList = (bus: Bus) =>
 *   nav.drill({ kind: "bus", label: `Bus #${bus.busNumber}`, bus });
 */
export function usePanelNav<T extends NavEntry>(): UsePanelNavResult<T> {
  const [stack, setStack] = useState<T[]>([]);
  // Synchronous mirror of `stack` so imperative handlers (drill, back)
  // can read the current stack without stale-closure hazards.
  const stackRef = useRef<T[]>(stack);

  const transition = useCallback((next: T[]) => {
    stackRef.current = next;
    setStack(next);
  }, []);

  const open = useCallback(
    (entry: T) => transition([entry]),
    [transition]
  );

  const drill = useCallback(
    (entry: T) => transition([...stackRef.current, entry]),
    [transition]
  );

  const close = useCallback(() => transition([]), [transition]);

  const back = useCallback(() => {
    const prev = stackRef.current;
    if (prev.length <= 1) {
      transition([]);
    } else {
      transition(prev.slice(0, -1));
    }
  }, [transition]);

  const current = stack.length === 0 ? null : stack[stack.length - 1];
  const previous = stack.length >= 2 ? stack[stack.length - 2] : null;
  const backButton: BackButtonProps | null = previous
    ? { label: `Back to ${previous.label}`, onBack: back }
    : null;

  return { current, backButton, open, drill, close };
}
