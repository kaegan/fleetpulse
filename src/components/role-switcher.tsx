"use client";

import { motion } from "framer-motion";
import { useRole } from "@/hooks/use-role";

const roles = [
  { key: "mechanic" as const, label: "Mechanic" },
  { key: "ops" as const, label: "Ops Manager" },
];

export function RoleSwitcher() {
  const { role, setRole } = useRole();

  return (
    <div
      style={{
        display: "flex",
        position: "relative",
        background: "#f2f2f2",
        borderRadius: 10,
        padding: 3,
      }}
    >
      {roles.map(({ key, label }) => {
        const isActive = role === key;

        return (
          <button
            key={key}
            onClick={() => setRole(key)}
            style={{
              position: "relative",
              zIndex: 1,
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: isActive ? "#ffffff" : "#929292",
              transition: "color 0.2s ease",
            }}
          >
            {isActive && (
              <motion.div
                layoutId="role-indicator"
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "#d4654a",
                  borderRadius: 8,
                  boxShadow:
                    "0px 1px 3px rgba(0,0,0,0.12), 0px 2px 6px rgba(0,0,0,0.08)",
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 35,
                }}
              />
            )}
            <span style={{ position: "relative", zIndex: 2 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
