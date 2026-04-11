"use client";

// Plain-text back affordance used at the top-left of drill-down side panels.
// No outline, no lucide icon — the panels already have a close X at the top
// right, so this button's job is just to label the return destination clearly
// (e.g., "Back to PM Due", "Back to WO-90123", "Back to Bus #4012").

interface BackButtonProps {
  label: string;
  onClick: () => void;
}

export function BackButton({ label, onClick }: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-4 -mx-1 inline-flex cursor-pointer items-center gap-1.5 rounded px-1 py-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      <span aria-hidden>←</span> {label}
    </button>
  );
}
