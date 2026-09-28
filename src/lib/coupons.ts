import "server-only";
import type { Coupon } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/format";

export type CouponResult = { ok: true; coupon: Coupon; discount: number } | { ok: false; error: string };

export function couponDiscount(coupon: Pick<Coupon, "type" | "value" | "maxDiscount">, subtotal: number) {
  if (coupon.type === "PERCENT") {
    const raw = Math.floor((subtotal * coupon.value) / 100);
    return Math.min(raw, coupon.maxDiscount ?? raw, subtotal);
  }
  return Math.min(coupon.value, subtotal);
}

export function describeCoupon(c: Pick<Coupon, "type" | "value" | "maxDiscount" | "minOrder">) {
  const off = c.type === "PERCENT" ? `${c.value}% off` : `${formatINR(c.value)} off`;
  const cap = c.type === "PERCENT" && c.maxDiscount ? ` (up to ${formatINR(c.maxDiscount)})` : "";
  const min = c.minOrder > 0 ? ` on orders above ${formatINR(c.minOrder)}` : "";
  return `${off}${cap}${min}`;
}

export async function validateCoupon(args: {
  code: string;
  subtotal: number;
  email?: string | null;
  userId?: string | null;
}): Promise<CouponResult> {
  const code = args.code.trim().toUpperCase();
  if (!code) return { ok: false, error: "Enter a coupon code" };
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  const now = new Date();
  if (!coupon || !coupon.isActive) return { ok: false, error: "This coupon code is not valid" };
  if (coupon.startsAt && coupon.startsAt > now) return { ok: false, error: "This coupon is not active yet" };
  if (coupon.expiresAt && coupon.expiresAt < now) return { ok: false, error: "This coupon has expired" };
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, error: "This coupon has reached its usage limit" };
  }
  if (args.subtotal < coupon.minOrder) {
    return { ok: false, error: `Add ${formatINR(coupon.minOrder - args.subtotal)} more to use ${code}` };
  }
  if (coupon.perUserLimit !== null && (args.email || args.userId)) {
    const used = await prisma.couponUsage.count({
      where: {
        couponId: coupon.id,
        OR: [...(args.email ? [{ email: args.email }] : []), ...(args.userId ? [{ userId: args.userId }] : [])],
      },
    });
    if (used >= coupon.perUserLimit) return { ok: false, error: "You have already used this coupon" };
  }
  const discount = couponDiscount(coupon, args.subtotal);
  if (discount <= 0) return { ok: false, error: "This coupon doesn't apply to your cart" };
  return { ok: true, coupon, discount };
}
