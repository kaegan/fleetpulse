"use client";

import { useClock } from "@/hooks/use-clock";
import { DepotSwitcher } from "@/components/depot-switcher";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export function TopBar() {
  const clock = useClock();

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-transparent px-4 sm:px-6 lg:px-8">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="data-[orientation=vertical]:h-5 bg-black/10"
      />
      <DepotSwitcher />

      <div className="ml-auto">
        <span
          suppressHydrationWarning
          className="hidden sm:block text-right text-[13px] font-medium tracking-tight text-[#929292] sm:min-w-[160px]"
        >
          {clock}
        </span>
      </div>
    </header>
  );
}
