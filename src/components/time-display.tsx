"use client";

import { formatTimeInStatus } from "@/lib/utils";

/**
 * Client-only time display that suppresses hydration warnings.
 * Time calculations inherently differ between SSR and client.
 */
export function TimeDisplay({ isoDate }: { isoDate: string }) {
  return (
    <span suppressHydrationWarning>{formatTimeInStatus(isoDate)}</span>
  );
}
