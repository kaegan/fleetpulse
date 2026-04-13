"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect, type ReactNode } from "react";

export function PHProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return; // graceful no-op in dev without a key
    posthog.init(key, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: false, // handled by PostHogPageView
      capture_pageleave: true,
      persistence: "localStorage",
      // maskAllInputs: false is explicit — fleet tool has no sensitive inputs,
      // and full recordings are needed to review how mentors use the product.
      session_recording: { maskAllInputs: false },
    });
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
