"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2 } from "lucide-react";
import { cancelOrder, requestReturn } from "@/app/actions/orders";
import { payWithRazorpay } from "@/components/checkout/razorpay";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { RETURN_REASONS } from "@/lib/constants";
import type { FormState } from "@/lib/validators";

export function CancelOrderButton({ orderNumber, token }: { orderNumber: string; token?: string }) {
  const [state, action] = useActionState<FormState, FormData>(cancelOrder, {});
  const [confirming, setConfirming] = useState(false);
  if (state.message) return <FormMessage state={state} />;
  return confirming ? (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="orderNumber" value={orderNumber} />
      {token && <input type="hidden" name="token" value={token} />}
      <span className="text-sm">Cancel this order?</span>
      <SubmitButton variant="danger" size="sm" pendingText="Cancelling…">
        Yes, cancel
      </SubmitButton>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Keep order
      </Button>
    </form>
  ) : (
    <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
      Cancel order
    </Button>
  );
}

export function PayNowButton({ orderNumber, token, amountLabel }: { orderNumber: string; token: string; amountLabel: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <Button
        size="lg"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          setError(null);
          const res = await fetch("/api/payments/razorpay/retry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderNumber, token }),
          });
          const data = await res.json();
          if (!res.ok) {
            setError(data.error ?? "Payment unavailable");
            setLoading(false);
            return;
          }
          if (data.redirect) {
            router.push(data.redirect);
            return;
          }
          const result = await payWithRazorpay(data.razorpay);
          if (result.ok) router.push(result.redirect);
          else {
            setError(result.error);
            setLoading(false);
          }
        }}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />} Complete payment · {amountLabel}
      </Button>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}

export function ReturnRequestForm({ orderNumber }: { orderNumber: string }) {
  const [state, action] = useActionState<FormState, FormData>(requestReturn, {});
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="orderNumber" value={orderNumber} />
      <Field label="Reason" error={state.errors?.reason} htmlFor="ret-reason">
        <Select id="ret-reason" name="reason" required defaultValue="">
          <option value="" disabled>
            Select a reason
          </option>
          {RETURN_REASONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </Select>
      </Field>
      <Field label="Details (optional)" htmlFor="ret-details">
        <Textarea id="ret-details" name="details" className="min-h-20" placeholder="Tell us what went wrong. You can share photos with us on WhatsApp." />
      </Field>
      <FormMessage state={state} />
      <SubmitButton variant="dark" pendingText="Submitting…">
        Request return
      </SubmitButton>
    </form>
  );
}
