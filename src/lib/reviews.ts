import "server-only";
import { prisma } from "@/lib/db";

/** Recomputes the denormalised rating on a product from approved reviews. */
export async function refreshProductRating(productId: string) {
  const agg = await prisma.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.product.update({
    where: { id: productId },
    data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count._all },
  });
}
