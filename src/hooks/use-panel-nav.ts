"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Time we give Radix Presence to run the sheet's exit animation before
 * mounting the next one on top. Sheet close animation is 300ms (see
 * `data-[state=closed]:duration-300` in sheet.tsx); 20ms buffer covers
 * scheduler jitter so the outgoing sheet is fully unmounted before the
 * incoming one begins its entrance.
 */
const SWAP_DELAY_MS = 320;

export interface NavEntry {
  /**
   * Discriminant used to decide whether a transition requires the 320ms
   * Radix Presence swap (cross-panel) or can update content in place
   * (same-panel). Consumers already provide this via their discriminated
   * union (e.g. `"bus" | "workOrder" | "historyEntry"`).
   */
  kind: string;
  /**
   * Short destination noun rendered in the NEXT panel's back button as
   * `Back to {label}`. E.g. `"PM Due"`, `"WO-90123"`, `"Bus #4012"`,
   * `"Pull In Next"`. Keep it short — the back button is a breadcrumb,
   * not a sentence.
   */
  label: string;
}

export interface BackButtonProps {
  label: string;
  onBack: () => void;
}

export interface UsePanelNavResult<T extends NavEntry> {
  /**
   * Top-of-stack entry, or `null` when either (a) nothing is open, or
   * (b) we're mid-swap between two panels and the outgoing one hasn't
   * finished its exit animation yet. Consumers gate their panel's
   * `open` prop on this being the expected kind.
   */
  current: T | null;
  /**
   * Back-button props for whichever panel `current` represents, or
   * `null` when there's nothing beneath (the user arrived here via
   * `open`, not `drill`). Already includes the `"Back to "` prefix.
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
   * Dismiss everything — used by each sheet's close (X) button.
   */
  close: () => void;
}

/**
 * Shared stack-based drill-down nav for right-side sheet panels.
 *
 * Each view declares its own discriminated union of entry types
 * (`{ kind: string; label: string; ...payload }`) and the hook handles
 * stack management + the 320ms Radix Presence handoff between sheets.
 *
 * Design notes:
 * - Full stack instead of single-level undo, so multi-hop drills
 *   (list → bus → WO → bus-again) get a correct back history for free
 *   without per-pair handler plumbing.
 * - The 320ms hiatus is implemented by blanking `current` via an
 *   `isSwapping` flag. During the hiatus, any panel reading `current`
 *   sees `null` and closes; once the flag flips, the target panel
 *   mounts. This keeps Radix from orphaning the outgoing sheet's exit
 *   animation when a second sheet would otherwise mount on top.
 * - `open` resets the stack; `drill` preserves it. Every drill-down
 *   click handler just calls `drill(entry)` — no per-pair "fromX"
 *   closure capture needed.
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
  const [isSwapping, setIsSwapping] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Synchronous mirror of `stack` so imperative handlers (drill, back)
  // can read the current stack without stale-closure hazards between
  // React's render phase and the commit phase. Updated inline in
  // `transition`, before the setState call.
  const stackRef = useRef<T[]>(stack);

  const cancelPending = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Cleanup any in-flight swap timer if the hosting view unmounts
  // mid-animation — prevents setState-after-unmount warnings.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const transition = useCallback(
    (next: T[]) => {
      cancelPending();
      const prev = stackRef.current;
      const prevTop = prev[prev.length - 1];
      const nextTop = next[next.length - 1];
      stackRef.current = next;
      // Cross-panel swap: something is already showing AND something new
      // is entering AND it's a different panel type (kind). First-mount,
      // dismiss, and same-kind transitions flip synchronously so click →
      // content stays snappy — no close/open animation for card-to-card.
      const needsSwap =
        prev.length > 0 &&
        next.length > 0 &&
        prevTop?.kind !== nextTop?.kind;
      setStack(next);
      setIsSwapping(needsSwap);
      if (needsSwap) {
        timerRef.current = setTimeout(() => {
          setIsSwapping(false);
          timerRef.current = null;
        }, SWAP_DELAY_MS);
      }
    },
    [cancelPending]
  );

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

  const current =
    isSwapping || stack.length === 0 ? null : stack[stack.length - 1];
  const previous = !isSwapping && stack.length >= 2 ? stack[stack.length - 2] : null;
  const backButton: BackButtonProps | null = previous
    ? { label: `Back to ${previous.label}`, onBack: back }
    : null;

  return { current, backButton, open, drill, close };
}
