"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkbox, formObject, idSchema, intField, istDateTime, mediaUrl, optionalInt, optionalText, requiredText, slugField, stringList } from "@/lib/admin/form";
import { dbError, done, failed, invalid, revalidateAdmin, revalidateStore } from "@/lib/admin/server";
import type { ActionState } from "@/lib/admin/types";

const optionalId = z.preprocess((v) => (v === "" ? undefined : v), idSchema.optional());

const postSchema = z.object({
  id: optionalId,
  title: requiredText("Title", 160),
  slug: slugField,
  excerpt: requiredText("Excerpt", 400),
  content: requiredText("Content", 100_000),
  coverImage: mediaUrl(),
  categoryId: z.string({ error: "Choose a category" }).trim().min(1, "Choose a category").max(40),
  author: requiredText("Author", 80),
  tags: stringList(20, 40),
  readingMinutes: optionalInt("Reading time", 1, 120),
  isPublished: checkbox,
  publishedAt: istDateTime,
  metaTitle: optionalText(120),
  metaDescription: optionalText(320),
});

export async function savePost(_: ActionState, formData: FormData): Promise<ActionState> {
  await assertAdmin();
  const parsed = postSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { id, readingMinutes, publishedAt, ...rest } = parsed.data;
  const category = await prisma.blogCategory.findUnique({ where: { id: rest.categoryId }, select: { slug: true } });
  if (!category) return failed("Choose a valid category", { categoryId: "Choose a category" });

  const words = rest.content.trim().split(/\s+/).length;
  const data = {
    ...rest,
    readingMinutes: readingMinutes ?? Math.max(1, Math.round(words / 200)),
    // Publishing without a date publishes now; drafts keep any scheduled date.
    publishedAt: rest.isPublished ? (publishedAt ?? new Date()) : publishedAt,
  };
  try {
    const previous = id ? await prisma.post.findUnique({ where: { id }, select: { slug: true } }) : null;
    const post = id ? await prisma.post.update({ where: { id }, data }) : await prisma.post.create({ data });
    revalidateAdmin();
    revalidateStore("/blog", `/blog/${post.slug}`, previous && previous.slug !== post.slug ? `/blog/${previous.slug}` : null, `/blog/category/${category.slug}`, "/");
    return done(id ? "Post saved" : "Post created", id ? {} : { redirectTo: `/admin/blog/${post.id}` });
  } catch (err) {
    return dbError(err);
  }
}

export async function setPostPublished(id: string, published: boolean): Promise<ActionState> {
  await assertAdmin();
  try {
    const current = await prisma.post.findUnique({ where: { id: idSchema.parse(id) }, select: { publishedAt: true } });
    if (!current) return failed("Post not found");
    const post = await prisma.post.update({
      where: { id },
      data: { isPublished: z.boolean().parse(published), ...(published && !current.publishedAt ? { publishedAt: new Date() } : {}) },
    });
    revalidateAdmin();
    revalidateStore("/blog", `/blog/${post.slug}`, "/");
    return done(published ? "Post published" : "Post moved to drafts");
  } catch (err) {
    return dbError(err);
  }
}

export async function deletePost(id: string): Promise<ActionState> {
  await assertAdmin();
  try {
    const post = await prisma.post.delete({ where: { id: idSchema.parse(id) } });
    revalidateAdmin();
    revalidateStore("/blog", `/blog/${post.slug}`, "/");
    return done("Post deleted", { redirectTo: "/admin/blog" });
  } catch (err) {
    return dbError(err);
  }
}

const categorySchema = z.object({
  id: optionalId,
  name: requiredText("Name", 80),
  slug: slugField,
  description: optionalText(300),
  sortOrder: intField("Sort order", -1000, 10_000),
});

export async function saveBlogCategory(_: ActionState, formData: FormData): Promise<ActionState> {
  await assertAdmin();
  const parsed = categorySchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { id, ...data } = parsed.data;
  try {
    if (id) await prisma.blogCategory.update({ where: { id }, data });
    else await prisma.blogCategory.create({ data });
    revalidateAdmin();
    revalidateStore("/blog");
    return done(id ? "Category saved" : "Category created");
  } catch (err) {
    return dbError(err);
  }
}

export async function deleteBlogCategory(id: string): Promise<ActionState> {
  await assertAdmin();
  const cid = idSchema.parse(id);
  const count = await prisma.post.count({ where: { categoryId: cid } });
  if (count > 0) return failed(`Move its ${count} post(s) to another category first`);
  try {
    await prisma.blogCategory.delete({ where: { id: cid } });
    revalidateAdmin();
    revalidateStore("/blog");
    return done("Category deleted");
  } catch (err) {
    return dbError(err);
  }
}
