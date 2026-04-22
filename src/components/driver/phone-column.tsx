"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Responsive container for the driver prototype.
 *  - Mobile (<sm): locked to the dynamic viewport (`h-dvh`) so the
 *    BottomTabBar pins to the bottom of the screen and the body never
 *    scrolls — only the tab content scrolls. `overscroll-behavior: contain`
 *    suppresses iOS rubber-banding so it feels native.
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
    <div className="h-dvh w-full bg-[var(--color-surface-warm)] sm:h-auto sm:min-h-svh sm:flex sm:items-center sm:justify-center sm:py-8">
      <div
        className={cn(
          "flex flex-col bg-card overflow-hidden overscroll-contain",
          // Mobile: edge-to-edge, locked to viewport height
          "w-full h-full",
          // Desktop: centered phone-sized column
          "sm:w-[390px] sm:h-[844px] sm:max-h-[calc(100svh-4rem)]",
          "sm:rounded-[28px] sm:shadow-panel sm:ring-1 sm:ring-black/5",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
