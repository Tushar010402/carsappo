import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { firstParam } from "@/lib/utils";
import { PageHeader } from "@/components/admin/ui";
import { PageForm } from "@/components/admin/page-form";

export const metadata: Metadata = { title: "New page" };

export default async function NewPage({ searchParams }: PageProps<"/admin/pages/new">) {
  await requireAdmin();
  const kind = firstParam((await searchParams).kind) === "POLICY" ? "POLICY" : "PAGE";
  return (
    <>
      <PageHeader title={kind === "POLICY" ? "New policy" : "New page"} back={{ href: "/admin/pages", label: "Pages" }} />
      <PageForm kind={kind} />
    </>
  );
}
