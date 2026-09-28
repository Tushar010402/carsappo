import "server-only";
import { prisma } from "@/lib/db";
import type { ProductFormValues } from "@/components/admin/products/product-form";

/** Options for the product form selects and the vehicle compatibility editor. */
export async function productFormOptions() {
  const [categories, brands, makes] = await Promise.all([
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, parent: { select: { name: true } } } }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.vehicleMake.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        models: { orderBy: { name: "asc" }, select: { id: true, name: true, type: true, yearFrom: true, yearTo: true, fuelTypes: true } },
      },
    }),
  ]);
  return {
    categories: categories.map((c) => ({ id: c.id, name: c.name, parentName: c.parent?.name ?? null })),
    brands,
    makes,
  };
}

export const EMPTY_PRODUCT: ProductFormValues = {
  name: "",
  slug: "",
  sku: "",
  shortDescription: "",
  description: "",
  price: null,
  mrp: null,
  gstRate: 18,
  hsnCode: "",
  stock: 0,
  lowStockAlert: 5,
  weightGrams: 500,
  lengthCm: 20,
  breadthCm: 15,
  heightCm: 10,
  categoryId: "",
  brandId: "",
  videoUrl: "",
  features: [],
  tags: [],
  isActive: true,
  isFeatured: false,
  isBestSeller: false,
  isTrending: false,
  isPremium: false,
  isUniversal: false,
  metaTitle: "",
  metaDescription: "",
  images: [],
  specs: [],
  faqs: [],
  compat: [],
  boughtTogether: [],
};

export async function productFormValues(id: string): Promise<(ProductFormValues & { id: string; orderCount: number }) | null> {
  const p = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      specs: { orderBy: { sortOrder: "asc" } },
      faqs: { orderBy: { sortOrder: "asc" } },
      compatibilities: true,
      boughtTogether: { select: { id: true, name: true, sku: true, price: true, images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 } } },
      _count: { select: { orderItems: true } },
    },
  });
  if (!p) return null;
  return {
    id: p.id,
    orderCount: p._count.orderItems,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    shortDescription: p.shortDescription ?? "",
    description: p.description,
    price: p.price,
    mrp: p.mrp,
    gstRate: p.gstRate,
    hsnCode: p.hsnCode ?? "",
    stock: p.stock,
    lowStockAlert: p.lowStockAlert,
    weightGrams: p.weightGrams,
    lengthCm: p.lengthCm,
    breadthCm: p.breadthCm,
    heightCm: p.heightCm,
    categoryId: p.categoryId,
    brandId: p.brandId ?? "",
    videoUrl: p.videoUrl ?? "",
    features: p.features,
    tags: p.tags,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    isBestSeller: p.isBestSeller,
    isTrending: p.isTrending,
    isPremium: p.isPremium,
    isUniversal: p.isUniversal,
    metaTitle: p.metaTitle ?? "",
    metaDescription: p.metaDescription ?? "",
    images: p.images.map((i) => ({ url: i.url, alt: i.alt ?? "" })),
    specs: p.specs.map((s) => ({ label: s.label, value: s.value })),
    faqs: p.faqs.map((f) => ({ question: f.question, answer: f.answer })),
    compat: p.compatibilities.map((c) => ({ vehicleModelId: c.vehicleModelId, yearFrom: c.yearFrom, yearTo: c.yearTo, fuelType: c.fuelType })),
    boughtTogether: p.boughtTogether.map((b) => ({ id: b.id, name: b.name, sku: b.sku, price: b.price, image: b.images[0]?.url ?? null })),
  };
}
