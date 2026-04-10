"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** id of the heading rendered inside `children`, used for aria-labelledby */
  titleId: string;
  children: ReactNode;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Minimal dialog primitive — no library.
 *
 * Portal to document.body, backdrop click closes, Escape closes, scroll lock
 * on body, focus trap inside the panel. Restores focus to the previously
 * focused element on unmount.
 */
export function Dialog({ open, onClose, titleId, children }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Escape to close + scroll lock + restore focus
  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into the panel on next tick so children are mounted.
    const raf = requestAnimationFrame(() => {
      if (!panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      const first = focusables[0];
      if (first) first.focus();
      else panelRef.current.focus();
    });

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
      cancelAnimationFrame(raf);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  // Tab trap — wrap focus within the panel
  const handlePanelKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const focusables = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!open) return null;
  if (typeof document === "undefined") return null; // SSR guard

  return createPortal(
    <div
      onClick={onClose}
      className="p-4 sm:p-6"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.35)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handlePanelKeyDown}
        style={{
          background: "#ffffff",
          borderRadius: 20,
          maxWidth: 520,
          width: "100%",
          maxHeight: "calc(100vh - 48px)",
          overflowY: "auto",
          boxShadow:
            "0px 0px 0px 1px rgba(0,0,0,0.02), 0px 2px 6px rgba(0,0,0,0.04), 0px 12px 40px rgba(0,0,0,0.18)",
          outline: "none",
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
