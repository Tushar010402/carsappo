import "server-only";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { fieldErrors } from "@/lib/validators";
import type { ActionState } from "@/lib/admin/types";

export function done(message: string, extra: Partial<ActionState> = {}): ActionState {
  return { ok: true, message, ...extra };
}

export function failed(message: string, errors?: Record<string, string>): ActionState {
  return { ok: false, message, errors };
}

export function invalid(error: z.ZodError): ActionState {
  const errors = fieldErrors(error);
  const first = Object.values(errors)[0];
  return { ok: false, errors, message: errors._form ?? (first ? `Please check the form: ${first}` : "Please check the form") };
}

/** Friendly messages for common Prisma errors (unique / foreign key / missing record). */
export function dbError(err: unknown, fallback = "Could not save. Please try again."): ActionState {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[] | string | undefined) ?? [];
      const fields = Array.isArray(target) ? target : [target];
      const field = fields.find((f) => f !== "makeId") ?? fields[0] ?? "value";
      return failed(`That ${field} is already in use.`, { [field]: "Already in use — choose another" });
    }
    if (err.code === "P2003") return failed("This record is still referenced by other data and cannot be removed.");
    if (err.code === "P2025") return failed("Record not found — it may have been deleted.");
  }
  console.error("[admin]", err);
  return failed(err instanceof Error && err.message && err.message.length < 200 ? err.message : fallback);
}

/** Refresh every admin page (sidebar badges, lists) after a mutation. */
export function revalidateAdmin() {
  revalidatePath("/admin", "layout");
}

/** Refresh storefront paths affected by a change (storefront pages are dynamic, but keep caches honest). */
export function revalidateStore(...paths: (string | null | undefined)[]) {
  for (const p of new Set(paths.filter((x): x is string => !!x))) revalidatePath(p);
}

/** Append a timestamped audit line to a free-text admin note. */
export function appendNote(existing: string | null | undefined, line: string) {
  const stamp = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date());
  const entry = `[${stamp}] ${line}`;
  return existing ? `${existing.trimEnd()}\n${entry}` : entry;
}
