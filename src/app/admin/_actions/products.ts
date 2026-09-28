"use server";

import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { assertAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { discountPercent } from "@/lib/format";
import { FUEL_TYPES } from "@/lib/constants";
import {
  checkbox,
  formObject,
  idSchema,
  intField,
  jsonField,
  linkField,
  optionalRupees,
  optionalText,
  requiredText,
  rupeesField,
  slugField,
  stringList,
} from "@/lib/admin/form";
import { dbError, done, failed, invalid, revalidateAdmin, revalidateStore } from "@/lib/admin/server";
import type { ActionState } from "@/lib/admin/types";

const GST_RATES = [0, 5, 12, 18, 28] as const;
const FUELS = FUEL_TYPES.map((f) => f.value) as [string, ...string[]];

const imageSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1)
    .max(1000)
    .refine((s) => s.startsWith("/") || /^https?:\/\//i.test(s), "Invalid image URL"),
  alt: z.string().trim().max(200).default(""),
});

const compatSchema = z
  .object({
    vehicleModelId: idSchema,
    yearFrom: z.number().int().min(1950).max(2100).nullable(),
    yearTo: z.number().int().min(1950).max(2100).nullable(),
    fuelType: z.enum(FUELS).nullable(),
  })
  .refine((r) => r.yearFrom === null || r.yearTo === null || r.yearFrom <= r.yearTo, "Year from must be before year to");

const productSchema = z
  .object({
    id: z.preprocess((v) => (v === "" ? undefined : v), idSchema.optional()),
    name: requiredText("Name", 160),
    slug: slugField,
    sku: requiredText("SKU", 60).transform((s) => s.toUpperCase()),
    shortDescription: optionalText(300),
    description: z.string().max(50_000).default(""),
    price: rupeesField("Price", 1),
    mrp: optionalRupees("MRP"),
    gstRate: z.coerce.number().refine((n) => (GST_RATES as readonly number[]).includes(n), "Choose a GST rate"),
    hsnCode: optionalText(12).refine((v) => v === null || /^\d{4,8}$/.test(v), "HSN is 4–8 digits"),
    stock: intField("Stock", 0, 1_000_000),
    lowStockAlert: intField("Low-stock alert", 0, 100_000),
    weightGrams: intField("Weight", 1, 100_000),
    lengthCm: intField("Length", 1, 500),
    breadthCm: intField("Breadth", 1, 500),
    heightCm: intField("Height", 1, 500),
    categoryId: idSchema.refine(Boolean, "Choose a category"),
    brandId: z.preprocess((v) => (v === "" ? null : v), idSchema.nullable()),
    videoUrl: linkField(500),
    features: stringList(30, 200),
    tags: stringList(30, 40),
    isActive: checkbox,
    isFeatured: checkbox,
    isBestSeller: checkbox,
    isTrending: checkbox,
    isPremium: checkbox,
    isUniversal: checkbox,
    metaTitle: optionalText(120),
    metaDescription: optionalText(320),
    images: jsonField(z.array(imageSchema).max(20, "At most 20 images")),
    specs: jsonField(z.array(z.object({ label: z.string().trim().min(1, "Spec label is required").max(80), value: z.string().trim().min(1, "Spec value is required").max(300) })).max(40)),
    faqs: jsonField(z.array(z.object({ question: z.string().trim().min(1, "FAQ question is required").max(300), answer: z.string().trim().min(1, "FAQ answer is required").max(3000) })).max(30)),
    compat: jsonField(z.array(compatSchema).max(2000)),
    boughtTogether: jsonField(z.array(idSchema).max(3, "Pick at most 3 products")),
  })
  .refine((d) => d.mrp === null || d.mrp >= d.price, { message: "MRP must be greater than or equal to the selling price", path: ["mrp"] });

export async function saveProduct(_: ActionState, formData: FormData): Promise<ActionState> {
  await assertAdmin();
  const parsed = productSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { id, images, specs, faqs, compat, boughtTogether, ...d } = parsed.data;

  const category = await prisma.category.findUnique({ where: { id: d.categoryId }, select: { slug: true } });
  if (!category) return failed("Choose a valid category", { categoryId: "Choose a category" });

  const fields = {
    ...d,
    discountPercent: discountPercent(d.price, d.mrp),
  } satisfies Omit<Prisma.ProductUncheckedCreateInput, "id">;

  const togetherIds = [...new Set(boughtTogether)].filter((x) => x !== id);
  const children = {
    images: images.map((img, i) => ({ url: img.url, alt: img.alt || null, sortOrder: i })),
    specs: specs.map((s, i) => ({ ...s, sortOrder: i })),
    faqs: faqs.map((f, i) => ({ ...f, sortOrder: i })),
    compat: d.isUniversal ? [] : compat,
  };

  try {
    const saved = await prisma.$transaction(
      async (tx) => {
        let productId: string;
        let previousSlug: string | null = null;
        if (id) {
          const existing = await tx.product.findUnique({ where: { id }, select: { slug: true } });
          if (!existing) throw new Error("Product not found — it may have been deleted.");
          previousSlug = existing.slug;
          await tx.product.update({ where: { id }, data: { ...fields, boughtTogether: { set: togetherIds.map((pid) => ({ id: pid })) } } });
          // Child rows are replaced wholesale.
          await tx.productImage.deleteMany({ where: { productId: id } });
          await tx.productSpec.deleteMany({ where: { productId: id } });
          await tx.productFaq.deleteMany({ where: { productId: id } });
          await tx.productCompatibility.deleteMany({ where: { productId: id } });
          productId = id;
        } else {
          const created = await tx.product.create({
            data: { ...fields, boughtTogether: { connect: togetherIds.map((pid) => ({ id: pid })) } },
            select: { id: true },
          });
          productId = created.id;
        }
        if (children.images.length) await tx.productImage.createMany({ data: children.images.map((c) => ({ ...c, productId })) });
        if (children.specs.length) await tx.productSpec.createMany({ data: children.specs.map((c) => ({ ...c, productId })) });
        if (children.faqs.length) await tx.productFaq.createMany({ data: children.faqs.map((c) => ({ ...c, productId })) });
        if (children.compat.length) await tx.productCompatibility.createMany({ data: children.compat.map((c) => ({ ...c, productId })) });
        return { productId, previousSlug };
      },
      { timeout: 20_000 },
    );
    const { previousSlug } = saved;

    revalidateAdmin();
    revalidateStore(`/product/${d.slug}`, previousSlug && previousSlug !== d.slug ? `/product/${previousSlug}` : null, `/category/${category.slug}`, "/shop", "/");
    return done(id ? "Product saved" : "Product created", id ? {} : { redirectTo: `/admin/products/${saved.productId}` });
  } catch (err) {
    return dbError(err);
  }
}

export async function duplicateProduct(id: string): Promise<ActionState> {
  await assertAdmin();
  const pid = idSchema.parse(id);
  const p = await prisma.product.findUnique({
    where: { id: pid },
    include: { images: true, specs: true, faqs: true, compatibilities: true, boughtTogether: { select: { id: true } } },
  });
  if (!p) return failed("Product not found");

  const suffix = Math.random().toString(36).slice(2, 6);
  try {
    const copy = await prisma.product.create({
      data: {
        name: `${p.name} (Copy)`,
        slug: `${p.slug}-copy-${suffix}`.slice(0, 80),
        sku: `${p.sku}-COPY-${suffix.toUpperCase()}`.slice(0, 60),
        shortDescription: p.shortDescription,
        description: p.description,
        price: p.price,
        mrp: p.mrp,
        discountPercent: p.discountPercent,
        gstRate: p.gstRate,
        hsnCode: p.hsnCode,
        stock: 0,
        lowStockAlert: p.lowStockAlert,
        weightGrams: p.weightGrams,
        lengthCm: p.lengthCm,
        breadthCm: p.breadthCm,
        heightCm: p.heightCm,
        videoUrl: p.videoUrl,
        features: p.features,
        tags: p.tags,
        categoryId: p.categoryId,
        brandId: p.brandId,
        isUniversal: p.isUniversal,
        isActive: false,
        isPremium: p.isPremium,
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        images: { create: p.images.map(({ url, alt, sortOrder }) => ({ url, alt, sortOrder })) },
        specs: { create: p.specs.map(({ label, value, sortOrder }) => ({ label, value, sortOrder })) },
        faqs: { create: p.faqs.map(({ question, answer, sortOrder }) => ({ question, answer, sortOrder })) },
        compatibilities: {
          create: p.compatibilities.map(({ vehicleModelId, yearFrom, yearTo, fuelType }) => ({ vehicleModelId, yearFrom, yearTo, fuelType })),
        },
        boughtTogether: { connect: p.boughtTogether },
      },
      select: { id: true },
    });
    revalidateAdmin();
    return done("Duplicated as a hidden draft with 0 stock", { redirectTo: `/admin/products/${copy.id}` });
  } catch (err) {
    return dbError(err);
  }
}

/** Hard-deletes products that were never ordered; otherwise hides them to keep order history intact. */
export async function deleteProduct(id: string): Promise<ActionState> {
  await assertAdmin();
  const pid = idSchema.parse(id);
  const p = await prisma.product.findUnique({ where: { id: pid }, select: { slug: true, _count: { select: { orderItems: true } } } });
  if (!p) return failed("Product not found");
  try {
    if (p._count.orderItems > 0) {
      await prisma.product.update({ where: { id: pid }, data: { isActive: false } });
      revalidateAdmin();
      revalidateStore(`/product/${p.slug}`, "/shop", "/");
      return done("Product has orders, so it was hidden instead of deleted", { redirectTo: "/admin/products" });
    }
    await prisma.product.delete({ where: { id: pid } });
    revalidateAdmin();
    revalidateStore(`/product/${p.slug}`, "/shop", "/");
    return done("Product deleted", { redirectTo: "/admin/products" });
  } catch (err) {
    return dbError(err);
  }
}

export async function setProductActive(id: string, active: boolean): Promise<ActionState> {
  await assertAdmin();
  const pid = idSchema.parse(id);
  try {
    const p = await prisma.product.update({ where: { id: pid }, data: { isActive: z.boolean().parse(active) }, select: { slug: true } });
    revalidateAdmin();
    revalidateStore(`/product/${p.slug}`, "/shop", "/");
    return done(active ? "Product is live" : "Product hidden");
  } catch (err) {
    return dbError(err);
  }
}
