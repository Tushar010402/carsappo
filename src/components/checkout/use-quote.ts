"use client";

import { useEffect, useState } from "react";
import type { Quote } from "@/lib/pricing";
import { useCart } from "@/store/cart";

export type PublicCoupon = { code: string; description: string; minOrder: number };

type Result = { key: string; quote: Quote; coupons: PublicCoupon[] };

/** Fetches an authoritative server quote whenever the cart (or checkout inputs) change. */
export function useQuote(opts: { pincode?: string | null; paymentMethod?: "RAZORPAY" | "COD"; email?: string | null } = {}) {
  const items = useCart((s) => s.items);
  const hydrated = useCart((s) => s.hydrated);
  const couponCode = useCart((s) => s.couponCode);
  const syncFromQuote = useCart((s) => s.syncFromQuote);
  const [result, setResult] = useState<Result | null>(null);

  const pincode = opts.pincode && /^\d{6}$/.test(opts.pincode) ? opts.pincode : null;
  const email = opts.email && opts.email.includes("@") ? opts.email : null;
  const key = JSON.stringify({ items: items.map((i) => [i.productId, i.quantity]), couponCode, pincode, paymentMethod: opts.paymentMethod, email });

  useEffect(() => {
    if (!hydrated || !items.length) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/cart/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ctrl.signal,
          body: JSON.stringify({
            items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
            couponCode,
            pincode,
            paymentMethod: opts.paymentMethod,
            email,
          }),
        });
        const data = (await res.json()) as { quote: Quote; coupons: PublicCoupon[] };
        setResult({ key, quote: data.quote, coupons: data.coupons });
        const changed =
          data.quote.removed.length > 0 ||
          data.quote.lines.some((l) => {
            const item = items.find((i) => i.productId === l.productId);
            return !item || item.price !== l.price || item.quantity !== l.quantity || item.stock !== l.stock;
          });
        if (changed) syncFromQuote(data.quote.lines, data.quote.removed);
      } catch {
        /* aborted or offline — keep the previous quote */
      }
    }, 150);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // `key` captures every input that affects the quote.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, hydrated]);

  const empty = !items.length;
  return {
    quote: empty ? null : (result?.quote ?? null),
    coupons: result?.coupons ?? [],
    loading: hydrated && !empty && result?.key !== key,
    hydrated,
    items,
  };
}
