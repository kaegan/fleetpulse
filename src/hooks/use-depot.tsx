"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

// Working scope: which depot's reality the user is currently focused on.
// Lives globally so dashboards, reports, and (future) Browse pages share one
// source of truth instead of each shipping its own depot filter.
export type DepotScope = "all" | "north" | "south";

interface DepotContextValue {
  scope: DepotScope;
  setScope: (s: DepotScope) => void;
}

const STORAGE_KEY = "fleetpulse-depot-scope";

const DepotContext = createContext<DepotContextValue | null>(null);

function isDepotScope(v: unknown): v is DepotScope {
  return v === "all" || v === "north" || v === "south";
}

export function DepotProvider({ children }: { children: ReactNode }) {
  // Default to "all" so SSR and first client paint match. localStorage is
  // read in an effect after hydration.
  const [scope, setScopeState] = useState<DepotScope>("all");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isDepotScope(stored)) setScopeState(stored);
    } catch {
      // localStorage may be unavailable (private mode, etc.) — fall through
      // and keep the default scope.
    }
  }, []);

  const setScope = useCallback((s: DepotScope) => {
    setScopeState(s);
    try {
      window.localStorage.setItem(STORAGE_KEY, s);
    } catch {
      // ignore — UI state still updates even if persistence fails
    }
  }, []);

  return (
    <DepotContext.Provider value={{ scope, setScope }}>
      {children}
    </DepotContext.Provider>
  );
}

export function useDepot(): DepotContextValue {
  const ctx = useContext(DepotContext);
  if (!ctx) throw new Error("useDepot must be used inside <DepotProvider>");
  return ctx;
}

/** Filter helper: pass any array of items with a `garage` field and the
 *  current scope; returns the filtered list. Co-located here so callers
 *  don't reinvent the same one-liner. */
export function filterByDepot<T extends { garage: "north" | "south" }>(
  items: T[],
  scope: DepotScope
): T[] {
  return scope === "all" ? items : items.filter((i) => i.garage === scope);
}
