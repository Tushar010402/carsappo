import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { PAGE_SIZE, SORT_OPTIONS, type SortValue } from "@/lib/constants";
import { firstParam, toArray } from "@/lib/utils";

export const productCardSelect = {
  id: true,
  name: true,
  slug: true,
  sku: true,
  price: true,
  mrp: true,
  discountPercent: true,
  stock: true,
  lowStockAlert: true,
  ratingAvg: true,
  ratingCount: true,
  isBestSeller: true,
  isTrending: true,
  isPremium: true,
  isUniversal: true,
  createdAt: true,
  images: { select: { url: true, alt: true }, orderBy: { sortOrder: "asc" }, take: 2 },
  category: { select: { name: true, slug: true } },
  brand: { select: { name: true, slug: true } },
} satisfies Prisma.ProductSelect;

export type ProductCardData = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

export type VehicleFilter = { make?: string; model?: string; year?: number; fuel?: string };

export type ShopFilters = VehicleFilter & {
  q?: string;
  category?: string;
  brands: string[];
  min?: number; // rupees
  max?: number; // rupees
  offers?: boolean;
  inStock?: boolean;
  rating?: number;
  collection?: "best-sellers" | "new" | "premium" | "trending" | "featured";
  sort: SortValue;
  page: number;
};

type SP = Record<string, string | string[] | undefined>;

const COLLECTIONS = ["best-sellers", "new", "premium", "trending", "featured"] as const;

export function parseShopFilters(sp: SP, fixedCategory?: string): ShopFilters {
  const num = (v: string | undefined) => {
    const n = v ? Number(v) : NaN;
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  const sortRaw = firstParam(sp.sort);
  const sort = (SORT_OPTIONS.some((o) => o.value === sortRaw) ? sortRaw : "popular") as SortValue;
  const collectionRaw = firstParam(sp.collection);
  const collection = COLLECTIONS.find((c) => c === collectionRaw);
  return {
    q: firstParam(sp.q)?.trim().slice(0, 80) || undefined,
    category: fixedCategory ?? (firstParam(sp.category) || undefined),
    brands: toArray(sp.brand).flatMap((b) => b.split(",")).filter(Boolean).slice(0, 20),
    min: num(firstParam(sp.min)),
    max: num(firstParam(sp.max)),
    offers: firstParam(sp.offers) === "1",
    inStock: firstParam(sp.inStock) === "1",
    rating: num(firstParam(sp.rating)),
    make: firstParam(sp.make) || undefined,
    model: firstParam(sp.model) || undefined,
    year: num(firstParam(sp.year)),
    fuel: firstParam(sp.fuel)?.toUpperCase() || undefined,
    collection,
    sort,
    page: Math.max(1, Math.floor(num(firstParam(sp.page)) ?? 1)),
  };
}

function stem(word: string) {
  return word.length > 3 && word.endsWith("s") ? word.slice(0, -1) : word;
}

export function searchWhere(q: string): Prisma.ProductWhereInput {
  const words = q
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9-]/g, ""))
    .filter((w) => w.length > 1)
    .slice(0, 6)
    .map(stem);
  if (!words.length) return {};
  return {
    AND: words.map((w) => ({
      OR: [
        { name: { contains: w, mode: "insensitive" } },
        { shortDescription: { contains: w, mode: "insensitive" } },
        { tags: { has: w } },
        { tags: { has: `${w}s` } },
        { sku: { contains: w, mode: "insensitive" } },
        { category: { name: { contains: w, mode: "insensitive" } } },
        { brand: { name: { contains: w, mode: "insensitive" } } },
      ],
    })),
  };
}

/** Products that fit the given vehicle (or are universal). */
export async function vehicleWhere(v: VehicleFilter): Promise<Prisma.ProductWhereInput | null> {
  if (!v.make || !v.model) return null;
  const model = await prisma.vehicleModel.findFirst({
    where: { slug: v.model, make: { slug: v.make } },
    select: { id: true },
  });
  if (!model) return { id: "__none__" };
  const conditions: Prisma.ProductCompatibilityWhereInput[] = [{ vehicleModelId: model.id }];
  if (v.year) {
    conditions.push({ OR: [{ yearFrom: null }, { yearFrom: { lte: v.year } }] });
    conditions.push({ OR: [{ yearTo: null }, { yearTo: { gte: v.year } }] });
  }
  if (v.fuel) conditions.push({ OR: [{ fuelType: null }, { fuelType: v.fuel }] });
  return { OR: [{ isUniversal: true }, { compatibilities: { some: { AND: conditions } } }] };
}

export async function buildProductWhere(f: ShopFilters): Promise<Prisma.ProductWhereInput> {
  const and: Prisma.ProductWhereInput[] = [{ isActive: true }];
  if (f.q) and.push(searchWhere(f.q));
  if (f.category) {
    and.push({ OR: [{ category: { slug: f.category } }, { category: { parent: { slug: f.category } } }] });
  }
  if (f.brands.length) and.push({ brand: { slug: { in: f.brands } } });
  if (f.min !== undefined) and.push({ price: { gte: Math.round(f.min * 100) } });
  if (f.max !== undefined && f.max > 0) and.push({ price: { lte: Math.round(f.max * 100) } });
  if (f.offers) and.push({ discountPercent: { gt: 0 } });
  if (f.inStock) and.push({ stock: { gt: 0 } });
  if (f.rating) and.push({ ratingAvg: { gte: f.rating } });
  if (f.collection === "best-sellers") and.push({ isBestSeller: true });
  if (f.collection === "premium") and.push({ isPremium: true });
  if (f.collection === "trending") and.push({ isTrending: true });
  if (f.collection === "featured") and.push({ isFeatured: true });
  const vw = await vehicleWhere(f);
  if (vw) and.push(vw);
  return { AND: and };
}

export function productOrderBy(sort: SortValue): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "newest":
      return [{ createdAt: "desc" }];
    case "price-asc":
      return [{ price: "asc" }];
    case "price-desc":
      return [{ price: "desc" }];
    case "rating":
      return [{ ratingAvg: "desc" }, { ratingCount: "desc" }];
    case "discount":
      return [{ discountPercent: "desc" }, { salesCount: "desc" }];
    default:
      return [{ salesCount: "desc" }, { ratingCount: "desc" }, { createdAt: "desc" }];
  }
}

export async function listProducts(f: ShopFilters) {
  const where = await buildProductWhere(f);
  const orderBy = f.collection === "new" && f.sort === "popular" ? productOrderBy("newest") : productOrderBy(f.sort);
  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      select: productCardSelect,
      skip: (f.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  return { total, items, page: f.page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getShopFacets() {
  const [categories, brands, priceAgg] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: "asc" },
      select: { name: true, slug: true, _count: { select: { products: { where: { isActive: true } } } } },
    }),
    prisma.brand.findMany({
      where: { products: { some: { isActive: true } } },
      orderBy: { name: "asc" },
      select: { name: true, slug: true },
    }),
    prisma.product.aggregate({ where: { isActive: true }, _min: { price: true }, _max: { price: true } }),
  ]);
  return {
    categories: categories.map((c) => ({ name: c.name, slug: c.slug, count: c._count.products })),
    brands,
    priceMin: Math.floor((priceAgg._min.price ?? 0) / 100),
    priceMax: Math.ceil((priceAgg._max.price ?? 0) / 100),
  };
}

export async function getProductsForSection(where: Prisma.ProductWhereInput, orderBy: Prisma.ProductOrderByWithRelationInput[], take = 10) {
  return prisma.product.findMany({ where: { isActive: true, ...where }, orderBy, take, select: productCardSelect });
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      specs: { orderBy: { sortOrder: "asc" } },
      faqs: { orderBy: { sortOrder: "asc" } },
      category: { include: { parent: { select: { name: true, slug: true } } } },
      brand: true,
      compatibilities: {
        include: { vehicleModel: { include: { make: { select: { name: true, slug: true } } } } },
      },
      boughtTogether: { where: { isActive: true, stock: { gt: 0 } }, select: productCardSelect, take: 3 },
    },
  });
}

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

export async function getRelatedProducts(product: { id: string; categoryId: string }, take = 8) {
  return prisma.product.findMany({
    where: { isActive: true, categoryId: product.categoryId, id: { not: product.id } },
    orderBy: [{ salesCount: "desc" }],
    take,
    select: productCardSelect,
  });
}

/**
 * "Frequently bought together": explicit admin links first, then products most often
 * co-purchased in past orders, then best sellers from other categories.
 */
export async function getFrequentlyBoughtTogether(product: ProductDetail, take = 2) {
  const picks = product.boughtTogether.slice(0, take);
  if (picks.length >= take) return picks;
  const exclude = [product.id, ...picks.map((p) => p.id)];

  const coPurchased = await prisma.$queryRaw<{ productId: string; n: bigint }[]>`
    SELECT oi2."productId", COUNT(*) AS n
    FROM "OrderItem" oi1
    JOIN "OrderItem" oi2 ON oi1."orderId" = oi2."orderId" AND oi2."productId" <> oi1."productId"
    WHERE oi1."productId" = ${product.id} AND oi2."productId" IS NOT NULL
    GROUP BY oi2."productId"
    ORDER BY n DESC
    LIMIT 6`;
  const coIds = coPurchased.map((r) => r.productId).filter((id) => !exclude.includes(id));
  if (coIds.length) {
    const co = await prisma.product.findMany({
      where: { id: { in: coIds }, isActive: true, stock: { gt: 0 } },
      select: productCardSelect,
    });
    co.sort((a, b) => coIds.indexOf(a.id) - coIds.indexOf(b.id));
    for (const p of co) if (picks.length < take) picks.push(p);
  }
  if (picks.length < take) {
    const fill = await prisma.product.findMany({
      where: {
        isActive: true,
        stock: { gt: 0 },
        id: { notIn: [...exclude, ...picks.map((p) => p.id)] },
        categoryId: { not: product.categoryId },
        price: { lte: Math.max(product.price, 99900) },
      },
      orderBy: [{ isBestSeller: "desc" }, { salesCount: "desc" }],
      take: take - picks.length,
      select: productCardSelect,
    });
    picks.push(...fill);
  }
  return picks;
}

export async function getNavCategories() {
  return prisma.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true, icon: true, image: true, description: true },
  });
}

export async function getVehicleMakes() {
  return prisma.vehicleMake.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { name: true, slug: true, models: { select: { name: true, slug: true, yearFrom: true, yearTo: true, fuelTypes: true, type: true }, orderBy: { name: "asc" } } },
  });
}

export type VehicleTree = Awaited<ReturnType<typeof getVehicleMakes>>;
