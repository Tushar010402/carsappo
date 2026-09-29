import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSettings } from "@/lib/settings";
import { policyContent } from "@/lib/policies";
import { POLICY_PAGES } from "@/lib/constants";
import { pageMetadata } from "@/lib/seo";
import { Markdown } from "@/components/ui/markdown";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return POLICY_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/policies/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = POLICY_PAGES.find((p) => p.slug === slug);
  // Resolving 404s here (before the page streams) returns a real 404 status instead of a soft 404.
  if (!page) notFound();
  return pageMetadata({ title: page.title, description: `${page.title} for Carsappo — car accessories and car care in India.`, path: `/policies/${slug}` });
}

export default async function PolicyPage({ params }: PageProps<"/policies/[slug]">) {
  const { slug } = await params;
  const settings = await getSettings();
  const content = policyContent(slug, settings);
  if (!content) notFound();
  return (
    <div className="container-x py-10 sm:py-14">
      <Breadcrumbs items={[{ name: content.title, path: `/policies/${slug}` }]} />
      <div className="mt-8 grid gap-12 lg:grid-cols-[220px_1fr]">
        <nav className="space-y-1 lg:sticky lg:top-24 lg:self-start" aria-label="Policies">
          {POLICY_PAGES.map((p) => (
            <Link key={p.slug} href={`/policies/${p.slug}`} className={cn("block rounded-xl px-4 py-2.5 text-sm", p.slug === slug ? "bg-ink text-white" : "hover:bg-mist")}>
              {p.title}
            </Link>
          ))}
        </nav>
        <div className="max-w-3xl">
          <h1 className="text-4xl font-semibold">{content.title}</h1>
          <Markdown>{content.body}</Markdown>
        </div>
      </div>
    </div>
  );
}
