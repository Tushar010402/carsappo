import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { getPolicyLinks } from "@/lib/pages";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/shop"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/services"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/services/book"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/blog"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/contact"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/faq"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/track-order"), changeFrequency: "yearly", priority: 0.3 },
    ...(await getPolicyLinks()).map((p) => ({ url: absoluteUrl(p.href), changeFrequency: "yearly" as const, priority: 0.2 })),
  ];

  try {
    const [products, categories, posts, blogCategories, pages] = await Promise.all([
      prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true, images: { select: { url: true }, take: 1, orderBy: { sortOrder: "asc" } } } }),
      prisma.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
      prisma.post.findMany({ where: { isPublished: true, publishedAt: { lte: now } }, select: { slug: true, updatedAt: true } }),
      prisma.blogCategory.findMany({ select: { slug: true } }),
      prisma.page.findMany({ where: { kind: "PAGE", isPublished: true }, select: { slug: true, updatedAt: true } }),
    ]);
    return [
      ...staticPages,
      ...categories.map((c) => ({ url: absoluteUrl(`/category/${c.slug}`), lastModified: c.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
      ...products.map((p) => ({
        url: absoluteUrl(`/product/${p.slug}`),
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
        images: p.images.map((i) => (i.url.startsWith("http") ? i.url : absoluteUrl(i.url))),
      })),
      ...blogCategories.map((c) => ({ url: absoluteUrl(`/blog/category/${c.slug}`), changeFrequency: "weekly" as const, priority: 0.4 })),
      ...posts.map((p) => ({ url: absoluteUrl(`/blog/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
      ...pages.map((p) => ({ url: absoluteUrl(`/pages/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.4 })),
    ];
  } catch {
    return staticPages;
  }
}
