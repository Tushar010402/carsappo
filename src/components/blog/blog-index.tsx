import Link from "next/link";
import { prisma } from "@/lib/db";
import { PostCard } from "@/components/blog/post-card";
import { EmptyState } from "@/components/ui/container";
import { cn } from "@/lib/utils";

export async function BlogIndex({ categorySlug, title, description }: { categorySlug?: string; title: string; description: string }) {
  const [categories, posts] = await Promise.all([
    prisma.blogCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.post.findMany({
      where: { isPublished: true, publishedAt: { lte: new Date() }, ...(categorySlug ? { category: { slug: categorySlug } } : {}) },
      orderBy: { publishedAt: "desc" },
      select: { slug: true, title: true, excerpt: true, coverImage: true, readingMinutes: true, publishedAt: true, category: { select: { name: true, slug: true } } },
    }),
  ]);
  const [first, ...rest] = posts;
  return (
    <div className="container-x py-12 sm:py-16">
      <p className="eyebrow">The Carsappo Journal</p>
      <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">{description}</p>
      <nav className="no-scrollbar -mx-4 mt-8 flex gap-2 overflow-x-auto px-4" aria-label="Blog categories">
        <Link href="/blog" className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-medium", !categorySlug ? "bg-ink text-white" : "border border-line hover:border-ink")}>
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/blog/category/${c.slug}`}
            className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-medium", categorySlug === c.slug ? "bg-ink text-white" : "border border-line hover:border-ink")}
          >
            {c.name}
          </Link>
        ))}
      </nav>
      {!first ? (
        <div className="mt-12">
          <EmptyState title="No articles yet" description="Check back soon for car care tips and buying guides." />
        </div>
      ) : (
        <>
          <div className="mt-12">
            <PostCard post={first} featured />
          </div>
          {rest.length > 0 && (
            <div className="mt-16 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
