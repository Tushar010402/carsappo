import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Callout, PageHeader } from "@/components/admin/ui";
import { PostForm } from "@/components/admin/post-form";

export const metadata: Metadata = { title: "New post" };

export default async function NewPostPage() {
  await requireAdmin();
  const categories = await prisma.blogCategory.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  return (
    <>
      <PageHeader title="New blog post" back={{ href: "/admin/blog", label: "Blog" }} />
      {categories.length === 0 && (
        <Callout tone="warning" className="mb-6">
          Create a blog category first (Blog → Categories).
        </Callout>
      )}
      <PostForm categories={categories} />
    </>
  );
}
