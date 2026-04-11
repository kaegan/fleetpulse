"use client";

import { LogOut, Monitor, Moon, Settings, Sparkles, Sun } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useThemeSafe } from "@/hooks/use-theme-safe";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { CURRENT_MECHANIC, BRAND_COLOR } from "@/lib/constants";

function getInitials(name: string): string {
  const lastFirst = name.match(/^([A-Za-z]+),\s*([A-Za-z])/);
  if (lastFirst) {
    return (lastFirst[2][0] + lastFirst[1][0]).toUpperCase();
  }
  const parts = name.split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

interface ProfileMenuProps {
  onOpenWhatsNew: () => void;
}

const THEME_ICON = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

export function ProfileMenu({ onOpenWhatsNew }: ProfileMenuProps) {
  const { isMobile } = useSidebar();
  const initials = getInitials(CURRENT_MECHANIC);
  const { theme, setTheme } = useThemeSafe();
  const ThemeIcon = THEME_ICON[theme as keyof typeof THEME_ICON] ?? Monitor;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={CURRENT_MECHANIC}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{
                  background: BRAND_COLOR,
                  letterSpacing: "0.02em",
                }}
              >
                {initials}
              </span>
              <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-[13px] font-semibold text-sidebar-foreground">
                  {CURRENT_MECHANIC}
                </span>
                <span className="truncate text-[11px] font-medium text-sidebar-foreground/60">
                  Mechanic · North Garage
                </span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={6}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1.5 py-1.5 text-left">
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{
                    background: BRAND_COLOR,
                    letterSpacing: "0.02em",
                  }}
                >
                  {initials}
                </span>
                <div className="grid flex-1 leading-tight">
                  <span className="truncate text-[13px] font-semibold">
                    {CURRENT_MECHANIC}
                  </span>
                  <span className="truncate text-[11px] text-muted-foreground">
                    Mechanic · North Garage
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onOpenWhatsNew}>
              <Sparkles />
              What&apos;s new
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ThemeIcon />
                Appearance
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={theme}
                  onValueChange={(v) => setTheme(v)}
                >
                  <DropdownMenuRadioItem value="light">
                    <Sun />
                    Light
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">
                    <Moon />
                    Dark
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system">
                    <Monitor />
                    System
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem disabled>
              <Settings />
              Account settings
              <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Soon
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <LogOut />
              Sign out
              <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Soon
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
