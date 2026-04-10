"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CURRENT_MECHANIC, BRAND_COLOR } from "@/lib/constants";

function getInitials(name: string): string {
  // "Torres, M." → "MT"  (first initial + last initial)
  const lastFirst = name.match(/^([A-Za-z]+),\s*([A-Za-z])/);
  if (lastFirst) {
    return (lastFirst[2][0] + lastFirst[1][0]).toUpperCase();
  }
  const parts = name.split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

interface ProfileMenuProps {
  expanded: boolean;
  onOpenWhatsNew: () => void;
}

export function ProfileMenu({ expanded, onOpenWhatsNew }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; bottom: number } | null>(null);

  // Compute popover position from the button's bounding rect.
  // Popover sits to the right of the nav rail, bottom-aligned with the avatar.
  useEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPosition({
      left: rect.right + 8,
      bottom: window.innerHeight - rect.bottom,
    });
  }, [open]);

  // Outside click + escape closes popover.
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

  const initials = getInitials(CURRENT_MECHANIC);

  const handleWhatsNewClick = () => {
    setOpen(false);
    onOpenWhatsNew();
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        aria-label="Profile menu"
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          height: 44,
          padding: expanded ? "0 8px" : "0",
          justifyContent: expanded ? "flex-start" : "center",
          borderRadius: 10,
          border: "none",
          background: open ? "rgba(0,0,0,0.05)" : "transparent",
          cursor: "pointer",
          transition: "background 0.15s ease",
          whiteSpace: "nowrap",
          overflow: "hidden",
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
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: BRAND_COLOR,
            color: "#ffffff",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.02em",
          }}
        >
          {initials}
        </span>
        <AnimatePresence>
          {expanded && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#222222",
                letterSpacing: "-0.01em",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {CURRENT_MECHANIC}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {open && position && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            role="menu"
            aria-label="Profile menu"
            style={{
              position: "fixed",
              left: position.left,
              bottom: position.bottom,
              minWidth: 220,
              background: "#ffffff",
              borderRadius: 14,
              boxShadow:
                "0px 0px 0px 1px rgba(0,0,0,0.04), 0px 8px 24px rgba(0,0,0,0.06), 0px 16px 32px rgba(0,0,0,0.04)",
              padding: 6,
              zIndex: 999,
            }}
          >
            <div
              style={{
                padding: "10px 12px 10px 12px",
                borderBottom: "1px solid rgba(0,0,0,0.06)",
                marginBottom: 4,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: "#222222", letterSpacing: "-0.01em" }}>
                {CURRENT_MECHANIC}
              </div>
              <div style={{ fontSize: 11, fontWeight: 500, color: "#929292", marginTop: 2 }}>
                Mechanic · North Garage
              </div>
            </div>

            <MenuItem onClick={handleWhatsNewClick} icon={<SparkleIcon />}>
              What&apos;s new
            </MenuItem>
            <MenuItem disabled icon={<SettingsIcon />} suffix={<SoonBadge />}>
              Account settings
            </MenuItem>
            <MenuItem disabled icon={<SignOutIcon />} suffix={<SoonBadge />}>
              Sign out
            </MenuItem>
          </div>,
          document.body
        )}
    </>
  );
}

// ─── MenuItem ──────────────────────────────────────────────────────────

interface MenuItemProps {
  children: ReactNode;
  icon: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  suffix?: ReactNode;
}

function MenuItem({ children, icon, onClick, disabled, suffix }: MenuItemProps) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        height: 36,
        padding: "0 10px",
        borderRadius: 8,
        border: "none",
        background: "transparent",
        color: disabled ? "#cccccc" : "#222222",
        fontSize: 13,
        fontWeight: 500,
        cursor: disabled ? "default" : "pointer",
        textAlign: "left",
        transition: "background 0.12s ease",
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = "rgba(0,0,0,0.04)";
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.background = "transparent";
      }}
    >
      <span style={{ flexShrink: 0, display: "flex", color: disabled ? "#dddddd" : "#929292" }}>
        {icon}
      </span>
      <span style={{ flex: 1 }}>{children}</span>
      {suffix && <span style={{ flexShrink: 0 }}>{suffix}</span>}
    </button>
  );
}

// ─── Soon badge (matches nav-rail.tsx convention) ──────────────────────

function SoonBadge() {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        color: "#bbbbbb",
        background: "#f0f0f0",
        padding: "1px 5px",
        borderRadius: 4,
      }}
    >
      Soon
    </span>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
