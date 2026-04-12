"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BRAND_COLOR } from "@/lib/constants";

export type Scope = "mine" | "board" | "both";

interface ScopeToggleProps {
  scope: Scope;
  onChange: (scope: Scope) => void;
  mineCount: number;
  allCount: number;
}

export function ScopeToggle({ scope, onChange, mineCount, allCount }: ScopeToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={scope}
      onValueChange={(v) => v && onChange(v as Scope)}
      aria-label="Work order scope"
      className="p-1"
    >
      <ToggleGroupItem value="mine" className="px-4 py-[7px] text-[13px] gap-2">
        Mine
        <CountChip count={mineCount} active={scope === "mine"} />
      </ToggleGroupItem>
      <ToggleGroupItem value="board" className="px-4 py-[7px] text-[13px] gap-2">
        Board
        <CountChip count={allCount} active={scope === "board"} />
      </ToggleGroupItem>
      <ToggleGroupItem value="both" className="px-4 py-[7px] text-[13px] gap-2">
        Both
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

function CountChip({ count, active }: { count: number; active: boolean }) {
  return (
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
  );
}
