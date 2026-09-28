"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CATEGORY_ICON_NAMES } from "@/lib/admin/icons";
import { checkbox, formObject, idSchema, intField, mediaUrl, optionalText, requiredText, slugField } from "@/lib/admin/form";
import { dbError, done, failed, invalid, revalidateAdmin, revalidateStore } from "@/lib/admin/server";
import type { ActionState } from "@/lib/admin/types";

const optionalId = z.preprocess((v) => (v === "" || v === undefined ? null : v), idSchema.nullable());

const categorySchema = z.object({
  id: z.preprocess((v) => (v === "" ? undefined : v), idSchema.optional()),
  name: requiredText("Name", 80),
  slug: slugField,
  description: optionalText(500),
  image: mediaUrl(),
  icon: z.preprocess((v) => (v === "" ? null : v), z.enum(CATEGORY_ICON_NAMES).nullable()),
  parentId: optionalId,
  sortOrder: intField("Sort order", -1000, 10_000),
  isActive: checkbox,
  metaTitle: optionalText(120),
  metaDescription: optionalText(320),
});

export async function saveCategory(_: ActionState, formData: FormData): Promise<ActionState> {
  await assertAdmin();
  const parsed = categorySchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { id, ...data } = parsed.data;
  if (id && data.parentId === id) return failed("A category can't be its own parent", { parentId: "Choose a different parent" });

  try {
    const previous = id ? await prisma.category.findUnique({ where: { id }, select: { slug: true } }) : null;
    const saved = id ? await prisma.category.update({ where: { id }, data }) : await prisma.category.create({ data });
    revalidateAdmin();
    revalidateStore(`/category/${saved.slug}`, previous && previous.slug !== saved.slug ? `/category/${previous.slug}` : null, "/shop", "/");
    return done(id ? "Category saved" : "Category created", id ? {} : { redirectTo: `/admin/categories/${saved.id}` });
  } catch (err) {
    return dbError(err);
  }
}

export async function deleteCategory(id: string): Promise<ActionState> {
  await assertAdmin();
  const cid = idSchema.parse(id);
  const cat = await prisma.category.findUnique({ where: { id: cid }, select: { slug: true, _count: { select: { products: true } } } });
  if (!cat) return failed("Category not found");
  if (cat._count.products > 0) {
    return failed(`Move or delete its ${cat._count.products} product(s) first, or hide the category instead.`);
  }
  try {
    await prisma.category.delete({ where: { id: cid } });
    revalidateAdmin();
    revalidateStore(`/category/${cat.slug}`, "/shop", "/");
    return done("Category deleted", { redirectTo: "/admin/categories" });
  } catch (err) {
    return dbError(err);
  }
}

const brandSchema = z.object({
  id: z.preprocess((v) => (v === "" ? undefined : v), idSchema.optional()),
  name: requiredText("Name", 80),
  slug: slugField,
  logo: mediaUrl(),
});

export async function saveBrand(_: ActionState, formData: FormData): Promise<ActionState> {
  await assertAdmin();
  const parsed = brandSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { id, ...data } = parsed.data;
  try {
    if (id) await prisma.brand.update({ where: { id }, data });
    else await prisma.brand.create({ data });
    revalidateAdmin();
    revalidateStore("/shop");
    return done(id ? "Brand saved" : "Brand created");
  } catch (err) {
    return dbError(err);
  }
}

export async function deleteBrand(id: string): Promise<ActionState> {
  await assertAdmin();
  const bid = idSchema.parse(id);
  try {
    // Products keep existing; their brand is cleared (onDelete: SetNull).
    await prisma.brand.delete({ where: { id: bid } });
    revalidateAdmin();
    revalidateStore("/shop");
    return done("Brand deleted");
  } catch (err) {
    return dbError(err);
  }
}
