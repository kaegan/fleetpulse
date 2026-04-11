"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { XIcon } from "lucide-react";

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
    className={cn("fixed inset-0 z-40 bg-black/30", className)}
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
        // rounded to 24px to match --radius-lg. Capped at 90vh so the user
        // always sees the page peeking through above the sheet — that's the
        // visual cue that this is a layer, not a replacement.
        "fixed inset-x-2 bottom-0 z-50 flex max-h-[90vh] flex-col overflow-hidden rounded-t-[24px] bg-card shadow-panel",
        className
      )}
      {...props}
    >
      {/* Sticky header strip — non-scrollable, contains the drag handle and
       * close button. Sits outside the overflow-y-auto wrapper so the body
       * can scroll independently while the handle area stays draggable.
       *
       * The drag/scroll separation is enforced by `handleOnly` on the Root
       * (set in responsive-sheet.tsx): vaul only listens for drag gestures
       * on the <Handle>, not on body content. This eliminates vaul's
       * scrollLockTimeout entirely — after scrolling, the handle is still
       * immediately responsive, no 500ms cooldown. */}
      <div className="relative shrink-0 pt-2 pb-1">
        <DrawerPrimitive.Handle
          preventCycle
          aria-label="Drag down to dismiss"
          // Override vaul's default handle CSS (#e2e2e4, 5×32, opacity .7)
          // with the FleetPulse warm palette and a slightly chunkier bar.
          // Tailwind `!` ensures these win over vaul's injected stylesheet.
          className="!my-2 !h-1.5 !w-12 !rounded-full !bg-black/20 !opacity-100"
        />
        {/* Fallback close button — pull-down works for users who notice the
         * handle, but it's not always discoverable, so give them a tap target
         * too. iOS modal sheets use the same pattern (drag OR tap "Done"). */}
        <DrawerPrimitive.Close
          aria-label="Close"
          className="absolute right-4 top-2.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#f2f2f2] text-[#6a6a6a] transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <XIcon className="h-4 w-4" />
        </DrawerPrimitive.Close>
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
