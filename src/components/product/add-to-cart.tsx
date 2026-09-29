"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import { useCart, type CartItem } from "@/store/cart";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/providers/toast";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export type CartProduct = Omit<CartItem, "quantity">;

function trackAdd(p: CartProduct, quantity: number) {
  track("add_to_cart", { value: p.price * quantity, items: [{ item_id: p.productId, item_name: p.name, price: p.price, quantity }] });
}

/** Compact button used on product cards. */
export function QuickAddButton({ product, className }: { product: CartProduct; className?: string }) {
  const add = useCart((s) => s.add);
  const openDrawer = useCart((s) => s.openDrawer);
  const soldOut = product.stock <= 0;
  return (
    <button
      type="button"
      disabled={soldOut}
      onClick={(e) => {
        e.preventDefault();
        add(product, 1);
        trackAdd(product, 1);
        openDrawer();
      }}
      className={cn(
        "flex h-10 w-full items-center justify-center gap-2 rounded-full bg-ink font-display text-[13px] font-semibold text-white transition hover:bg-ink-soft disabled:bg-mist disabled:text-muted",
        className,
      )}
    >
      {soldOut ? (
        "Out of stock"
      ) : (
        <>
          <ShoppingBag className="size-4" /> Add to cart
        </>
      )}
    </button>
  );
}

/** Quantity selector + Add to cart + Buy now, used on the product page. */
export function AddToCartPanel({ product }: { product: CartProduct }) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  const openDrawer = useCart((s) => s.openDrawer);
  const [qty, setQty] = useState(1);
  const soldOut = product.stock <= 0;
  const max = Math.min(product.stock, 20);

  if (soldOut) {
    return (
      <Button size="lg" variant="outline" disabled className="w-full">
        Out of stock
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="flex h-13 items-center justify-between rounded-full border border-line px-1.5 sm:w-36">
        <button className="grid size-10 place-items-center rounded-full hover:bg-mist" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
          <Minus className="size-4" />
        </button>
        <span className="font-display font-semibold" aria-live="polite">
          {qty}
        </span>
        <button
          className="grid size-10 place-items-center rounded-full hover:bg-mist disabled:opacity-40"
          onClick={() => setQty((q) => Math.min(max, q + 1))}
          disabled={qty >= max}
          aria-label="Increase quantity"
        >
          <Plus className="size-4" />
        </button>
      </div>
      <Button
        size="lg"
        variant="dark"
        // Grow side by side from sm up; on phones the column stacks and flex-1 would override the button height.
        className="sm:flex-1"
        onClick={() => {
          add(product, qty);
          trackAdd(product, qty);
          openDrawer();
          toast(`${product.name} added to cart`);
        }}
      >
        <ShoppingBag className="size-4" /> Add to cart
      </Button>
      <Button
        size="lg"
        className="sm:flex-1"
        onClick={() => {
          add(product, qty);
          trackAdd(product, qty);
          router.push("/checkout");
        }}
      >
        <Zap className="size-4" /> Buy now
      </Button>
    </div>
  );
}
