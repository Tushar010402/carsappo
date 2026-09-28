import "server-only";
import { headers } from "next/headers";

// Simple fixed-window in-memory limiter. Good enough for a single Node instance;
// swap for Redis/Upstash if the site is ever scaled horizontally.
const buckets = new Map<string, { count: number; resetAt: number }>();

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function rateLimit(key: string, limit: number, windowMs: number) {
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
