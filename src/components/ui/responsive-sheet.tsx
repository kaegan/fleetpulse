"use client";

// ResponsiveSheet — branches between the desktop right-edge Sheet (Radix
// Dialog) and a mobile bottom Drawer (vaul) at the 768px breakpoint, sharing
// the same authoring API so panel components only need an import-swap.
//
// Why not modify `sheet.tsx` directly? The shadcn Sheet primitive also powers
// the mobile sidebar drawer in `src/components/ui/sidebar.tsx`. The sidebar
// should stay an edge drawer on mobile, not flip into a bottom sheet. Keeping
// the branching here, in a separate primitive, guarantees zero regression on
// the sidebar.

import * as React from "react";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";

// ── Context ──────────────────────────────────────────────────────────────
// Hoisted so root + content + title + description all agree on which branch
// they're rendering, even if useIsMobile() momentarily returns different
// values across child renders during hydration.

interface ResponsiveSheetContextValue {
  isMobile: boolean;
}

const ResponsiveSheetContext =
  React.createContext<ResponsiveSheetContextValue | null>(null);

function useResponsiveSheetContext(): ResponsiveSheetContextValue {
  const ctx = React.useContext(ResponsiveSheetContext);
  if (!ctx) {
    throw new Error(
      "ResponsiveSheet subcomponents must be used inside <ResponsiveSheet>."
    );
  }
  return ctx;
}

// ── Root ─────────────────────────────────────────────────────────────────

interface ResponsiveSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function ResponsiveSheet({
  open,
  onOpenChange,
  children,
}: ResponsiveSheetProps) {
  const isMobile = useIsMobile();
  const value = React.useMemo(() => ({ isMobile }), [isMobile]);

  if (isMobile) {
    return (
      <ResponsiveSheetContext.Provider value={value}>
        <Drawer open={open} onOpenChange={onOpenChange}>
          {children}
        </Drawer>
      </ResponsiveSheetContext.Provider>
    );
  }

  return (
    <ResponsiveSheetContext.Provider value={value}>
      <Sheet open={open} onOpenChange={onOpenChange}>
        {children}
      </Sheet>
    </ResponsiveSheetContext.Provider>
  );
}

// ── Content ──────────────────────────────────────────────────────────────

interface ResponsiveSheetContentProps {
  /**
   * Side of the screen the desktop sheet slides in from. Ignored on mobile —
   * the mobile branch always renders a bottom drawer.
   * @default "right"
   */
  side?: "top" | "right" | "bottom" | "left";
  /**
   * Show the X close button. Defaults to `true` on desktop and `false` on
   * mobile (the grab handle replaces it on the bottom drawer).
   */
  showCloseButton?: boolean;
  className?: string;
  children?: React.ReactNode;
}

function ResponsiveSheetContent({
  side = "right",
  showCloseButton,
  className,
  children,
}: ResponsiveSheetContentProps) {
  const { isMobile } = useResponsiveSheetContext();

  if (isMobile) {
    return <DrawerContent className={className}>{children}</DrawerContent>;
  }

  return (
    <SheetContent
      side={side}
      className={className}
      showCloseButton={showCloseButton ?? true}
    >
      {children}
    </SheetContent>
  );
}

// ── Title ────────────────────────────────────────────────────────────────

type ResponsiveSheetTitleProps = React.ComponentPropsWithoutRef<
  typeof SheetTitle
>;

function ResponsiveSheetTitle(props: ResponsiveSheetTitleProps) {
  const { isMobile } = useResponsiveSheetContext();
  return isMobile ? <DrawerTitle {...props} /> : <SheetTitle {...props} />;
}

// ── Description ──────────────────────────────────────────────────────────

type ResponsiveSheetDescriptionProps = React.ComponentPropsWithoutRef<
  typeof SheetDescription
>;

function ResponsiveSheetDescription(props: ResponsiveSheetDescriptionProps) {
  const { isMobile } = useResponsiveSheetContext();
  return isMobile ? (
    <DrawerDescription {...props} />
  ) : (
    <SheetDescription {...props} />
  );
}

export {
  ResponsiveSheet,
  ResponsiveSheetContent,
  ResponsiveSheetTitle,
  ResponsiveSheetDescription,
};
