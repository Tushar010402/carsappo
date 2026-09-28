import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";
import { BlogIndex } from "@/components/blog/blog-index";

export async function generateMetadata({ params }: PageProps<"/blog/category/[slug]">): Promise<Metadata> {
  const category = await prisma.blogCategory.findUnique({ where: { slug: (await params).slug } });
  if (!category) return {};
  return pageMetadata({ title: `${category.name} — Carsappo Blog`, description: category.description, path: `/blog/category/${category.slug}` });
}

export default async function BlogCategoryPage({ params }: PageProps<"/blog/category/[slug]">) {
  const category = await prisma.blogCategory.findUnique({ where: { slug: (await params).slug } });
  if (!category) notFound();
  return <BlogIndex categorySlug={category.slug} title={category.name} description={category.description ?? ""} />;
}
