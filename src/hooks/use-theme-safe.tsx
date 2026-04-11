"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/**
 * next-themes wrapper that returns a stable theme value during SSR/hydration.
 *
 * `useTheme()` returns `{ theme: undefined, ... }` on the first client render
 * because the provider can't know the theme until after mount. Reading that
 * directly into a controlled component (e.g. DropdownMenuRadioGroup) trips
 * React's controlled→uncontrolled warning. This hook gates the value behind
 * a `mounted` flag and falls back to "system" until then.
 */
export function useThemeSafe() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  return {
    theme: mounted ? (theme ?? "system") : "system",
    resolvedTheme: mounted ? resolvedTheme : undefined,
    systemTheme: mounted ? systemTheme : undefined,
    setTheme,
    mounted,
  };
}
