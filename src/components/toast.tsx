"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { BRAND_COLOR } from "@/lib/constants";

interface ToastProps {
  message: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss: () => void;
  /** Auto-dismiss after this many ms. Default 6000. */
  duration?: number;
}

/**
 * Single-slot toast anchored to the bottom-center of the viewport.
 * Auto-dismisses after `duration` ms. Dark pill, white text, coral action link.
 */
export function Toast({ message, action, onDismiss, duration = 6000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [onDismiss, duration]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 32,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1100,
        background: "#222222",
        color: "#ffffff",
        borderRadius: 999,
        padding: "12px 20px",
        display: "inline-flex",
        alignItems: "center",
        gap: 14,
        boxShadow:
          "0px 4px 12px rgba(0,0,0,0.12), 0px 12px 40px rgba(0,0,0,0.22)",
        fontSize: 14,
        fontWeight: 500,
        maxWidth: "calc(100vw - 48px)",
      }}
    >
      <span>{message}</span>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            background: "transparent",
            border: "none",
            color: BRAND_COLOR,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontFamily: "inherit",
          }}
        >
          {action.label}
          <span aria-hidden="true">&rarr;</span>
        </button>
      )}
    </div>,
    document.body
  );
}
