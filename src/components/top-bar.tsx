"use client";

import { DepotSwitcher } from "@/components/depot-switcher";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-transparent px-4 sm:px-6 lg:px-8">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="data-[orientation=vertical]:h-5 bg-border"
      />
      <DepotSwitcher />
    </header>
  );
}
