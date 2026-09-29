import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { articleJsonLd, pageMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/format";
import { getProductsForSection } from "@/lib/catalog";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { JsonLd } from "@/components/ui/json-ld";
import { Markdown } from "@/components/ui/markdown";
import { SmartImage } from "@/components/ui/smart-image";
import { PostCard } from "@/components/blog/post-card";
import { ProductCard } from "@/components/product/product-card";
import { ShareButtons } from "@/components/blog/share-buttons";

const getPost = cache((slug: string) =>
  prisma.post.findFirst({ where: { slug, isPublished: true, publishedAt: { lte: new Date() } }, include: { category: true } }),
);

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = await getPost((await params).slug);
  // Resolving 404s here (before the page streams) returns a real 404 status instead of a soft 404.
  if (!post) notFound();
  return pageMetadata({
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    path: `/blog/${post.slug}`,
    image: post.coverImage,
    type: "article",
  });
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const post = await getPost((await params).slug);
  if (!post) notFound();

  const [related, products] = await Promise.all([
    prisma.post.findMany({
      where: { isPublished: true, publishedAt: { lte: new Date() }, id: { not: post.id } },
      orderBy: [{ publishedAt: "desc" }],
      take: 3,
      select: { slug: true, title: true, excerpt: true, coverImage: true, readingMinutes: true, publishedAt: true, category: { select: { name: true, slug: true } } },
    }),
    post.tags.length
      ? getProductsForSection({ tags: { hasSome: post.tags.map((t) => t.toLowerCase()) } }, [{ salesCount: "desc" }], 4)
      : getProductsForSection({ isBestSeller: true }, [{ salesCount: "desc" }], 4),
  ]);

  return (
    <article>
      <JsonLd data={articleJsonLd(post)} />
      <header className="container-x max-w-3xl pt-10 sm:pt-14">
        <Breadcrumbs items={[{ name: "Blog", path: "/blog" }, { name: post.category.name, path: `/blog/category/${post.category.slug}` }, { name: post.title, path: `/blog/${post.slug}` }]} />
        <p className="mt-8 text-sm text-muted">
          <Link href={`/blog/category/${post.category.slug}`} className="font-semibold text-ink">
            {post.category.name}
          </Link>{" "}
          · {post.readingMinutes} min read {post.publishedAt && `· ${formatDate(post.publishedAt)}`}
        </p>
        <h1 className="mt-3 text-4xl leading-tight font-semibold sm:text-5xl">{post.title}</h1>
        <p className="mt-4 text-lg text-muted">{post.excerpt}</p>
        <p className="mt-4 text-sm">By {post.author}</p>
      </header>
      {post.coverImage && (
        <div className="container-x mt-10 max-w-5xl">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[28px] bg-ink">
            <SmartImage src={post.coverImage} alt="" fill priority sizes="(min-width: 1024px) 1024px, 100vw" className="object-cover" />
          </div>
        </div>
      )}
      <div className="container-x mt-12 max-w-3xl">
        <Markdown className="prose-cs text-base leading-8">{post.content}</Markdown>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <div className="flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <Link key={t} href={`/shop?q=${encodeURIComponent(t)}`} className="rounded-full bg-mist px-3 py-1 text-xs font-medium">
                #{t}
              </Link>
            ))}
          </div>
          <ShareButtons title={post.title} path={`/blog/${post.slug}`} />
        </div>
      </div>

      {products.length > 0 && (
        <section className="container-x mt-20">
          <h2 className="mb-6 text-2xl font-semibold">Shop the article</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="container-x mt-20 mb-20">
          <h2 className="mb-6 text-2xl font-semibold">Keep reading</h2>
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
