"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * FleetPulse-themed Sonner wrapper.
 *
 * Uses the dark pill aesthetic from the original custom Toast: black background,
 * white text, coral action button. Anchored bottom-center with the same offset.
 */
const Toaster = (props: ToasterProps) => {
  return (
    <Sonner
      position="bottom-center"
      offset={32}
      duration={6000}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "inline-flex items-center gap-3.5 rounded-full bg-[#222222] px-5 py-3 text-sm font-medium text-white shadow-[0px_4px_12px_rgba(0,0,0,0.12),0px_12px_40px_rgba(0,0,0,0.22)] max-w-[calc(100vw-48px)]",
          actionButton:
            "ml-1 inline-flex items-center gap-1 bg-transparent text-primary text-sm font-semibold cursor-pointer hover:opacity-80",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
