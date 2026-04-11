"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bus,
  ClipboardText,
  Gauge,
  Package,
  Wrench,
} from "@phosphor-icons/react/dist/ssr";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { ProfileMenu } from "@/components/profile-menu";
import { WhatsNewDialog } from "@/components/whats-new-dialog";

const heroItems = [
  { label: "Fleet Overview", href: "/fleet-overview", icon: Gauge },
  { label: "Service Board", href: "/service-board", icon: Wrench },
] as const;

const recordItems = [
  { label: "Buses", icon: Bus },
  { label: "Work Orders", icon: ClipboardText },
  { label: "Parts", icon: Package },
] as const;

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();
  const [whatsNewOpen, setWhatsNewOpen] = React.useState(false);

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      {/* Brand — not a menu item, just a header block. Canonical
          team-switcher pattern (size-8 icon wrapper + text div). */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="cursor-default hover:bg-transparent active:bg-transparent"
            >
              <div
                className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background: "#d4654a",
                  boxShadow: "0 0 12px rgba(212,101,74,0.4)",
                }}
                aria-hidden
              >
                <span className="block size-2.5 rounded-full bg-white" aria-hidden />
              </div>
              <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-[15px] font-bold tracking-tight">
                  FleetPulse
                </span>
                <span className="truncate text-xs text-sidebar-foreground/60">
                  Transitland
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Hero items — canonical nav pattern, default size, size-4 icons.
            Simple, clips to icon rail automatically. */}
        <SidebarGroup>
          <SidebarMenu>
            {heroItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    size="lg"
                    isActive={isActive}
                    tooltip={item.label}
                    className="text-[15px] font-medium [&>svg]:!size-6 group-data-[collapsible=icon]:justify-center"
                  >
                    <Link href={item.href}>
                      <item.icon weight={isActive ? "fill" : "duotone"} />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        {/* Records — label auto-hides in collapsed state via the library's
            own -mt-8/opacity-0 utilities; items stay visible as icons. */}
        <SidebarGroup>
          <SidebarGroupLabel>Records</SidebarGroupLabel>
          <SidebarMenu>
            {recordItems.map((item) => (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton disabled tooltip={item.label}>
                  <item.icon weight="duotone" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
                <SidebarMenuBadge>Soon</SidebarMenuBadge>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Empty-space click target — expands the rail when collapsed. */}
        <button
          type="button"
          aria-label={state === "collapsed" ? "Expand sidebar" : undefined}
          tabIndex={state === "collapsed" ? 0 : -1}
          onClick={() => {
            if (state === "collapsed") toggleSidebar();
          }}
          className="min-h-8 flex-1 group-data-[collapsible=icon]:cursor-e-resize"
        />
      </SidebarContent>

      <SidebarFooter>
        <ProfileMenu onOpenWhatsNew={() => setWhatsNewOpen(true)} />
        <WhatsNewDialog open={whatsNewOpen} onOpenChange={setWhatsNewOpen} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
