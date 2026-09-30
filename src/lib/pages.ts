import "server-only";
import type { PageKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSettings, renderText } from "@/lib/settings";
import { BUILT_IN_POLICY_SLUGS, POLICY_DEFAULTS } from "@/lib/policies";

export type PageLink = { slug: string; title: string; href: string };
export type ResolvedPage = { slug: string; title: string; body: string; metaTitle: string | null; metaDescription: string | null; updatedAt: Date | null };

export const pageHref = (kind: PageKind, slug: string) => (kind === "POLICY" ? `/policies/${slug}` : `/pages/${slug}`);
export const isBuiltInPolicy = (slug: string) => BUILT_IN_POLICY_SLUGS.includes(slug);

async function rows(kind: PageKind) {
  // A build without database access still renders (built-in policies only).
  return prisma.page
    .findMany({ where: { kind }, orderBy: [{ sortOrder: "asc" }, { title: "asc" }], select: { slug: true, title: true, isPublished: true, showInFooter: true } })
    .catch(() => []);
}

/** Published policies: built-ins in their standard order (unless unpublished), then custom ones. */
export async function getPolicyLinks({ footerOnly = false } = {}): Promise<PageLink[]> {
  const list = await rows("POLICY");
  const bySlug = new Map(list.map((r) => [r.slug, r]));
  const builtIns = BUILT_IN_POLICY_SLUGS.flatMap((slug) => {
    const row = bySlug.get(slug);
    if (row && (!row.isPublished || (footerOnly && !row.showInFooter))) return [];
    return [{ slug, title: row?.title ?? POLICY_DEFAULTS[slug].title, href: pageHref("POLICY", slug) }];
  });
  const custom = list
    .filter((r) => !isBuiltInPolicy(r.slug) && r.isPublished && (!footerOnly || r.showInFooter))
    .map((r) => ({ slug: r.slug, title: r.title, href: pageHref("POLICY", r.slug) }));
  return [...builtIns, ...custom];
}

/** Published custom pages marked "show in footer". */
export async function getFooterPages(): Promise<PageLink[]> {
  return (await rows("PAGE")).filter((r) => r.isPublished && r.showInFooter).map((r) => ({ slug: r.slug, title: r.title, href: pageHref("PAGE", r.slug) }));
}

/** A published page with {tokens} filled in, or null (→ 404). Built-in policies fall back to their default text. */
export async function getPage(kind: PageKind, slug: string): Promise<ResolvedPage | null> {
  const [row, settings] = await Promise.all([prisma.page.findUnique({ where: { slug } }).catch(() => null), getSettings()]);
  if (row) {
    if (row.kind !== kind || !row.isPublished) return null;
    return {
      slug,
      title: row.title,
      body: renderText(settings, row.body),
      metaTitle: row.metaTitle,
      metaDescription: row.metaDescription,
      updatedAt: row.updatedAt,
    };
  }
  if (kind === "POLICY" && isBuiltInPolicy(slug)) {
    const d = POLICY_DEFAULTS[slug];
    return { slug, title: d.title, body: renderText(settings, d.body), metaTitle: null, metaDescription: null, updatedAt: null };
  }
  return null;
}
