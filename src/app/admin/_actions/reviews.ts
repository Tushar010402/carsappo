"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { refreshProductRating } from "@/lib/reviews";
import { youtubeId } from "@/lib/utils";
import { checkbox, formObject, idSchema, intField, mediaUrl, optionalText, requiredText } from "@/lib/admin/form";
import { dbError, done, failed, invalid, revalidateAdmin, revalidateStore } from "@/lib/admin/server";
import type { ActionState } from "@/lib/admin/types";

async function afterReviewChange(productId: string) {
  await refreshProductRating(productId);
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { slug: true } });
  revalidateAdmin();
  revalidateStore(product ? `/product/${product.slug}` : null, "/shop", "/");
}

export async function setReviewApproved(id: string, approved: boolean): Promise<ActionState> {
  await assertAdmin();
  try {
    const review = await prisma.review.update({ where: { id: idSchema.parse(id) }, data: { isApproved: z.boolean().parse(approved) } });
    await afterReviewChange(review.productId);
    return done(approved ? "Review approved and published" : "Review hidden");
  } catch (err) {
    return dbError(err);
  }
}

export async function approveReviews(ids: string[]): Promise<ActionState> {
  await assertAdmin();
  const list = z.array(idSchema).max(200).parse(ids);
  if (!list.length) return failed("Nothing to approve");
  const reviews = await prisma.review.findMany({ where: { id: { in: list } }, select: { productId: true } });
  await prisma.review.updateMany({ where: { id: { in: list } }, data: { isApproved: true } });
  for (const productId of new Set(reviews.map((r) => r.productId))) await afterReviewChange(productId);
  return done(`${list.length} review${list.length === 1 ? "" : "s"} approved`);
}

export async function deleteReview(id: string): Promise<ActionState> {
  await assertAdmin();
  try {
    const review = await prisma.review.delete({ where: { id: idSchema.parse(id) } });
    await afterReviewChange(review.productId);
    return done("Review deleted");
  } catch (err) {
    return dbError(err);
  }
}

// ───────────────────────── Testimonials (homepage "Customer Reviews") ─────────────────────────

const testimonialSchema = z
  .object({
    id: z.preprocess((v) => (v === "" ? undefined : v), idSchema.optional()),
    type: z.enum(["IMAGE", "VIDEO", "GOOGLE"]),
    name: requiredText("Name", 80),
    location: optionalText(80),
    rating: intField("Rating", 1, 5),
    content: requiredText("Review text", 1500),
    mediaUrl: mediaUrl(),
    sortOrder: intField("Sort order", -1000, 10_000),
    isActive: checkbox,
  })
  .superRefine((d, ctx) => {
    if (d.type === "VIDEO") {
      const ok = !!d.mediaUrl && (!!youtubeId(d.mediaUrl) || /\.(mp4|webm)(\?|$)/i.test(d.mediaUrl) || /instagram\.com\//i.test(d.mediaUrl));
      if (!ok) ctx.addIssue({ code: "custom", path: ["mediaUrl"], message: "Add a YouTube link or upload an MP4 video" });
    }
    if (d.type === "IMAGE" && !d.mediaUrl) ctx.addIssue({ code: "custom", path: ["mediaUrl"], message: "Upload the customer photo" });
  });

export async function saveTestimonial(_: ActionState, formData: FormData): Promise<ActionState> {
  await assertAdmin();
  const parsed = testimonialSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { id, ...data } = parsed.data;
  try {
    if (id) await prisma.testimonial.update({ where: { id }, data });
    else await prisma.testimonial.create({ data });
    revalidateAdmin();
    revalidateStore("/");
    return done(id ? "Testimonial saved" : "Testimonial added");
  } catch (err) {
    return dbError(err);
  }
}

export async function setTestimonialActive(id: string, active: boolean): Promise<ActionState> {
  await assertAdmin();
  try {
    await prisma.testimonial.update({ where: { id: idSchema.parse(id) }, data: { isActive: z.boolean().parse(active) } });
    revalidateAdmin();
    revalidateStore("/");
    return done(active ? "Shown on homepage" : "Hidden from homepage");
  } catch (err) {
    return dbError(err);
  }
}

export async function deleteTestimonial(id: string): Promise<ActionState> {
  await assertAdmin();
  try {
    await prisma.testimonial.delete({ where: { id: idSchema.parse(id) } });
    revalidateAdmin();
    revalidateStore("/");
    return done("Testimonial deleted");
  } catch (err) {
    return dbError(err);
  }
}
