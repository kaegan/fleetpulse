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
  { label: "Parts", href: "/parts", icon: Package, disabled: false as const },
  { label: "Buses", icon: Bus, disabled: true as const },
  { label: "Work Orders", icon: ClipboardText, disabled: true as const },
] as const;

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { state, toggleSidebar, isMobile, setOpenMobile } = useSidebar();
  const [whatsNewOpen, setWhatsNewOpen] = React.useState(false);

  // On mobile, collapse the slide-out sheet whenever the route changes so
  // tapping a nav link actually reveals the new page. Also fire onClick for
  // same-route taps where pathname won't change.
  React.useEffect(() => {
    if (isMobile) setOpenMobile(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleNavClick = React.useCallback(() => {
    if (isMobile) setOpenMobile(false);
  }, [isMobile, setOpenMobile]);

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
                  background: "var(--color-brand)",
                  boxShadow: "0 0 12px rgba(212,101,74,0.4)",
                }}
                aria-hidden
              >
                <Bus weight="fill" className="size-4 text-white" aria-hidden />
              </div>
              <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-[15px] font-semibold tracking-tight">
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
                    <Link href={item.href} onClick={handleNavClick}>
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
            {recordItems.map((item) => {
              if (item.disabled) {
                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton disabled tooltip={item.label}>
                      <item.icon weight="duotone" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                    <SidebarMenuBadge className="opacity-0 transition-opacity group-hover/menu-item:opacity-100">
                      V2
                    </SidebarMenuBadge>
                  </SidebarMenuItem>
                );
              }
              const isActive = pathname === item.href;
              return (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.label}
                  >
                    <Link href={item.href} onClick={handleNavClick}>
                      <item.icon weight={isActive ? "fill" : "duotone"} />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
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
          className="min-h-8 flex-1 group-data-[collapsible=icon]:cursor-pointer"
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
