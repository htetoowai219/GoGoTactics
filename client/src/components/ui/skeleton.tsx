import { cn } from "../../lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-none bg-ink-gray border-2 border-ink-gray", className)}
      {...props}
    />
  );
}

export { Skeleton };
