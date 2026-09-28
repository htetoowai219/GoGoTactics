import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-none border-2 border-foreground px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide shadow-comic-sm",
  {
    variants: {
      variant: {
        default: "border-foreground bg-primary text-bright-ink",
        secondary: "bg-elevated text-foreground",
        outline: "bg-card text-foreground",
        success: "bg-success text-bright-ink",
        danger: "bg-danger text-white",
        gold: "bg-gold text-bright-ink",
        cyan: "bg-accent text-bright-ink",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
