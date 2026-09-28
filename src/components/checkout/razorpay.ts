"use client";

export type RazorpayOptions = {
  key: string;
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
};

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, cb: (r: unknown) => void) => void };
  }
}

function loadScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

/** Opens Razorpay Checkout (UPI, cards, net banking, wallets) and verifies the payment server-side. */
export async function payWithRazorpay(opts: RazorpayOptions): Promise<{ ok: true; redirect: string } | { ok: false; error: string; dismissed?: boolean }> {
  if (!(await loadScript()) || !window.Razorpay) return { ok: false, error: "Could not load the payment window. Check your connection and retry." };
  return new Promise((resolve) => {
    const rzp = new window.Razorpay!({
      key: opts.key,
      amount: opts.amount,
      currency: opts.currency,
      name: opts.name,
      description: opts.description,
      order_id: opts.orderId,
      prefill: opts.prefill,
      theme: { color: "#0a0a0a" },
      handler: async (response: RazorpayResponse) => {
        const res = await fetch("/api/payments/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(response),
        });
        const data = await res.json();
        resolve(res.ok ? { ok: true, redirect: data.redirect } : { ok: false, error: data.error ?? "Payment verification failed" });
      },
      modal: { ondismiss: () => resolve({ ok: false, dismissed: true, error: "Payment was cancelled. Your order is saved — you can retry payment." }) },
    });
    rzp.on("payment.failed", () => {
      /* Razorpay shows its own retry UI; final outcome arrives via handler/ondismiss. */
    });
    rzp.open();
  });
}
