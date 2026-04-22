"use client";

import {
  CalendarBlank,
  EnvelopeSimple,
  NavigationArrow,
  Pulse,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export type DriverTab = "trip" | "schedule" | "fleet" | "inbox";

interface TabItem {
  id: DriverTab;
  label: string;
  icon: Icon;
}

const TABS: TabItem[] = [
  { id: "trip", label: "Trip", icon: NavigationArrow },
  { id: "schedule", label: "Schedule", icon: CalendarBlank },
  { id: "fleet", label: "Fleet", icon: Pulse },
  { id: "inbox", label: "Inbox", icon: EnvelopeSimple },
];

/**
 * Phone-style bottom tab bar. Four tabs, icon + label.
 * Active tab uses brand color + filled Phosphor weight, matching the
 * sidebar convention used elsewhere in the app.
 *
 * `env(safe-area-inset-bottom)` padding clears the iPhone home indicator
 * so the nav doesn't feel clipped on real devices.
 *
 * Inbox tab shows an unread dot indicator when `unreadInbox` is true.
 */
export function BottomTabBar({
  active,
  onChange,
  unreadInbox = false,
}: {
  active: DriverTab;
  onChange: (tab: DriverTab) => void;
  unreadInbox?: boolean;
}) {
  return (
    <nav
      aria-label="Driver navigation"
      className={cn(
        "shrink-0 grid grid-cols-4 gap-1 px-2 pt-2",
        "bg-card border-t border-[var(--color-border)]",
        "pb-[max(env(safe-area-inset-bottom),10px)]"
      )}
    >
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        const Icon = tab.icon;
        const showUnreadDot = tab.id === "inbox" && unreadInbox;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-current={isActive ? "page" : undefined}
            aria-label={
              showUnreadDot ? `${tab.label} (unread)` : tab.label
            }
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg cursor-pointer",
              "transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]/40",
              isActive
                ? "text-[var(--color-brand)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            )}
          >
            <span className="relative">
              <Icon
                size={24}
                weight={isActive ? "fill" : "duotone"}
                aria-hidden
              />
              {showUnreadDot && (
                <span
                  aria-hidden
                  className="absolute -right-1 -top-0.5 size-2 rounded-full ring-2 ring-card"
                  style={{ background: "var(--color-brand)" }}
                />
              )}
            </span>
            <span className="text-[11px] font-semibold leading-none">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
