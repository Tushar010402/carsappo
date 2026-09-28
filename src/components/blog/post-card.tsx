import Link from "next/link";
import { SmartImage } from "@/components/ui/smart-image";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export type PostCardData = {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  readingMinutes: number;
  publishedAt: Date | null;
  category: { name: string; slug: string };
};

export function PostCard({ post, featured }: { post: PostCardData; featured?: boolean }) {
  return (
    <article className={cn("group", featured && "grid gap-6 lg:grid-cols-2 lg:items-center lg:gap-10")}>
      <Link href={`/blog/${post.slug}`} tabIndex={-1} aria-hidden className="relative block aspect-[16/9] overflow-hidden rounded-[var(--radius-card)] bg-ink">
        {post.coverImage && (
          <SmartImage
            src={post.coverImage}
            alt=""
            fill
            sizes={featured ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 33vw, 100vw"}
            className="object-cover transition duration-500 group-hover:scale-105"
            priority={featured}
          />
        )}
      </Link>
      <div className={cn(!featured && "pt-4")}>
        <p className="flex items-center gap-2 text-xs text-muted">
          <Link href={`/blog/category/${post.category.slug}`} className="font-semibold text-ink hover:underline">
            {post.category.name}
          </Link>
          · {post.readingMinutes} min read {post.publishedAt && `· ${formatDate(post.publishedAt)}`}
        </p>
        <h2 className={cn("mt-2 font-semibold group-hover:underline", featured ? "text-3xl sm:text-4xl" : "text-lg")}>
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h2>
        <p className={cn("mt-2 text-muted", featured ? "text-base" : "line-clamp-2 text-sm")}>{post.excerpt}</p>
      </div>
    </article>
  );
}
