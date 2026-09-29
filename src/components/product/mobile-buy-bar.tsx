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

  // Shown once the main buy box is fully above the viewport. A scroll check (not an IntersectionObserver)
  // also catches fast flings and in-page jumps that skip straight past the box.
  useEffect(() => {
    const el = document.getElementById(anchorId);
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      setVisible(el.getBoundingClientRect().bottom < 0);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [anchorId]);

  const shown = visible && product.stock > 0;
  // Lets the floating WhatsApp button move up so it never covers "Add to cart" (see globals.css).
  useEffect(() => {
    if (!shown) return;
    document.body.dataset.buyBar = "";
    return () => {
      delete document.body.dataset.buyBar;
    };
  }, [shown]);

  if (!shown) return null;
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
