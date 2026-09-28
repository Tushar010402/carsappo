import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { searchWhere } from "@/lib/catalog";
import { POPULAR_SEARCHES } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 60);
  if (q.length < 2) {
    return NextResponse.json({ products: [], categories: [], suggestions: POPULAR_SEARCHES });
  }
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, ...searchWhere(q) },
      orderBy: [{ salesCount: "desc" }],
      take: 6,
      select: {
        name: true,
        slug: true,
        price: true,
        mrp: true,
        category: { select: { name: true } },
        images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
      },
    }),
    prisma.category.findMany({
      where: { isActive: true, name: { contains: q, mode: "insensitive" } },
      take: 4,
      select: { name: true, slug: true },
    }),
  ]);
  const lower = q.toLowerCase();
  const suggestions = POPULAR_SEARCHES.filter((s) => s.toLowerCase().includes(lower) && s.toLowerCase() !== lower).slice(0, 4);
  return NextResponse.json(
    {
      products: products.map((p) => ({
        name: p.name,
        slug: p.slug,
        price: p.price,
        mrp: p.mrp,
        category: p.category.name,
        image: p.images[0]?.url ?? null,
      })),
      categories,
      suggestions,
    },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } },
  );
}
