import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { productCardSelect } from "@/lib/catalog";

/** Product card data for a list of IDs (used by the guest wishlist). */
export async function GET(req: NextRequest) {
  const ids = (req.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[a-z0-9]{10,40}$/i.test(s))
    .slice(0, 100);
  if (!ids.length) return NextResponse.json({ products: [] });
  const products = await prisma.product.findMany({ where: { id: { in: ids }, isActive: true }, select: productCardSelect });
  products.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  return NextResponse.json({ products });
}
