"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import type { ReactNode } from "react";

// PostHog is initialized in instrumentation-client.ts (Next.js 15.3+ pattern).
// This provider just makes the posthog instance available to React hooks.
export function PHProvider({ children }: { children: ReactNode }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
