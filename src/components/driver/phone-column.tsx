"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Responsive container for the driver prototype.
 *  - Mobile (<sm): full viewport, fills the phone.
 *  - Desktop (≥sm): centered 390px column, phone-ish height, subtle panel
 *    shadow + rounded corners. Deliberately NO notch/bezel chrome — the
 *    goal is "shipped app centered on a desktop," not "Figma mockup."
 *
 * Inside, callers lay out header / scrollable body / bottom tab bar using
 * `flex flex-col h-full` so the tab bar sits flush on the bottom of the
 * phone frame and the body scrolls inside.
 */
export function PhoneColumn({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-svh w-full bg-[var(--color-surface-warm)] sm:flex sm:items-center sm:justify-center sm:py-8">
      <div
        className={cn(
          "flex flex-col bg-card overflow-hidden",
          // Mobile: edge-to-edge
          "w-full min-h-svh",
          // Desktop: centered phone-sized column
          "sm:w-[390px] sm:min-h-0 sm:h-[844px] sm:max-h-[calc(100svh-4rem)]",
          "sm:rounded-[28px] sm:shadow-panel sm:ring-1 sm:ring-black/5",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
