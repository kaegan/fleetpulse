"use client";

import { BRAND_COLOR } from "@/lib/constants";

type Scope = "mine" | "all";

interface ScopeToggleProps {
  scope: Scope;
  onChange: (scope: Scope) => void;
  mineCount: number;
  allCount: number;
}

export function ScopeToggle({ scope, onChange, mineCount, allCount }: ScopeToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Work order scope"
      style={{
        display: "inline-flex",
        background: "#f2f2f2",
        borderRadius: 999,
        padding: 4,
        gap: 2,
      }}
    >
      <ScopeTab
        active={scope === "mine"}
        label="Mine"
        count={mineCount}
        onClick={() => onChange("mine")}
      />
      <ScopeTab
        active={scope === "all"}
        label="All in garage"
        count={allCount}
        onClick={() => onChange("all")}
      />
    </div>
  );
}

function ScopeTab({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13,
        fontWeight: 600,
        padding: "7px 16px",
        borderRadius: 999,
        background: active ? "#ffffff" : "transparent",
        color: active ? "#222222" : "#6a6a6a",
        border: "none",
        cursor: "pointer",
        boxShadow: active
          ? "0px 1px 2px rgba(0,0,0,0.04), 0px 2px 6px rgba(0,0,0,0.06)"
          : "none",
        transition: "background 120ms ease, color 120ms ease",
      }}
    >
      {label}
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          padding: "2px 8px",
          borderRadius: 999,
          background: active ? "#f5e7e2" : "#e5e5e5",
          color: active ? BRAND_COLOR : "#929292",
          minWidth: 18,
          textAlign: "center",
          lineHeight: 1.2,
        }}
      >
        {count}
      </span>
    </button>
  );
}
