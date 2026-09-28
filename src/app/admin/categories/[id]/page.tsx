import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteCategory } from "@/app/admin/_actions/categories";
import { PageHeader } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-button";
import { CategoryForm } from "@/components/admin/category-form";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = { title: "Edit category" };

export default async function EditCategoryPage({ params }: PageProps<"/admin/categories/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const [category, parents] = await Promise.all([
    prisma.category.findUnique({ where: { id }, include: { _count: { select: { products: true } } } }),
    prisma.category.findMany({ where: { parentId: null }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!category) notFound();
  return (
    <>
      <PageHeader
        title={category.name}
        description={`${category._count.products} product${category._count.products === 1 ? "" : "s"}`}
        back={{ href: "/admin/categories", label: "Categories & brands" }}
        actions={
          <>
            <a href={`/category/${category.slug}`} target="_blank" rel="noopener noreferrer" className={buttonClasses("outline", "sm")}>
              <ExternalLink className="size-4" /> View
            </a>
            <ActionButton action={deleteCategory.bind(null, category.id)} confirm={`Delete the category "${category.name}"?`} className="text-red-600">
              <Trash2 className="size-4" /> Delete
            </ActionButton>
          </>
        }
      />
      <CategoryForm key={category.id} category={category} parents={parents} />
    </>
  );
}
