"use client";

import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/store/cart";
import { formatINR } from "@/lib/format";
import { track } from "@/lib/analytics";
import type { CartProduct } from "@/components/product/add-to-cart";

/** Sticky add-to-cart bar on mobile once the main buy buttons scroll out of view. */
export function MobileBuyBar({ product, anchorId }: { product: CartProduct; anchorId: string }) {
  const [visible, setVisible] = useState(false);
  const add = useCart((s) => s.add);
  const openDrawer = useCart((s) => s.openDrawer);

  useEffect(() => {
    const el = document.getElementById(anchorId);
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, [anchorId]);

  if (!visible || product.stock <= 0) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-muted">{product.name}</p>
        <p className="font-display font-semibold">{formatINR(product.price)}</p>
      </div>
      <button
        onClick={() => {
          add(product, 1);
          track("add_to_cart", { value: product.price, items: [{ item_id: product.productId, item_name: product.name, price: product.price, quantity: 1 }] });
          openDrawer();
        }}
        className="flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white"
      >
        <ShoppingBag className="size-4" /> Add to cart
      </button>
    </div>
  );
}
