"use client";

import { useTransition } from "react";
import { Heart } from "lucide-react";
import { useWishlist } from "@/store/wishlist";
import { toggleWishlist } from "@/app/actions/wishlist";
import { toast } from "@/components/providers/toast";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  name,
  price,
  className,
  variant = "icon",
}: {
  productId: string;
  name: string;
  price: number;
  className?: string;
  variant?: "icon" | "full";
}) {
  const active = useWishlist((s) => s.ids.includes(productId));
  const loggedIn = useWishlist((s) => s.loggedIn);
  const [, start] = useTransition();

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = useWishlist.getState().toggleLocal(productId);
    if (added) {
      track("add_to_wishlist", { value: price, items: [{ item_id: productId, item_name: name, price }] });
      toast("Saved to your wishlist", "success", { label: "View", href: "/wishlist" });
    } else {
      toast("Removed from wishlist");
    }
    if (loggedIn) start(() => void toggleWishlist(productId, added));
  };

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={cn(
          "inline-flex h-13 items-center justify-center gap-2 rounded-full border px-5 font-display text-sm font-semibold transition",
          active ? "border-ink bg-ink text-white" : "border-ink/15 hover:border-ink",
          className,
        )}
      >
        <Heart className={cn("size-4", active && "fill-current")} />
        {active ? "Wishlisted" : "Wishlist"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
      className={cn(
        "grid size-9 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-105",
        className,
      )}
    >
      <Heart className={cn("size-4", active ? "fill-danger text-danger" : "text-ink")} />
    </button>
  );
}
