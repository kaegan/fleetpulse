import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap leading-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border border-border text-foreground bg-card",
        muted: "bg-muted text-text-secondary",
        destructive: "bg-severity-critical-bg text-severity-critical",
        warning: "bg-severity-high-bg text-severity-high",
        success: "bg-severity-routine-bg text-severity-routine",
      },
      size: {
        default: "px-2.5 py-[3px] text-[11px]",
        sm: "px-2 py-[2px] text-[10px]",
        lg: "px-3.5 py-[5px] text-[13px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
