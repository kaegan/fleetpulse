"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRole } from "@/hooks/use-role";
import type { Role } from "@/data/types";
import { BRAND_COLOR } from "@/lib/constants";
import { Separator } from "@/components/ui/separator";
import { ProfileMenu } from "@/components/profile-menu";
import { WhatsNewDialog } from "@/components/whats-new-dialog";

const COLLAPSED_WIDTH = 56;
const EXPANDED_WIDTH = 200;

const modes: { key: Role; label: string; icon: React.ReactNode }[] = [
  {
    key: "mechanic",
    label: "Mechanic",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    key: "ops",
    label: "Operations",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="20" x2="12" y2="10" />
        <line x1="18" y1="20" x2="18" y2="4" />
        <line x1="6" y1="20" x2="6" y2="16" />
      </svg>
    ),
  },
];

const browseItems = [
  {
    key: "buses",
    label: "Buses",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 6v6" /><path d="M16 6v6" />
        <rect x="4" y="2" width="16" height="16" rx="3" />
        <path d="M4 12h16" /><path d="M8 22v-2" /><path d="M16 22v-2" />
        <path d="M4 18h16" />
      </svg>
    ),
  },
  {
    key: "work-orders",
    label: "Work Orders",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
        <path d="m9 15 2 2 4-4" />
      </svg>
    ),
  },
  {
    key: "parts",
    label: "Parts",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m7.5 4.27 9 5.15" />
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
      </svg>
    ),
  },
];

// Chevron icons for expand/collapse
const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);
const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

export function NavRail() {
  const { role, setRole } = useRole();
  const [expanded, setExpanded] = useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);

  const width = expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH;

  return (
    <motion.nav
      animate={{ width }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="hidden md:flex"
      style={{
        flexDirection: "column",
        minWidth: COLLAPSED_WIDTH,
        background: "#fafafa",
        borderRight: "1px solid rgba(0,0,0,0.06)",
        paddingTop: 16,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Section label */}
      <SectionLabel expanded={expanded}>Views</SectionLabel>

      {/* Role modes */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 8px" }}>
        {modes.map(({ key, label, icon }) => {
          const isActive = role === key;

          return (
            <button
              key={key}
              onClick={() => setRole(key)}
              aria-label={label}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 12,
                height: 40,
                paddingLeft: 10,
                paddingRight: 10,
                borderRadius: 10,
                border: "none",
                background: isActive ? `${BRAND_COLOR}14` : "transparent",
                color: isActive ? BRAND_COLOR : "#999999",
                cursor: "pointer",
                transition: "background 0.15s ease, color 0.15s ease",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(0,0,0,0.04)";
                  e.currentTarget.style.color = "#666666";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#999999";
                }
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-rail-indicator"
                  style={{
                    position: "absolute",
                    left: -8,
                    top: 8,
                    bottom: 8,
                    width: 3,
                    borderRadius: 2,
                    background: BRAND_COLOR,
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span style={{ flexShrink: 0, display: "flex" }}>{icon}</span>
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
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <Separator className="my-3 mx-3 w-auto" />

      {/* Browse section */}
      <SectionLabel expanded={expanded}>Browse</SectionLabel>

      <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 8px" }}>
        {browseItems.map(({ key, label, icon }) => (
          <button
            key={key}
            disabled
            aria-label={label}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: 12,
              height: 36,
              paddingLeft: 11,
              paddingRight: 10,
              borderRadius: 10,
              border: "none",
              background: "transparent",
              color: "#cccccc",
              cursor: "default",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            <span style={{ flexShrink: 0, display: "flex" }}>{icon}</span>
            <AnimatePresence>
              {expanded && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    letterSpacing: "-0.01em",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  {label}
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
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        ))}
      </div>

      {/* Empty space — click to expand when collapsed */}
      <div
        style={{
          flex: 1,
          cursor: expanded ? "default" : "pointer",
        }}
        onClick={() => { if (!expanded) setExpanded(true); }}
      />

      {/* Profile menu — bottom-left account stub */}
      <div
        style={{
          padding: "8px 8px 4px 8px",
          borderTop: "1px solid rgba(0,0,0,0.06)",
          marginTop: 4,
        }}
      >
        <ProfileMenu
          expanded={expanded}
          onOpenWhatsNew={() => setWhatsNewOpen(true)}
        />
      </div>

      {/* Expand/collapse toggle at bottom */}
      <div style={{ padding: "4px 8px 12px 8px" }}>
        <button
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: expanded ? "flex-end" : "center",
            width: "100%",
            height: 32,
            paddingRight: expanded ? 8 : 0,
            borderRadius: 8,
            border: "none",
            background: "transparent",
            color: "#bbbbbb",
            cursor: "pointer",
            transition: "color 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#888888";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#bbbbbb";
          }}
        >
          {expanded ? <ChevronLeft /> : <ChevronRight />}
        </button>
      </div>

      <WhatsNewDialog open={whatsNewOpen} onOpenChange={setWhatsNewOpen} />
    </motion.nav>
  );
}

function SectionLabel({
  expanded,
  children,
}: {
  expanded: boolean;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {expanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "#aaaaaa",
            padding: "0 20px",
            marginBottom: 6,
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
