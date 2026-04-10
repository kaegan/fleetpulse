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
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 13,
        fontWeight: 700,
        padding: "5px 14px",
        borderRadius: 999,
        background: bgColor,
        color,
        letterSpacing: "0.01em",
        lineHeight: 1,
      }}
    >
      {icon && (
        <span style={{ display: "flex", width: 16, height: 16 }}>{icon}</span>
      )}
      {label}
    </span>
  );
}
