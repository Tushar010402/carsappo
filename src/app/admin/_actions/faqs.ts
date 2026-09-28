"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkbox, formObject, idSchema, intField, requiredText } from "@/lib/admin/form";
import { dbError, done, invalid, revalidateAdmin, revalidateStore } from "@/lib/admin/server";
import type { ActionState } from "@/lib/admin/types";

const STORE_PATHS = ["/faq", "/faqs", "/services", "/policies/shipping-policy", "/"];

const faqSchema = z.object({
  id: z.preprocess((v) => (v === "" ? undefined : v), idSchema.optional()),
  scope: z.enum(["GENERAL", "SERVICES", "SHIPPING"]),
  question: requiredText("Question", 300),
  answer: requiredText("Answer", 3000),
  sortOrder: intField("Sort order", -1000, 10_000),
  isActive: checkbox,
});

export async function saveFaq(_: ActionState, formData: FormData): Promise<ActionState> {
  await assertAdmin();
  const parsed = faqSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { id, ...data } = parsed.data;
  try {
    if (id) await prisma.faq.update({ where: { id }, data });
    else await prisma.faq.create({ data });
    revalidateAdmin();
    revalidateStore(...STORE_PATHS);
    return done(id ? "FAQ saved" : "FAQ added");
  } catch (err) {
    return dbError(err);
  }
}

export async function setFaqActive(id: string, active: boolean): Promise<ActionState> {
  await assertAdmin();
  try {
    await prisma.faq.update({ where: { id: idSchema.parse(id) }, data: { isActive: z.boolean().parse(active) } });
    revalidateAdmin();
    revalidateStore(...STORE_PATHS);
    return done(active ? "FAQ shown" : "FAQ hidden");
  } catch (err) {
    return dbError(err);
  }
}

export async function deleteFaq(id: string): Promise<ActionState> {
  await assertAdmin();
  try {
    await prisma.faq.delete({ where: { id: idSchema.parse(id) } });
    revalidateAdmin();
    revalidateStore(...STORE_PATHS);
    return done("FAQ deleted");
  } catch (err) {
    return dbError(err);
  }
}
