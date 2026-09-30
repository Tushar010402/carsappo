import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isBuiltInPolicy, pageHref } from "@/lib/pages";
import { PageHeader } from "@/components/admin/ui";
import { PageForm } from "@/components/admin/page-form";

export const metadata: Metadata = { title: "Edit page" };

export default async function EditPage({ params }: PageProps<"/admin/pages/[id]">) {
  await requireAdmin();
  const page = await prisma.page.findUnique({ where: { id: (await params).id } });
  if (!page) notFound();
  const href = pageHref(page.kind, page.slug);
  return (
    <>
      <PageHeader
        title={page.title}
        back={{ href: "/admin/pages", label: "Pages" }}
        actions={
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold underline">
            View {href}
          </a>
        }
      />
      <PageForm page={page} kind={page.kind} builtIn={page.kind === "POLICY" && isBuiltInPolicy(page.slug)} />
    </>
  );
}
