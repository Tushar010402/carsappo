import { z } from "zod";
import { rupeesToPaise } from "@/lib/format";

/**
 * Zod building blocks for parsing admin FormData. Empty strings from untouched inputs
 * become `null` for optional fields so they are stored as NULL rather than "".
 */

const emptyToNull = (v: unknown) => (v === "" || v === undefined || v === null ? null : v);
const trimmed = (v: unknown) => emptyToNull(typeof v === "string" ? v.trim() : v);

export const idSchema = z.string().trim().min(1).max(40);

export function requiredText(label: string, max = 200) {
  return z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);
}

export function optionalText(max = 500) {
  return z.preprocess(trimmed, z.string().max(max, `Must be at most ${max} characters`).nullable());
}

/** Checkbox: present ("on") → true, absent → false. */
export const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === "1" || v === true, z.boolean());

export function intField(label: string, min = 0, max = 1_000_000_000) {
  return z.preprocess(
    (v) => (typeof v === "string" ? (v.trim() === "" ? undefined : v.trim()) : v),
    z.coerce
      .number({ error: `${label} is required` })
      .int(`${label} must be a whole number`)
      .min(min, `${label} must be at least ${min}`)
      .max(max, `${label} must be at most ${max}`),
  );
}

export function optionalInt(label: string, min = 0, max = 1_000_000_000) {
  return z.preprocess(
    trimmed,
    z.coerce
      .number()
      .int(`${label} must be a whole number`)
      .min(min, `${label} must be at least ${min}`)
      .max(max, `${label} must be at most ${max}`)
      .nullable(),
  );
}

/** Rupees in the UI → integer paise in the DB. */
export function rupeesField(label: string, min = 0, max = 10_000_000) {
  return z
    .preprocess(
      (v) => (typeof v === "string" ? (v.trim() === "" ? undefined : v.trim()) : v),
      z.coerce.number({ error: `${label} is required` }).min(min, `${label} must be at least ₹${min}`).max(max, `${label} is too large`),
    )
    .transform((v) => rupeesToPaise(v));
}

export function optionalRupees(label: string, max = 10_000_000) {
  return z
    .preprocess(
      trimmed,
      z.coerce.number().min(0, `${label} cannot be negative`).max(max, `${label} is too large`).nullable(),
    )
    .transform((v) => (v === null ? null : rupeesToPaise(v)));
}

export const slugField = z
  .string({ error: "Slug is required" })
  .trim()
  .toLowerCase()
  .min(1, "Slug is required")
  .max(80, "Slug must be at most 80 characters")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens");

/** Relative path (/uploads/...) or absolute http(s) URL; empty → null. */
export function mediaUrl(max = 1000) {
  return z.preprocess(
    trimmed,
    z
      .string()
      .max(max)
      .refine((s) => s.startsWith("/") || /^https?:\/\//i.test(s), "Enter a full URL (https://…) or an uploaded file path")
      .nullable(),
  );
}

/** Optional link: relative path, #anchor or http(s) URL. */
export function linkField(max = 500) {
  return z.preprocess(
    trimmed,
    z
      .string()
      .max(max)
      .refine((s) => s.startsWith("/") || s.startsWith("#") || /^https?:\/\//i.test(s) || /^(mailto|tel):/i.test(s), "Enter a path like /shop or a full URL")
      .nullable(),
  );
}

export const optionalDate = z.preprocess((v) => emptyToNull(v), z.coerce.date({ error: "Enter a valid date" }).nullable());

/** A hidden input carrying JSON produced by a client-side editor. */
export function jsonField<T extends z.ZodType>(schema: T) {
  return z
    .string()
    .default("[]")
    .transform((s, ctx) => {
      try {
        return JSON.parse(s || "null") as unknown;
      } catch {
        ctx.addIssue({ code: "custom", message: "Invalid data" });
        return z.NEVER;
      }
    })
    .pipe(schema);
}

export const stringList = (maxItems = 50, maxLen = 200) =>
  jsonField(z.array(z.string().trim().max(maxLen)).max(maxItems)).transform((list) => list.filter(Boolean));

/** FormData → plain object (last value wins); use `formData.getAll` for multi-value fields. */
export function formObject(formData: FormData) {
  const out: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("$ACTION")) continue;
    out[key] = value;
  }
  return out;
}

/** <input type="datetime-local"> value interpreted as India time (IST); empty → null. */
export const istDateTime = z.preprocess(
  (v) => {
    if (v === "" || v === undefined || v === null) return null;
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return new Date(`${v}:00+05:30`);
    return v;
  },
  z.date({ error: "Enter a valid date and time" }).nullable(),
);
