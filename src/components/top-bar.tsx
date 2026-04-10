"use client";

import { useClock } from "@/hooks/use-clock";

export function TopBar() {
  const clock = useClock();

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 32px",
        background: "#ffffff",
        borderBottom: "1px solid rgba(0,0,0,0.04)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0px 1px 3px rgba(0,0,0,0.02)",
      }}
    >
      {/* Left: Logo + Garage */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#d4654a",
              boxShadow: "0 0 8px rgba(212,101,74,0.4)",
            }}
          />
          <span
            style={{
              fontSize: 17,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "#222222",
            }}
          >
            FleetPulse
          </span>
        </div>
        <span
          style={{
            width: 1,
            height: 20,
            background: "rgba(0,0,0,0.08)",
          }}
        />
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#6a6a6a",
          }}
        >
          Transitland
        </span>
      </div>

      {/* Right: Clock */}
      <span
        suppressHydrationWarning
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "#929292",
          letterSpacing: "-0.01em",
          minWidth: 160,
          textAlign: "right",
        }}
      >
        {clock}
      </span>
    </header>
  );
}
