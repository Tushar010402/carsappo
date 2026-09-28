"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, Truck, X } from "lucide-react";
import { useCart, cartSubtotal } from "@/store/cart";
import { SmartImage } from "@/components/ui/smart-image";
import { ButtonLink } from "@/components/ui/button";
import { formatINR } from "@/lib/format";

export function CartDrawer({ freeShippingThreshold }: { freeShippingThreshold: number }) {
  const { items, drawerOpen, closeDrawer, setQuantity, remove } = useCart();
  const subtotal = cartSubtotal(items);
  const remaining = Math.max(0, freeShippingThreshold - subtotal);
  const progress = Math.min(100, (subtotal / Math.max(freeShippingThreshold, 1)) * 100);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeDrawer();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={closeDrawer} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-lift">
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <h2 className="text-lg font-semibold">Your cart</h2>
          <button onClick={closeDrawer} className="grid size-10 place-items-center rounded-full hover:bg-mist" aria-label="Close cart">
            <X className="size-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="grid size-16 place-items-center rounded-2xl bg-mist">
              <ShoppingBag className="size-7" />
            </div>
            <p className="font-display text-lg font-semibold">Your cart is empty</p>
            <p className="text-sm text-muted">Everything your car needs is one click away.</p>
            <ButtonLink href="/shop" onClick={closeDrawer}>
              Shop accessories
            </ButtonLink>
          </div>
        ) : (
          <>
            <div className="border-b border-line px-5 py-4">
              <p className="flex items-center gap-2 text-sm">
                <Truck className="size-4" />
                {remaining > 0 ? (
                  <span>
                    Add <b>{formatINR(remaining)}</b> more for <b>free shipping</b>
                  </span>
                ) : (
                  <span className="font-medium text-success">You&apos;ve unlocked free shipping!</span>
                )}
              </p>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-mist">
                <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-4 py-4">
                  <Link href={`/product/${item.slug}`} onClick={closeDrawer} className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-mist">
                    {item.image && <SmartImage src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link href={`/product/${item.slug}`} onClick={closeDrawer} className="line-clamp-2 text-sm font-medium">
                      {item.name}
                    </Link>
                    <p className="mt-1 font-display text-sm font-semibold">{formatINR(item.price)}</p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full border border-line">
                        <button
                          className="grid size-8 place-items-center"
                          onClick={() => setQuantity(item.productId, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          className="grid size-8 place-items-center disabled:opacity-40"
                          onClick={() => setQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= Math.min(item.stock, 20)}
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <button onClick={() => remove(item.productId)} className="text-muted hover:text-danger" aria-label={`Remove ${item.name}`}>
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-line p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Subtotal (incl. GST)</span>
                <span className="font-display text-lg font-semibold">{formatINR(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-muted">Shipping and coupons are applied at checkout.</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <ButtonLink href="/cart" variant="outline" onClick={closeDrawer}>
                  View cart
                </ButtonLink>
                <ButtonLink href="/checkout" onClick={closeDrawer}>
                  Checkout
                </ButtonLink>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
