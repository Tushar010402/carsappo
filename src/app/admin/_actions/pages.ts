"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BUILT_IN_POLICY_SLUGS, POLICY_DEFAULTS } from "@/lib/policies";
import { checkbox, formObject, idSchema, intField, optionalText, requiredText, slugField } from "@/lib/admin/form";
import { dbError, done, failed, invalid, revalidateAdmin } from "@/lib/admin/server";
import type { ActionState } from "@/lib/admin/types";

const optionalId = z.preprocess((v) => (v === "" ? undefined : v), idSchema.optional());

const pageSchema = z.object({
  id: optionalId,
  kind: z.enum(["POLICY", "PAGE"], { error: "Choose a page type" }),
  title: requiredText("Title", 120),
  slug: slugField,
  body: requiredText("Content", 100_000),
  metaTitle: optionalText(120),
  metaDescription: optionalText(320),
  isPublished: checkbox,
  showInFooter: checkbox,
  sortOrder: intField("Sort order", -1000, 10_000),
});

function refresh(...slugs: { kind: string; slug: string }[]) {
  revalidateAdmin();
  for (const p of slugs) revalidatePath(p.kind === "POLICY" ? `/policies/${p.slug}` : `/pages/${p.slug}`);
  // Footer links and the policy menu appear on every page.
  revalidatePath("/", "layout");
}

export async function savePage(_: ActionState, formData: FormData): Promise<ActionState> {
  await assertAdmin();
  const parsed = pageSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { id, ...data } = parsed.data;
  const previous = id ? await prisma.page.findUnique({ where: { id }, select: { slug: true, kind: true } }) : null;
  if (id && !previous) return failed("Page not found");
  // Built-in policies keep their address and type (checkout, invoices and emails link to them).
  if (previous && BUILT_IN_POLICY_SLUGS.includes(previous.slug) && (data.slug !== previous.slug || data.kind !== "POLICY")) {
    return failed("Built-in policies keep their web address and type", { slug: "This address can't be changed" });
  }
  if (!previous && BUILT_IN_POLICY_SLUGS.includes(data.slug)) {
    return failed("That address belongs to a built-in policy — edit it from the Pages list", { slug: "Already used by a built-in policy" });
  }
  try {
    const page = id ? await prisma.page.update({ where: { id }, data }) : await prisma.page.create({ data });
    refresh(page, ...(previous ? [previous] : []));
    return done(id ? "Page saved" : "Page created", id ? {} : { redirectTo: `/admin/pages/${page.id}` });
  } catch (err) {
    return dbError(err);
  }
}

/** Copies a built-in policy's default text into an editable page. */
export async function customizePolicy(slug: string): Promise<ActionState> {
  await assertAdmin();
  const defaults = POLICY_DEFAULTS[slug];
  if (!defaults) return failed("Unknown policy");
  try {
    const page =
      (await prisma.page.findUnique({ where: { slug } })) ??
      (await prisma.page.create({ data: { slug, kind: "POLICY", title: defaults.title, body: defaults.body, sortOrder: BUILT_IN_POLICY_SLUGS.indexOf(slug) } }));
    refresh(page);
    return done("Policy ready to edit", { redirectTo: `/admin/pages/${page.id}` });
  } catch (err) {
    return dbError(err);
  }
}

/** Deletes a custom page, or resets a built-in policy to its default text. */
export async function deletePage(id: string): Promise<ActionState> {
  await assertAdmin();
  try {
    const page = await prisma.page.delete({ where: { id: idSchema.parse(id) } });
    refresh(page);
    const builtIn = BUILT_IN_POLICY_SLUGS.includes(page.slug);
    return done(builtIn ? "Policy reset to the default text" : "Page deleted", { redirectTo: "/admin/pages" });
  } catch (err) {
    return dbError(err);
  }
}
