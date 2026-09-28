"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const ids = z.array(z.string().min(1).max(40)).max(200);

/** Adds locally-saved wishlist items to the signed-in user's wishlist. */
export async function syncWishlist(productIds: string[]) {
  const user = await getCurrentUser();
  const parsed = ids.safeParse(productIds);
  if (!user || !parsed.success || !parsed.data.length) return;
  const existing = await prisma.product.findMany({ where: { id: { in: parsed.data } }, select: { id: true } });
  await prisma.wishlistItem.createMany({
    data: existing.map((p) => ({ userId: user.id, productId: p.id })),
    skipDuplicates: true,
  });
}

/** Toggles a product in the signed-in user's wishlist. Returns the new state, or null for guests. */
export async function toggleWishlist(productId: string, add: boolean) {
  const user = await getCurrentUser();
  if (!user || !z.string().min(1).max(40).safeParse(productId).success) return null;
  if (add) {
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) return null;
    await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: user.id, productId } },
      create: { userId: user.id, productId },
      update: {},
    });
    return true;
  }
  await prisma.wishlistItem.deleteMany({ where: { userId: user.id, productId } });
  return false;
}
