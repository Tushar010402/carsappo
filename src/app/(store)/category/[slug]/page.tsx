import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { parseShopFilters } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";
import { ShopView } from "@/components/shop/shop-view";

const getCategory = cache((slug: string) =>
  prisma.category.findFirst({ where: { slug, isActive: true }, select: { name: true, slug: true, description: true, metaTitle: true, metaDescription: true, image: true } }),
);

export async function generateMetadata({ params, searchParams }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  // Resolving 404s here (before the page streams) returns a real 404 status instead of a soft 404.
  if (!category) notFound();
  const sp = await searchParams;
  return pageMetadata({
    title: category.metaTitle || `${category.name} — Buy Online in India`,
    description: category.metaDescription || category.description,
    path: `/category/${category.slug}`,
    image: category.image,
    noIndex: Object.keys(sp).length > 0,
  });
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();
  const filters = parseShopFilters(await searchParams, category.slug);
  return <ShopView filters={filters} basePath={`/category/${category.slug}`} category={category} />;
}
