import { discountPercent, formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Price({
  price,
  mrp,
  size = "md",
  className,
  showSave = true,
}: {
  price: number;
  mrp?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  showSave?: boolean;
}) {
  const off = discountPercent(price, mrp);
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span
        className={cn(
          "font-display font-semibold text-ink",
          size === "sm" && "text-sm",
          size === "md" && "text-base",
          size === "lg" && "text-3xl",
        )}
      >
        {formatINR(price)}
      </span>
      {off > 0 && mrp && (
        <>
          <span className={cn("text-muted line-through", size === "lg" ? "text-base" : "text-xs")}>{formatINR(mrp)}</span>
          {showSave && <span className={cn("font-semibold text-success", size === "lg" ? "text-base" : "text-xs")}>{off}% off</span>}
        </>
      )}
    </div>
  );
}
