"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formObject, idSchema } from "@/lib/admin/form";
import { dbError, done, failed, invalid, revalidateAdmin, revalidateStore } from "@/lib/admin/server";
import type { ActionState } from "@/lib/admin/types";
import { discountPercent } from "@/lib/format";
import { parseInventoryCsv, planInventoryImport } from "@/lib/admin/inventory-import";

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

// Server actions accept 1 MB request bodies (next.config default), including multipart overhead.
const MAX_FILE_BYTES = 950_000;
const LIST_LIMIT = 50;

function list(title: string, lines: string[], tone: "info" | "warning" | "danger") {
  if (lines.length === 0) return [];
  const shown = lines.slice(0, LIST_LIMIT);
  if (lines.length > LIST_LIMIT) shown.push(`…and ${lines.length - LIST_LIMIT} more`);
  return [{ title: `${title} (${lines.length})`, lines: shown, tone }];
}

/**
 * Bulk price / MRP / stock / GST update from a CSV keyed by SKU. "Check file" previews the changes;
 * "Apply" writes them. Nothing is written when any row is invalid.
 */
export async function importInventory(_: ActionState, formData: FormData): Promise<ActionState> {
  await assertAdmin();
  const apply = formData.get("intent") === "apply";
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return failed("Choose a CSV file", { file: "Choose a CSV file" });
  if (file.size > MAX_FILE_BYTES) return failed("The file must be under 1 MB — split it into smaller files", { file: "File too large" });

  const parsed = parseInventoryCsv(await file.text());
  if (parsed.columns.length === 0 || parsed.rows.length + parsed.errors.length === 0) {
    return failed(parsed.errors[0] ?? "No rows found in the file", { file: parsed.errors[0] ?? "No rows found" });
  }

  try {
    const products = await prisma.product.findMany({
      where: { sku: { in: parsed.rows.map((r) => r.sku), mode: "insensitive" } },
      select: { id: true, sku: true, slug: true, name: true, price: true, mrp: true, stock: true, lowStockAlert: true, gstRate: true },
    });
    const plan = planInventoryImport(parsed.rows, products);
    const errors = [...parsed.errors, ...plan.errors];
    const details = [
      ...list("Problems — fix these and upload again", errors, "danger"),
      ...list(apply && errors.length === 0 ? "Updated" : "Will change", plan.changes.map((c) => c.summary), "info"),
      ...list("SKUs not found (skipped)", plan.unknown, "warning"),
    ];
    const counts = `${plan.changes.length} to update, ${plan.unchanged} unchanged${plan.unknown.length ? `, ${plan.unknown.length} unknown SKU${plan.unknown.length === 1 ? "" : "s"}` : ""}`;

    if (errors.length) return { ok: false, message: `${errors.length} row${errors.length === 1 ? " has a problem" : "s have problems"} — nothing was saved`, details };
    if (!apply) return { ok: true, message: `File checked: ${counts}`, details };
    if (plan.changes.length === 0) return { ok: true, message: `Nothing to update (${counts})`, details };

    // Stock updates are conditional on the stock we read, so an order placed meanwhile isn't overwritten.
    const results = await prisma.$transaction(
      plan.changes.map(({ product, data }) =>
        prisma.product.updateMany({
          where: { id: product.id, ...(data.stock !== undefined ? { stock: product.stock } : {}) },
          data: {
            ...data,
            ...(data.price !== undefined || data.mrp !== undefined
              ? { discountPercent: discountPercent(data.price ?? product.price, data.mrp === undefined ? product.mrp : data.mrp) }
              : {}),
          },
        }),
      ),
    );
    const skipped = plan.changes.filter((_, i) => results[i].count === 0).map((c) => `${c.product.sku}: stock changed while importing — adjust it again`);
    const updated = plan.changes.length - skipped.length;

    revalidateAdmin();
    revalidateStore("/", "/shop", ...plan.changes.map((c) => `/product/${c.product.slug}`));
    return {
      ok: true,
      message: `Updated ${updated} product${updated === 1 ? "" : "s"}${skipped.length ? ` (${skipped.length} skipped)` : ""}`,
      details: [...details, ...list("Skipped", skipped, "warning")],
    };
  } catch (err) {
    return dbError(err);
  }
}
