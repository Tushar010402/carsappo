"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkbox, formObject, idSchema, intField, linkField, mediaUrl, optionalText, requiredText } from "@/lib/admin/form";
import { dbError, done, invalid, revalidateAdmin, revalidateStore } from "@/lib/admin/server";
import type { ActionState } from "@/lib/admin/types";

const bannerSchema = z.object({
  id: z.preprocess((v) => (v === "" ? undefined : v), idSchema.optional()),
  placement: z.enum(["HOME_HERO", "HOME_PROMO", "SHOP_TOP"]),
  eyebrow: optionalText(80),
  title: requiredText("Title", 160),
  subtitle: optionalText(300),
  image: mediaUrl(),
  mobileImage: mediaUrl(),
  ctaLabel: optionalText(40),
  ctaHref: linkField(),
  secondaryCtaLabel: optionalText(40),
  secondaryCtaHref: linkField(),
  sortOrder: intField("Sort order", -1000, 10_000),
  isActive: checkbox,
});

export async function saveBanner(_: ActionState, formData: FormData): Promise<ActionState> {
  await assertAdmin();
  const parsed = bannerSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { id, ...data } = parsed.data;
  try {
    if (id) await prisma.banner.update({ where: { id }, data });
    else await prisma.banner.create({ data });
    revalidateAdmin();
    revalidateStore("/", "/shop");
    return done(id ? "Banner saved" : "Banner created");
  } catch (err) {
    return dbError(err);
  }
}

export async function setBannerActive(id: string, active: boolean): Promise<ActionState> {
  await assertAdmin();
  try {
    await prisma.banner.update({ where: { id: idSchema.parse(id) }, data: { isActive: z.boolean().parse(active) } });
    revalidateAdmin();
    revalidateStore("/", "/shop");
    return done(active ? "Banner activated" : "Banner deactivated");
  } catch (err) {
    return dbError(err);
  }
}

export async function deleteBanner(id: string): Promise<ActionState> {
  await assertAdmin();
  try {
    await prisma.banner.delete({ where: { id: idSchema.parse(id) } });
    revalidateAdmin();
    revalidateStore("/", "/shop");
    return done("Banner deleted");
  } catch (err) {
    return dbError(err);
  }
}
