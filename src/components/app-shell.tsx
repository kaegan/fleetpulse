"use client";

import type { ReactNode } from "react";
import { RoleProvider } from "@/hooks/use-role";
import { DepotProvider } from "@/hooks/use-depot";
import { TopBar } from "@/components/top-bar";
import { NavRail } from "@/components/nav-rail";

/**
 * Client-side shell for the whole app. Lives in `app/layout.tsx` so the
 * RoleProvider and DepotProvider contexts survive client-side navigation
 * between routes. Without lifting them here, role and depot state would
 * reset every time the user moves between the dashboard and a browse page.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <RoleProvider>
      <DepotProvider>
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
          <TopBar />
          <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
            <NavRail />
            <main style={{ flex: 1, overflow: "auto" }}>{children}</main>
          </div>
        </div>
      </DepotProvider>
    </RoleProvider>
  );
}
