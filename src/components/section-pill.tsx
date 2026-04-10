import type { ReactNode } from "react";

interface SectionPillProps {
  label: string;
  color: string;
  bgColor: string;
  icon?: ReactNode;
}

export function SectionPill({ label, color, bgColor, icon }: SectionPillProps) {
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-[5px] text-[13px] font-bold leading-none tracking-[0.01em]"
      style={{ background: bgColor, color }}
    >
      {icon && <span className="flex h-4 w-4 shrink-0">{icon}</span>}
      {label}
    </span>
  );
}
