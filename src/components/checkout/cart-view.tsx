"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Lock, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/store/cart";
import { useQuote } from "@/components/checkout/use-quote";
import { CouponBox, Totals } from "@/components/checkout/summary";
import { SmartImage } from "@/components/ui/smart-image";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/container";
import { formatINR } from "@/lib/format";
import { track } from "@/lib/analytics";

export function CartView() {
  const pincode = useCart((s) => s.pincode);
  const setPincode = useCart((s) => s.setPincode);
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const { quote, coupons, loading, hydrated, items } = useQuote({ pincode });

  if (!hydrated) return <div className="h-96 animate-pulse rounded-3xl bg-mist" />;

  if (!items.length) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-6" />}
        title="Your cart is empty"
        description="Browse premium mats, seat covers, car care and more."
        action={<ButtonLink href="/shop">Start shopping</ButtonLink>}
      />
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
      <div>
        {quote?.issues.length ? (
          <div className="mb-4 space-y-1 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
            {quote.issues.map((i) => (
              <p key={i} className="flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" /> {i}
              </p>
            ))}
          </div>
        ) : null}
        <ul className="divide-y divide-line border-y border-line">
          {items.map((item) => (
            <li key={item.productId} className="flex gap-4 py-5 sm:gap-6">
              <Link href={`/product/${item.slug}`} className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-mist sm:size-28">
                {item.image && <SmartImage src={item.image} alt={item.name} fill sizes="112px" className="object-cover" />}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link href={`/product/${item.slug}`} className="font-medium hover:underline">
                      {item.name}
                    </Link>
                    <p className="mt-1 text-xs text-muted">SKU {item.sku}</p>
                  </div>
                  <p className="font-display font-semibold whitespace-nowrap">{formatINR(item.price * item.quantity)}</p>
                </div>
                <p className="mt-1 text-sm">
                  {formatINR(item.price)}
                  {item.mrp && item.mrp > item.price && <span className="ml-2 text-xs text-muted line-through">{formatINR(item.mrp)}</span>}
                </p>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center rounded-full border border-line">
                    <button className="grid size-9 place-items-center" onClick={() => setQuantity(item.productId, item.quantity - 1)} aria-label="Decrease quantity">
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      className="grid size-9 place-items-center disabled:opacity-40"
                      onClick={() => setQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= Math.min(item.stock, 20)}
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <button onClick={() => remove(item.productId)} className="flex items-center gap-1.5 text-sm text-muted hover:text-danger">
                    <Trash2 className="size-4" /> Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <Link href="/shop" className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold">
          ← Continue shopping
        </Link>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-[28px] border border-line p-6">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <div className="mt-5">
            <CouponBox quote={quote} coupons={coupons} />
          </div>
          <label className="mt-5 block">
            <span className="label">Delivery pincode</span>
            <input
              defaultValue={pincode ?? ""}
              inputMode="numeric"
              maxLength={6}
              placeholder="For delivery estimate"
              className="field h-10"
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "");
                if (v.length === 6 || v.length === 0) setPincode(v || null);
              }}
            />
          </label>
          <div className="mt-5 border-t border-line pt-5">
            <Totals quote={quote} loading={loading} />
          </div>
          <ButtonLink
            href="/checkout"
            size="lg"
            className="mt-6 w-full"
            onClick={() => quote && track("begin_checkout", { value: quote.total, items: quote.lines.map((l) => ({ item_id: l.productId, item_name: l.name, price: l.price, quantity: l.quantity })) })}
          >
            Proceed to Checkout <ArrowRight className="size-4" />
          </ButtonLink>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
            <Lock className="size-3.5" /> Secure checkout · UPI, cards, net banking{quote?.codAvailable ? " & COD" : ""}
          </p>
        </div>
      </aside>
    </div>
  );
}
