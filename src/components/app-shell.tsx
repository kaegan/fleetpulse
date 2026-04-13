"use client";

import type { ReactNode } from "react";
import { DepotProvider } from "@/hooks/use-depot";
import { FleetProvider } from "@/contexts/fleet-context";
import { TopBar } from "@/components/top-bar";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

/**
 * Client-side shell for the whole app. Lives in `app/layout.tsx` so the
 * DepotProvider and SidebarProvider contexts survive client-side navigation
 * between routes.
 */
export function AppShell({
  children,
  defaultOpen = true,
}: {
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <DepotProvider>
      <FleetProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <AppSidebar />
          <SidebarInset className="h-svh md:peer-data-[variant=inset]:h-[calc(100svh-1rem)] overflow-hidden">
            <TopBar />
            <div className="flex flex-1 flex-col overflow-auto">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </FleetProvider>
    </DepotProvider>
  );
}
