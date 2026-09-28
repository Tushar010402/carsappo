"use client";

import { useEffect, useRef, useState } from "react";
import type { Quote } from "@/lib/pricing";
import { useCart } from "@/store/cart";

export type PublicCoupon = { code: string; description: string; minOrder: number };

/** Fetches an authoritative server quote whenever the cart (or checkout inputs) change. */
export function useQuote(opts: { pincode?: string | null; paymentMethod?: "RAZORPAY" | "COD"; email?: string | null } = {}) {
  const items = useCart((s) => s.items);
  const hydrated = useCart((s) => s.hydrated);
  const couponCode = useCart((s) => s.couponCode);
  const syncFromQuote = useCart((s) => s.syncFromQuote);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [coupons, setCoupons] = useState<PublicCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);

  const key = JSON.stringify({
    items: items.map((i) => [i.productId, i.quantity]),
    couponCode,
    pincode: opts.pincode,
    paymentMethod: opts.paymentMethod,
    email: opts.email,
  });

  useEffect(() => {
    if (!hydrated) return;
    if (!items.length) {
      setQuote(null);
      setLoading(false);
      return;
    }
    const id = ++seq.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/cart/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
            couponCode,
            pincode: opts.pincode && /^\d{6}$/.test(opts.pincode) ? opts.pincode : null,
            paymentMethod: opts.paymentMethod,
            email: opts.email && opts.email.includes("@") ? opts.email : null,
          }),
        });
        const data = (await res.json()) as { quote: Quote; coupons: PublicCoupon[] };
        if (id !== seq.current) return;
        setQuote(data.quote);
        setCoupons(data.coupons);
        const changed = data.quote.removed.length > 0 || data.quote.lines.some((l) => {
          const item = items.find((i) => i.productId === l.productId);
          return !item || item.price !== l.price || item.quantity !== l.quantity || item.stock !== l.stock;
        });
        if (changed) syncFromQuote(data.quote.lines, data.quote.removed);
      } finally {
        if (id === seq.current) setLoading(false);
      }
    }, 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, hydrated]);

  return { quote, coupons, loading, hydrated, items };
}
