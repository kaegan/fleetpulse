"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DepotProvider } from "@/hooks/use-depot";
import { FleetProvider } from "@/contexts/fleet-context";
import { TopBar } from "@/components/top-bar";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

/**
 * Client-side shell for the whole app. Lives in `app/layout.tsx` so the
 * DepotProvider and SidebarProvider contexts survive client-side navigation
 * between routes.
 *
 * Routes under `/driver` are the standalone Spare Driver prototype — they
 * render full-bleed without the desktop sidebar/TopBar and don't need the
 * fleet/depot context (no 300-bus fixtures). Early-return before mounting
 * any of that chain.
 */
export function AppShell({
  children,
  defaultOpen = true,
}: {
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const pathname = usePathname();
  if (pathname?.startsWith("/driver")) {
    return <>{children}</>;
  }

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
