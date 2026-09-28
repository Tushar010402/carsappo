"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Banknote, Building2, CreditCard, Loader2, Lock, ShieldCheck, ShoppingBag } from "lucide-react";
import { useCart } from "@/store/cart";
import { useQuote } from "@/components/checkout/use-quote";
import { CouponBox, Totals } from "@/components/checkout/summary";
import { AddressFields, emptyAddress, type AddressDraft } from "@/components/checkout/address-fields";
import { payWithRazorpay, type RazorpayOptions } from "@/components/checkout/razorpay";
import { Field, Input, Textarea, Checkbox } from "@/components/ui/field";
import { Button, ButtonLink } from "@/components/ui/button";
import { SmartImage } from "@/components/ui/smart-image";
import { EmptyState } from "@/components/ui/container";
import { formatINR } from "@/lib/format";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type SavedAddress = AddressDraft & { id: string; isDefault: boolean };

export function CheckoutView({
  user,
  addresses,
  razorpayAvailable,
  codFee,
}: {
  user: { name: string; email: string; phone: string | null } | null;
  addresses: SavedAddress[];
  razorpayAvailable: boolean;
  codFee: number;
}) {
  const router = useRouter();
  const clear = useCart((s) => s.clear);
  const setPincode = useCart((s) => s.setPincode);
  const couponCode = useCart((s) => s.couponCode);

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [addressId, setAddressId] = useState<string | null>(defaultAddress?.id ?? null);
  const [address, setAddress] = useState<AddressDraft>(defaultAddress ?? { ...emptyAddress, name: user?.name ?? "", phone: user?.phone ?? "" });
  const [saveAddress, setSaveAddress] = useState(true);
  const [wantsGst, setWantsGst] = useState(false);
  const [gstin, setGstin] = useState("");
  const [note, setNote] = useState("");
  const [method, setMethod] = useState<"RAZORPAY" | "COD">(razorpayAvailable ? "RAZORPAY" : "COD");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pending, setPending] = useState<{ orderNumber: string; redirect: string; razorpay: RazorpayOptions } | null>(null);

  const { quote, coupons, loading, hydrated, items } = useQuote({ pincode: address.pincode, paymentMethod: method, email });

  useEffect(() => {
    if (/^\d{6}$/.test(address.pincode)) setPincode(address.pincode);
  }, [address.pincode, setPincode]);

  useEffect(() => {
    if (quote && !quote.codAvailable && method === "COD" && razorpayAvailable) setMethod("RAZORPAY");
  }, [quote, method, razorpayAvailable]);

  const tracked = useRef(false);
  useEffect(() => {
    if (quote && !tracked.current) {
      tracked.current = true;
      track("begin_checkout", { value: quote.total, items: quote.lines.map((l) => ({ item_id: l.productId, item_name: l.name, price: l.price, quantity: l.quantity })) });
    }
  }, [quote]);

  if (!hydrated) return <div className="h-[600px] animate-pulse rounded-3xl bg-mist" />;
  if (!items.length && !pending) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-6" />}
        title="Your cart is empty"
        description="Add something to your cart to check out."
        action={<ButtonLink href="/shop">Shop accessories</ButtonLink>}
      />
    );
  }

  const openPayment = async (p: { redirect: string; razorpay: RazorpayOptions }) => {
    track("add_payment_info", { value: p.razorpay.amount, extra: { payment_type: "razorpay" } });
    const result = await payWithRazorpay(p.razorpay);
    if (result.ok) {
      clear();
      router.push(result.redirect);
    } else {
      setFormError(result.error);
      setSubmitting(false);
    }
  };

  const placeOrder = async () => {
    setSubmitting(true);
    setErrors({});
    setFormError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          couponCode,
          email,
          phone,
          address: { ...address, line2: address.line2 || undefined, landmark: address.landmark || undefined },
          addressId,
          saveAddress: !!user && !addressId && saveAddress,
          gstin: wantsGst ? gstin : null,
          note: note || null,
          paymentMethod: method,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors ?? {});
        setFormError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        if (data.errors) document.querySelector("[aria-invalid=true]")?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      if (data.razorpay) {
        setPending({ orderNumber: data.orderNumber, redirect: data.redirect, razorpay: data.razorpay });
        await openPayment(data);
      } else {
        clear();
        router.push(data.redirect);
      }
    } catch {
      setFormError("Network error. Please check your connection and try again.");
      setSubmitting(false);
    }
  };

  const section = "rounded-[28px] border border-line p-5 sm:p-7";
  const stepTitle = (n: number, title: string) => (
    <h2 className="mb-5 flex items-center gap-3 text-lg font-semibold">
      <span className="grid size-7 place-items-center rounded-full bg-ink text-xs text-white">{n}</span>
      {title}
    </h2>
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
      <div className="space-y-6">
        {/* 1. Contact */}
        <section className={section}>
          {stepTitle(1, "Contact")}
          {user ? (
            <p className="mb-4 text-sm text-muted">
              Signed in as <b className="text-ink">{user.email}</b>
            </p>
          ) : (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-mist px-4 py-3 text-sm">
              <span>Checking out as a guest. Have an account?</span>
              <Link href="/login?next=/checkout" className="font-semibold underline">
                Log in
              </Link>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" error={errors.email} htmlFor="c-email" hint="Order updates and invoice are sent here.">
              <Input id="c-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!!user} invalid={!!errors.email} />
            </Field>
            <Field label="Mobile number" error={errors.phone} htmlFor="c-phone" hint="For delivery updates on SMS / WhatsApp.">
              <Input id="c-phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} invalid={!!errors.phone} />
            </Field>
          </div>
        </section>

        {/* 2. Address */}
        <section className={section}>
          {stepTitle(2, "Shipping address")}
          {addresses.length > 0 && (
            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              {addresses.map((a) => (
                <label
                  key={a.id}
                  className={cn("cursor-pointer rounded-2xl border p-4 text-sm transition", addressId === a.id ? "border-ink ring-1 ring-ink" : "border-line hover:border-zinc-400")}
                >
                  <input
                    type="radio"
                    name="addr"
                    className="sr-only"
                    checked={addressId === a.id}
                    onChange={() => {
                      setAddressId(a.id);
                      setAddress(a);
                    }}
                  />
                  <p className="font-semibold">{a.name}</p>
                  <p className="mt-1 text-muted">
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode}
                  </p>
                  <p className="mt-1 text-muted">{a.phone}</p>
                </label>
              ))}
              <button
                type="button"
                onClick={() => {
                  setAddressId(null);
                  setAddress({ ...emptyAddress, name: user?.name ?? "", phone: user?.phone ?? "" });
                }}
                className={cn("rounded-2xl border border-dashed p-4 text-sm font-semibold", addressId === null ? "border-ink" : "border-line")}
              >
                + Add a new address
              </button>
            </div>
          )}
          {addressId === null && (
            <>
              <AddressFields value={address} onChange={setAddress} errors={errors} />
              {user && <Checkbox className="mt-4" label="Save this address for next time" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />}
            </>
          )}
          <div className="mt-5 border-t border-line pt-5">
            <Checkbox label="I need a GST invoice (for business purchases)" checked={wantsGst} onChange={(e) => setWantsGst(e.target.checked)} />
            {wantsGst && (
              <Field className="mt-3 sm:w-1/2" error={errors.gstin} htmlFor="c-gstin">
                <Input id="c-gstin" value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} placeholder="GSTIN e.g. 09ABCDE1234F1Z5" invalid={!!errors.gstin} />
              </Field>
            )}
          </div>
        </section>

        {/* 3. Payment */}
        <section className={section}>
          {stepTitle(3, "Payment")}
          <div className="space-y-3">
            <label
              className={cn(
                "flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition",
                method === "RAZORPAY" ? "border-ink ring-1 ring-ink" : "border-line",
                !razorpayAvailable && "cursor-not-allowed opacity-50",
              )}
            >
              <input type="radio" name="pay" className="mt-1 accent-ink" checked={method === "RAZORPAY"} disabled={!razorpayAvailable} onChange={() => setMethod("RAZORPAY")} />
              <span className="flex-1">
                <span className="flex items-center gap-2 font-semibold">
                  <CreditCard className="size-4" /> Pay online
                </span>
                <span className="mt-1 block text-sm text-muted">UPI (GPay, PhonePe, Paytm), Debit / Credit cards, Net Banking — secured by Razorpay.</span>
                {!razorpayAvailable && <span className="mt-1 block text-xs text-danger">Online payment is not configured yet.</span>}
              </span>
            </label>
            <label
              className={cn(
                "flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition",
                method === "COD" ? "border-ink ring-1 ring-ink" : "border-line",
                quote && !quote.codAvailable && "cursor-not-allowed opacity-50",
              )}
            >
              <input type="radio" name="pay" className="mt-1 accent-ink" checked={method === "COD"} disabled={!!quote && !quote.codAvailable} onChange={() => setMethod("COD")} />
              <span className="flex-1">
                <span className="flex items-center gap-2 font-semibold">
                  <Banknote className="size-4" /> Cash on Delivery
                  {codFee > 0 && <span className="text-xs font-normal text-muted">(+{formatINR(codFee)})</span>}
                </span>
                <span className="mt-1 block text-sm text-muted">Pay in cash or UPI when your order arrives.</span>
                {quote && !quote.codAvailable && <span className="mt-1 block text-xs text-danger">COD is not available for this order.</span>}
              </span>
            </label>
          </div>
          <Field label="Order note (optional)" className="mt-5" htmlFor="c-note">
            <Textarea id="c-note" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-20" placeholder="Car model & variant for custom-fit items, delivery instructions…" />
          </Field>
        </section>
      </div>

      {/* Summary */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-[28px] bg-mist p-6">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <ul className="mt-5 max-h-72 space-y-4 overflow-y-auto pr-1">
            {items.map((i) => (
              <li key={i.productId} className="flex items-center gap-3">
                <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-white">
                  {i.image && <SmartImage src={i.image} alt="" fill sizes="56px" className="object-cover" />}
                  <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-ink text-[10px] font-bold text-white">{i.quantity}</span>
                </span>
                <span className="line-clamp-2 flex-1 text-sm">{i.name}</span>
                <span className="text-sm font-medium">{formatINR(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 border-t border-line pt-5">
            <CouponBox quote={quote} coupons={coupons} />
          </div>
          <div className="mt-5 border-t border-line pt-5">
            <Totals quote={quote} loading={loading} showCod />
          </div>

          {quote?.issues.length ? (
            <div className="mt-4 space-y-1 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
              {quote.issues.map((i) => (
                <p key={i}>{i}</p>
              ))}
            </div>
          ) : null}

          {formError && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {formError}
            </p>
          )}

          {pending ? (
            <Button size="lg" className="mt-6 w-full" onClick={() => openPayment(pending)} disabled={submitting}>
              Retry payment · {formatINR(pending.razorpay.amount)}
            </Button>
          ) : (
            <Button size="lg" className="mt-6 w-full" onClick={placeOrder} disabled={submitting || loading || !quote}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
              {method === "COD" ? "Place order" : "Pay"} {quote ? formatINR(quote.total) : ""}
            </Button>
          )}
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
            <ShieldCheck className="size-3.5" /> 100% secure · By placing the order you agree to our{" "}
            <Link href="/policies/terms-and-conditions" className="underline">
              terms
            </Link>
          </p>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted">
            <Building2 className="size-3.5" /> GST invoice included with every order
          </p>
        </div>
      </aside>
    </div>
  );
}
