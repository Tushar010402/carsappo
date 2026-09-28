"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formObject, idSchema } from "@/lib/admin/form";
import { dbError, done, failed, invalid, revalidateAdmin, revalidateStore } from "@/lib/admin/server";
import type { ActionState } from "@/lib/admin/types";

const adjustSchema = z.object({
  productId: idSchema,
  mode: z.enum(["set", "add", "remove"]),
  quantity: z.coerce.number({ error: "Enter a quantity" }).int("Whole numbers only").min(0, "Can't be negative").max(1_000_000),
});

/** Inline stock adjustment: set an absolute value, or add / remove units. */
export async function adjustStock(_: ActionState, formData: FormData): Promise<ActionState> {
  await assertAdmin();
  const parsed = adjustSchema.safeParse({ mode: "set", ...formObject(formData) });
  if (!parsed.success) return invalid(parsed.error);
  const { productId, mode, quantity } = parsed.data;
  try {
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { stock: true, slug: true, name: true } });
    if (!product) return failed("Product not found");
    let next = quantity;
    if (mode === "add") next = product.stock + quantity;
    if (mode === "remove") next = Math.max(0, product.stock - quantity);
    // Conditional update guards against a concurrent order changing stock between read and write.
    const res = await prisma.product.updateMany({ where: { id: productId, stock: product.stock }, data: { stock: next } });
    if (res.count === 0) return failed("Stock changed in the meantime (a new order?). Refresh and try again.");
    revalidateAdmin();
    revalidateStore(`/product/${product.slug}`);
    return done(`${product.name}: stock ${product.stock} → ${next}`);
  } catch (err) {
    return dbError(err);
  }
}
