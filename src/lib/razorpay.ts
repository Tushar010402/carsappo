import "server-only";
import crypto from "node:crypto";

// Overridable only so automated tests can point at a local stand-in.
const API = process.env.RAZORPAY_API_BASE || "https://api.razorpay.com/v1";

export function razorpayEnabled() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function razorpayKeyId() {
  return process.env.RAZORPAY_KEY_ID ?? "";
}

function authHeader() {
  const token = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  return `Basic ${token}`;
}

async function call<T>(path: string, init: RequestInit & { body?: string } = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: authHeader(), "Content-Type": "application/json", ...(init.headers ?? {}) },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data as { error?: { description?: string } })?.error?.description ?? `Razorpay error ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

export type RazorpayOrder = { id: string; amount: number; currency: string; status: string };

/** Creates a Razorpay order. `amount` is in paise. */
export function createRazorpayOrder(args: { amount: number; receipt: string; notes?: Record<string, string> }) {
  return call<RazorpayOrder>("/orders", {
    method: "POST",
    body: JSON.stringify({ amount: args.amount, currency: "INR", receipt: args.receipt, notes: args.notes ?? {} }),
  });
}

export function fetchRazorpayOrder(orderId: string) {
  return call<RazorpayOrder & { amount_paid: number }>(`/orders/${encodeURIComponent(orderId)}`);
}

export function refundRazorpayPayment(paymentId: string, amount?: number) {
  return call<{ id: string; status: string; amount: number }>(`/payments/${encodeURIComponent(paymentId)}/refund`, {
    method: "POST",
    body: JSON.stringify(amount ? { amount } : {}),
  });
}

function safeEqualHex(a: string, b: string) {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/** Verifies the signature returned by Razorpay Checkout after a successful payment. */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqualHex(expected, signature);
}

/** Verifies the X-Razorpay-Signature header of a webhook against the raw request body. */
export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
