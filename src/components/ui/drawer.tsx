"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "@/lib/utils";

const Drawer = DrawerPrimitive.Root;
const DrawerTrigger = DrawerPrimitive.Trigger;
const DrawerPortal = DrawerPrimitive.Portal;
const DrawerClose = DrawerPrimitive.Close;

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    data-slot="drawer-overlay"
    className={cn("fixed inset-0 z-40 bg-[var(--color-scrim)]", className)}
    {...props}
  />
));
DrawerOverlay.displayName = "DrawerOverlay";

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      data-slot="drawer-content"
      className={cn(
        // Inset 8px from screen sides, flush with the bottom (so the safe-area
        // inset on the inner wrapper covers the home indicator). Top corners
        // rounded to 24px to match --radius-lg. Capped at 80vh so a clear
        // strip of the page stays visible above the sheet — that's the cue
        // that the sheet is a layer floating *over* content, not a new page.
        "fixed inset-x-2 bottom-0 z-50 flex max-h-[80vh] flex-col overflow-hidden rounded-t-[24px] bg-card shadow-panel",
        className
      )}
      {...props}
    >
      {/* Drag handle strip — a dedicated drag target that works regardless
       * of scroll position. The full sheet body is also draggable (vaul
       * disambiguates scroll vs drag based on scrollTop), but the handle
       * gives users a clear affordance and works even when the list is
       * scrolled partway down.
       *
       * The Handle div is full-width and 36px tall (transparent) so the
       * entire top strip is the hit area. The visible grabber bar is a
       * sibling with `pointer-events-none` so it paints over the Handle
       * without intercepting touches. */}
      <div className="relative shrink-0">
        <DrawerPrimitive.Handle
          preventCycle
          aria-label="Drag down to dismiss"
          // Strip vaul's default visual styles and turn the Handle into an
          // invisible full-width drag strip. `!`-prefixed utilities win over
          // vaul's injected stylesheet.
          className="!my-0 !block !h-9 !w-full !rounded-none !bg-transparent !opacity-100"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-border-strong"
        />
      </div>
      <div className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
        {children}
      </div>
    </DrawerPrimitive.Content>
  </DrawerPortal>
));
DrawerContent.displayName = "DrawerContent";

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    data-slot="drawer-header"
    className={cn("flex flex-col gap-2 text-left", className)}
    {...props}
  />
);
DrawerHeader.displayName = "DrawerHeader";

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    data-slot="drawer-title"
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
));
DrawerTitle.displayName = "DrawerTitle";

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    data-slot="drawer-description"
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DrawerDescription.displayName = "DrawerDescription";

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
};
