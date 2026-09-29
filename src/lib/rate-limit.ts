import "server-only";
import { headers } from "next/headers";

// Simple fixed-window in-memory limiter. Good enough for a single Node instance;
// swap for Redis/Upstash if the site is ever scaled horizontally.
const buckets = new Map<string, { count: number; resetAt: number }>();

/**
 * Client IP as reported by the reverse proxy. `x-real-ip` (set by Vercel and by the
 * recommended Nginx config) can't be spoofed by the client; otherwise use the *last*
 * `x-forwarded-for` hop, which is the one appended by our own proxy.
 */
export async function clientIp() {
  const h = await headers();
  const real = h.get("x-real-ip")?.trim();
  if (real) return real;
  const hops = h.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean);
  return hops?.at(-1) || "unknown";
}

export async function rateLimit(key: string, limit: number, windowMs: number) {
  // Only for automated end-to-end test runs, which submit many forms from one IP. Never set in production.
  if (process.env.RATE_LIMIT_DISABLED === "true") return { ok: true };
  const ip = await clientIp();
  const id = `${key}:${ip}`;
  const now = Date.now();
  const bucket = buckets.get(id);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(id, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) {
      for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
    }
    return { ok: true };
  }
  bucket.count++;
  return { ok: bucket.count <= limit };
}
