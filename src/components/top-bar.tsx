"use client";

import { useClock } from "@/hooks/use-clock";
import { useRole } from "@/hooks/use-role";
import { BRAND_COLOR } from "@/lib/constants";

export function TopBar() {
  const clock = useClock();
  const { role, setRole } = useRole();

  return (
    <header
      className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8"
      style={{
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
          className="hidden sm:block"
          style={{
            width: 1,
            height: 20,
            background: "rgba(0,0,0,0.08)",
          }}
        />
        <span
          className="hidden sm:inline"
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#6a6a6a",
          }}
        >
          Transitland
        </span>
      </div>

      {/* Mobile-only role toggle — the nav-rail is hidden on <md, so users need
          another way to switch between Mechanic and Ops. */}
      <div
        className="flex md:hidden"
        role="group"
        aria-label="Switch role"
        style={{
          background: "#f5f5f7",
          borderRadius: 999,
          padding: 3,
          gap: 2,
        }}
      >
        {(["mechanic", "ops"] as const).map((r) => {
          const isActive = role === r;
          return (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              aria-pressed={isActive}
              style={{
                padding: "5px 12px",
                borderRadius: 999,
                border: "none",
                background: isActive ? "#ffffff" : "transparent",
                color: isActive ? BRAND_COLOR : "#6a6a6a",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: "0.01em",
                boxShadow: isActive
                  ? "0px 1px 2px rgba(0,0,0,0.06), 0px 1px 3px rgba(0,0,0,0.04)"
                  : "none",
              }}
            >
              {r === "mechanic" ? "Mech" : "Ops"}
            </button>
          );
        })}
      </div>

      {/* Right: Clock */}
      <span
        suppressHydrationWarning
        className="hidden sm:block text-right sm:min-w-[160px]"
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "#929292",
          letterSpacing: "-0.01em",
        }}
      >
        {clock}
      </span>
    </header>
  );
}
