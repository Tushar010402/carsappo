import "server-only";
import type { Prisma } from "@prisma/client";
import { lowStockProducts } from "@/lib/admin/metrics";
import { enumParam, param, type SearchParams } from "@/lib/admin/query";

export const STOCK_FILTERS = ["low", "out", "in"] as const;

/** Shared by the inventory page and its CSV export so both show the same rows. */
export async function inventoryWhere(sp: SearchParams) {
  const q = param(sp, "q");
  const category = param(sp, "category");
  const stock = enumParam(sp, "stock", STOCK_FILTERS);
  const where: Prisma.ProductWhereInput = {
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }] } : {}),
    ...(category ? { categoryId: category } : {}),
    ...(stock === "out" ? { stock: { lte: 0 } } : {}),
    ...(stock === "in" ? { stock: { gt: 0 } } : {}),
  };
  if (stock === "low") where.id = { in: await lowStockProducts() };
  return { where, q, category, stock };
}
