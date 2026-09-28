import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { computeQuote } from "@/lib/pricing";
import { describeCoupon } from "@/lib/coupons";
import { cartItemsSchema } from "@/lib/validators";

const bodySchema = z.object({
  items: cartItemsSchema,
  couponCode: z.string().trim().toUpperCase().max(40).nullish(),
  pincode: z.string().regex(/^\d{6}$/).nullish(),
  paymentMethod: z.enum(["RAZORPAY", "COD"]).optional(),
  email: z.string().email().nullish(),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
  const user = await getCurrentUser();
  const quote = await computeQuote({ ...parsed.data, email: parsed.data.email ?? user?.email, userId: user?.id });

  const now = new Date();
  const coupons = await prisma.coupon.findMany({
    where: {
      isActive: true,
      isPublic: true,
      AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  return NextResponse.json({
    quote,
    coupons: coupons
      .filter((c) => c.usageLimit === null || c.usedCount < c.usageLimit)
      .map((c) => ({ code: c.code, description: c.description || describeCoupon(c), minOrder: c.minOrder })),
  });
}
