import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none border-2 border-foreground text-sm font-bold uppercase tracking-wide transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-bright-ink shadow-comic hover:bg-primary-hover hover:shadow-comic-lg hover:-translate-x-[1px] hover:-translate-y-[1px]",
        secondary:
          "bg-elevated text-foreground shadow-comic-sm hover:bg-card hover:shadow-comic",
        outline:
          "border-2 bg-transparent text-foreground shadow-comic-sm hover:bg-elevated hover:shadow-comic",
        ghost:
          "border-transparent shadow-none text-muted hover:text-foreground hover:bg-elevated",
        danger:
          "bg-danger text-white shadow-comic hover:brightness-110 hover:shadow-comic-lg",
        gold: "bg-gold text-bright-ink shadow-comic hover:brightness-105 hover:shadow-comic-lg",
        link: "border-transparent shadow-none bg-transparent underline underline-offset-4 hover:bg-transparent font-bold normal-case tracking-normal",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
