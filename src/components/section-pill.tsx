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
      className="inline-flex max-w-full items-center gap-1.5 rounded-full px-3.5 py-[5px] text-[13px] font-bold leading-none tracking-[0.01em]"
      style={{ background: bgColor, color }}
    >
      {icon && <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center [&>svg]:h-[18px] [&>svg]:w-[18px]">{icon}</span>}
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}
