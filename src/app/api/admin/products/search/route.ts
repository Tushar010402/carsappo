import type { NextRequest } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Product lookup for admin pickers (e.g. "frequently bought together"). */
export async function GET(req: NextRequest) {
  try {
    await assertAdmin();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
  const exclude = (req.nextUrl.searchParams.get("exclude") ?? "").slice(0, 40);
  const products = await prisma.product.findMany({
    where: {
      ...(exclude ? { id: { not: exclude } } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { sku: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: { id: true, name: true, sku: true, price: true, isActive: true, images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 } },
    orderBy: [{ isActive: "desc" }, { salesCount: "desc" }],
    take: 12,
  });
  return Response.json({
    products: products.map((p) => ({ id: p.id, name: p.name, sku: p.sku, price: p.price, isActive: p.isActive, image: p.images[0]?.url ?? null })),
  });
}
