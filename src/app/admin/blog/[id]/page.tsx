import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deletePost } from "@/app/admin/_actions/blog";
import { PageHeader } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-button";
import { ActiveBadge } from "@/components/admin/status-badge";
import { PostForm } from "@/components/admin/post-form";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = { title: "Edit post" };

export default async function EditPostPage({ params }: PageProps<"/admin/blog/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const [post, categories] = await Promise.all([
    prisma.post.findUnique({ where: { id } }),
    prisma.blogCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!post) notFound();
  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <span className="truncate">{post.title}</span> <ActiveBadge active={post.isPublished} on="Published" off="Draft" />
          </span>
        }
        back={{ href: "/admin/blog", label: "Blog" }}
        actions={
          <>
            {post.isPublished && (
              <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className={buttonClasses("outline", "sm")}>
                <ExternalLink className="size-4" /> View
              </a>
            )}
            <ActionButton action={deletePost.bind(null, post.id)} className="text-red-600" confirm="Delete this post permanently?">
              <Trash2 className="size-4" /> Delete
            </ActionButton>
          </>
        }
      />
      <PostForm key={post.id} post={post} categories={categories} />
    </>
  );
}
