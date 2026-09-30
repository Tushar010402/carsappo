import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage } from "@/lib/pages";
import { pageMetadata } from "@/lib/seo";
import { Markdown } from "@/components/ui/markdown";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

/** Custom pages created in Admin → Pages (e.g. warranty, bulk orders, careers). */
export async function generateMetadata({ params }: PageProps<"/pages/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage("PAGE", slug);
  if (!page) notFound();
  return pageMetadata({
    title: page.metaTitle || page.title,
    description: page.metaDescription || page.body.replace(/[#*_>`|[\]()-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 155),
    path: `/pages/${slug}`,
  });
}

export default async function CustomPage({ params }: PageProps<"/pages/[slug]">) {
  const { slug } = await params;
  const page = await getPage("PAGE", slug);
  if (!page) notFound();
  return (
    <div className="container-x max-w-3xl py-10 sm:py-14">
      <Breadcrumbs items={[{ name: page.title, path: `/pages/${slug}` }]} />
      <h1 className="mt-8 text-4xl font-semibold sm:text-5xl">{page.title}</h1>
      <Markdown>{page.body}</Markdown>
    </div>
  );
}
