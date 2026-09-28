import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({ rating, size = 14, className }: { rating: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${rating.toFixed(1)} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - (i - 1)));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star className="absolute inset-0 text-zinc-300" style={{ width: size, height: size }} strokeWidth={0} fill="currentColor" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="text-brand-dark" style={{ width: size, height: size }} strokeWidth={0} fill="currentColor" />
            </span>
          </span>
        );
      })}
    </span>
  );
}
