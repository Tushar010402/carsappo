"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rupeesToPaise } from "@/lib/format";
import { checkbox, formObject, idSchema, istDateTime, optionalInt, optionalRupees, optionalText, rupeesField } from "@/lib/admin/form";
import { dbError, done, failed, invalid, revalidateAdmin, revalidateStore } from "@/lib/admin/server";
import type { ActionState } from "@/lib/admin/types";

const couponSchema = z
  .object({
    id: z.preprocess((v) => (v === "" ? undefined : v), idSchema.optional()),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, "Use at least 3 characters")
      .max(30)
      .regex(/^[A-Z0-9_-]+$/, "Letters, numbers, - and _ only"),
    description: optionalText(200),
    type: z.enum(["PERCENT", "FLAT"]),
    value: z.coerce.number({ error: "Enter a value" }).positive("Must be more than 0"),
    minOrder: rupeesField("Minimum order", 0),
    maxDiscount: optionalRupees("Max discount"),
    usageLimit: optionalInt("Usage limit", 1, 10_000_000),
    perUserLimit: optionalInt("Per-customer limit", 1, 1000),
    startsAt: istDateTime,
    expiresAt: istDateTime,
    isActive: checkbox,
    isPublic: checkbox,
  })
  .superRefine((d, ctx) => {
    if (d.type === "PERCENT" && (d.value > 100 || !Number.isInteger(d.value))) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "Percent must be a whole number from 1 to 100" });
    }
    if (d.startsAt && d.expiresAt && d.expiresAt <= d.startsAt) {
      ctx.addIssue({ code: "custom", path: ["expiresAt"], message: "Expiry must be after the start" });
    }
  });

export async function saveCoupon(_: ActionState, formData: FormData): Promise<ActionState> {
  await assertAdmin();
  const parsed = couponSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { id, type, value, ...rest } = parsed.data;
  const data = {
    ...rest,
    type,
    value: type === "PERCENT" ? value : rupeesToPaise(value),
    maxDiscount: type === "PERCENT" ? rest.maxDiscount : null,
  };
  try {
    if (id) await prisma.coupon.update({ where: { id }, data });
    else await prisma.coupon.create({ data });
    revalidateAdmin();
    revalidateStore("/cart", "/checkout");
    return done(id ? `Coupon ${data.code} saved` : `Coupon ${data.code} created`);
  } catch (err) {
    return dbError(err);
  }
}

export async function setCouponActive(id: string, active: boolean): Promise<ActionState> {
  await assertAdmin();
  try {
    const c = await prisma.coupon.update({ where: { id: idSchema.parse(id) }, data: { isActive: z.boolean().parse(active) } });
    revalidateAdmin();
    return done(`${c.code} ${active ? "activated" : "deactivated"}`);
  } catch (err) {
    return dbError(err);
  }
}

export async function deleteCoupon(id: string): Promise<ActionState> {
  await assertAdmin();
  const cid = idSchema.parse(id);
  const coupon = await prisma.coupon.findUnique({ where: { id: cid }, select: { code: true, usedCount: true } });
  if (!coupon) return failed("Coupon not found");
  if (coupon.usedCount > 0) return failed(`${coupon.code} has been used ${coupon.usedCount} time(s). Deactivate it instead to keep usage history.`);
  try {
    await prisma.coupon.delete({ where: { id: cid } });
    revalidateAdmin();
    return done(`Coupon ${coupon.code} deleted`);
  } catch (err) {
    return dbError(err);
  }
}
