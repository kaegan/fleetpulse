"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useDepot, type DepotScope } from "@/hooks/use-depot";
import { IconGarageFillDuo18 } from "nucleo-ui-fill-duo-18";

// User-facing label for each scope. Code talks in "depot"
// (DepotScope / useDepot / filterByDepot), but every piece of visible copy
// elsewhere in the app already says "Garage" — HEADER in mechanic-view,
// SCOPE_SUFFIX in work-order-tracker, the Bus.garage field. The switcher
// should speak the same language.
const SCOPE_LABEL: Record<DepotScope, string> = {
  all: "All Garages",
  north: "North Garage",
  south: "South Garage",
};

// Hardcoded for now — Transitland has 2 garages. When a 3rd depot appears,
// swap this for a list sourced from src/data/garages.ts (or similar); the
// dropdown markup below is already shaped for N items.
const DEPOT_OPTIONS: DepotScope[] = ["all", "north", "south"];

export function DepotSwitcher() {
  const { scope, setScope } = useDepot();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  // Compute popover position below the trigger, left-aligned with it.
  useEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPosition({
      left: rect.left,
      top: rect.bottom + 6,
    });
  }, [open]);

  // Outside click + Escape closes popover.
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current && !popoverRef.current.contains(target) &&
        buttonRef.current && !buttonRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const handleSelect = (next: DepotScope) => {
    setScope(next);
    setOpen(false);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Garage scope"
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex"
        style={{
          alignItems: "center",
          gap: 8,
          height: 30,
          padding: "0 10px",
          borderRadius: 8,
          border: "none",
          background: open ? "rgba(0,0,0,0.05)" : "transparent",
          cursor: "pointer",
          fontFamily: "inherit",
          transition: "background 0.15s ease",
        }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.background = "rgba(0,0,0,0.04)";
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.background = "transparent";
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            color: "#6a6a6a",
          }}
        >
          <IconGarageFillDuo18 />
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#222222",
            letterSpacing: "-0.01em",
          }}
        >
          {SCOPE_LABEL[scope]}
        </span>
        <ChevronDownIcon />
      </button>

      {open && position && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            role="menu"
            aria-label="Garage scope"
            style={{
              position: "fixed",
              left: position.left,
              top: position.top,
              minWidth: 200,
              background: "#ffffff",
              borderRadius: 12,
              boxShadow:
                "0px 0px 0px 1px rgba(0,0,0,0.04), 0px 8px 24px rgba(0,0,0,0.06), 0px 16px 32px rgba(0,0,0,0.04)",
              padding: 6,
              zIndex: 999,
            }}
          >
            {DEPOT_OPTIONS.map((option) => {
              const isActive = scope === option;
              return (
                <button
                  key={option}
                  role="menuitem"
                  type="button"
                  onClick={() => handleSelect(option)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    height: 34,
                    padding: "0 12px 0 10px",
                    borderRadius: 8,
                    border: "none",
                    background: "transparent",
                    color: "#222222",
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 500,
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "inherit",
                    transition: "background 0.12s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(0,0,0,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {/* Reserved left gutter for the checkmark, macOS-style:
                      the slot stays the same width whether checked or not so
                      labels line up across rows. */}
                  <span
                    style={{
                      flexShrink: 0,
                      width: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isActive && <CheckIcon />}
                  </span>
                  <span style={{ flex: 1 }}>{SCOPE_LABEL[option]}</span>
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────

function ChevronDownIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="#929292"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="#222222"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 8.5l3 3 7-7" />
    </svg>
  );
}
