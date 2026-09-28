"use client";

import { useState } from "react";
import { Loader2, Tag, Ticket, Truck, X } from "lucide-react";
import type { Quote } from "@/lib/pricing";
import { formatINR, formatShortDate } from "@/lib/format";
import { useCart } from "@/store/cart";
import type { PublicCoupon } from "@/components/checkout/use-quote";

export function CouponBox({ quote, coupons }: { quote: Quote | null; coupons: PublicCoupon[] }) {
  const couponCode = useCart((s) => s.couponCode);
  const setCoupon = useCart((s) => s.setCoupon);
  const [code, setCode] = useState("");

  return (
    <div>
      {couponCode && quote?.coupon ? (
        <div className="flex items-center justify-between rounded-xl border border-dashed border-success bg-emerald-50 px-3 py-2.5 text-sm">
          <span className="flex items-center gap-2">
            <Tag className="size-4 text-success" />
            <span>
              <b>{quote.coupon.code}</b> applied · <span className="text-success">−{formatINR(quote.discount)}</span>
            </span>
          </span>
          <button onClick={() => setCoupon(null)} aria-label="Remove coupon" className="text-muted hover:text-ink">
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.trim()) setCoupon(code.trim().toUpperCase());
          }}
        >
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Coupon code"
            aria-label="Coupon code"
            className="field h-10 flex-1 uppercase"
          />
          <button className="h-10 rounded-full bg-ink px-5 text-sm font-semibold text-white">Apply</button>
        </form>
      )}
      {couponCode && quote?.couponError && (
        <p className="mt-2 flex items-center justify-between text-xs text-danger">
          {quote.couponError}
          <button onClick={() => setCoupon(null)} className="underline">
            Remove
          </button>
        </p>
      )}
      {!couponCode && coupons.length > 0 && (
        <div className="mt-3 space-y-2">
          {coupons.map((c) => (
            <button
              key={c.code}
              onClick={() => setCoupon(c.code)}
              className="flex w-full items-center gap-3 rounded-xl border border-line px-3 py-2 text-left text-xs hover:border-ink"
            >
              <Ticket className="size-4 shrink-0" />
              <span className="flex-1">
                <b className="font-display text-sm">{c.code}</b>
                <span className="block text-muted">{c.description}</span>
              </span>
              <span className="font-semibold">Apply</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Totals({ quote, loading, showCod }: { quote: Quote | null; loading: boolean; showCod?: boolean }) {
  if (!quote) return null;
  const row = "flex items-center justify-between text-sm";
  return (
    <div className="relative space-y-2.5">
      {loading && <Loader2 className="absolute -top-1 right-0 size-4 animate-spin text-muted" />}
      <div className={row}>
        <span className="text-muted">Subtotal ({quote.itemCount} items)</span>
        <span>{formatINR(quote.subtotal)}</span>
      </div>
      {quote.mrpTotal > quote.subtotal && (
        <div className={row}>
          <span className="text-muted">You save on MRP</span>
          <span className="text-success">−{formatINR(quote.mrpTotal - quote.subtotal)}</span>
        </div>
      )}
      {quote.discount > 0 && (
        <div className={row}>
          <span className="text-muted">Coupon ({quote.coupon?.code})</span>
          <span className="text-success">−{formatINR(quote.discount)}</span>
        </div>
      )}
      <div className={row}>
        <span className="text-muted">Shipping</span>
        <span>{quote.shippingFee === 0 ? <span className="font-medium text-success">FREE</span> : formatINR(quote.shippingFee)}</span>
      </div>
      {showCod && quote.codFee > 0 && (
        <div className={row}>
          <span className="text-muted">COD charges</span>
          <span>{formatINR(quote.codFee)}</span>
        </div>
      )}
      <div className={row}>
        <span className="text-muted">GST (included)</span>
        <span className="text-muted">{formatINR(quote.taxTotal)}</span>
      </div>
      <div className="flex items-center justify-between border-t border-line pt-3">
        <span className="font-display font-semibold">Order total</span>
        <span className="font-display text-xl font-semibold">{formatINR(quote.total)}</span>
      </div>
      {quote.amountToFreeShipping > 0 && (
        <p className="flex items-center gap-2 rounded-xl bg-brand-soft px-3 py-2 text-xs">
          <Truck className="size-4" /> Add {formatINR(quote.amountToFreeShipping)} more for free shipping
        </p>
      )}
      <p className="flex items-center gap-2 pt-1 text-xs text-muted">
        <Truck className="size-3.5" /> Estimated delivery {formatShortDate(quote.delivery.earliest)} – {formatShortDate(quote.delivery.latest)}
        {quote.delivery.zone !== "India" && ` · ${quote.delivery.zone}`}
      </p>
    </div>
  );
}
