import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({
  value,
  count,
  size = "md",
  className,
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const iconSize = size === "sm" ? "size-3.5" : "size-4";
  return (
    <div className={cn("flex items-center gap-1", className)} aria-label={`Rated ${value.toFixed(1)} out of 5`}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn(iconSize, i <= Math.round(value) ? "fill-yellow-brand text-yellow-brand" : "fill-muted text-muted")}
            aria-hidden
          />
        ))}
      </div>
      {count !== undefined && <span className="text-xs text-muted-foreground">({count})</span>}
    </div>
  );
}
