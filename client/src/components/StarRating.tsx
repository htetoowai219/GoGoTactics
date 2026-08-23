import { Star, StarHalf } from "lucide-react";
import { cn } from "../lib/utils";

interface StarRatingProps {
  value: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (value: number) => void;
  className?: string;
}

const sizes = {
  sm: "h-3.5 w-3.5",
  md: "h-4.5 w-4.5 h-[18px] w-[18px]",
  lg: "h-6 w-6",
};

export function StarRating({
  value,
  size = "sm",
  interactive = false,
  onChange,
  className,
}: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {stars.map((star) => {
        const filled = value >= star;
        const half = !filled && value >= star - 0.5;
        if (interactive) {
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange?.(star)}
              className="cursor-pointer transition-transform hover:scale-110"
              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
            >
              <Star
                className={cn(
                  sizes[size],
                  filled || half
                    ? "fill-gold text-gold"
                    : "text-muted/40 fill-transparent",
                )}
              />
            </button>
          );
        }
        return (
          <span key={star} className="relative inline-flex">
            <Star
              className={cn(
                sizes[size],
                filled ? "fill-gold text-gold" : "text-muted/40 fill-transparent",
              )}
            />
            {half && (
              <StarHalf className={cn(sizes[size], "absolute inset-0 fill-gold text-gold")} />
            )}
          </span>
        );
      })}
    </div>
  );
}
