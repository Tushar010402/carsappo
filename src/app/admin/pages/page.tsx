import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Pencil, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { BUILT_IN_POLICY_SLUGS, POLICY_DEFAULTS } from "@/lib/policies";
import { pageHref } from "@/lib/pages";
import { customizePolicy } from "@/app/admin/_actions/pages";
import { ActionButton } from "@/components/admin/action-button";
import { Badge } from "@/components/ui/badge";
import { EmptyRow, PageHeader, Panel, TBody, THead, Table, Td, Th, Tr } from "@/components/admin/ui";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = { title: "Pages" };

const SITE_PAGES = [
  { title: "Homepage", href: "/", edit: "/admin/storefront/home", note: "Sections, headings, hero, why-us points" },
  { title: "About", href: "/about", edit: "/admin/pages/about", note: "Story, mission, values, business cards" },
  { title: "Contact", href: "/contact", edit: "/admin/pages/contact", note: "Heading, support hours, thank-you message" },
  { title: "Car cleaning services", href: "/services", edit: "/admin/services?tab=content", note: "Service names, what's included, time slots" },
  { title: "FAQs", href: "/faq", edit: "/admin/faqs", note: "Questions for the FAQ page and services page" },
];

function Status({ published, footer }: { published: boolean; footer: boolean }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {published ? <Badge tone="success">Published</Badge> : <Badge tone="soft">Hidden</Badge>}
      {published && footer && <Badge tone="info">In footer</Badge>}
    </span>
  );
}

export default async function PagesAdmin() {
  await requireAdmin();
  const pages = await prisma.page.findMany({ orderBy: [{ kind: "asc" }, { sortOrder: "asc" }, { title: "asc" }] });
  const bySlug = new Map(pages.map((p) => [p.slug, p]));
  const customPolicies = pages.filter((p) => p.kind === "POLICY" && !BUILT_IN_POLICY_SLUGS.includes(p.slug));
  const customPages = pages.filter((p) => p.kind === "PAGE");

  return (
    <>
      <PageHeader
        title="Pages"
        description="Every page of the website you can edit: homepage, About, Contact, policies and your own pages."
        actions={
          <>
            <Link href="/admin/pages/new?kind=POLICY" className={buttonClasses("outline", "sm")}>
              <Plus className="size-4" /> New policy
            </Link>
            <Link href="/admin/pages/new" className={buttonClasses("primary", "sm")}>
              <Plus className="size-4" /> New page
            </Link>
          </>
        }
      />
      <div className="space-y-6">
        <Panel title="Site pages" flush>
          <Table minWidth={560}>
            <THead>
              <Th>Page</Th>
              <Th>What you can change</Th>
              <Th align="right">Actions</Th>
            </THead>
            <TBody>
              {SITE_PAGES.map((p) => (
                <Tr key={p.href}>
                  <Td>
                    <span className="font-semibold">{p.title}</span>
                    <span className="block font-mono text-xs text-muted">{p.href}</span>
                  </Td>
                  <Td className="text-muted">{p.note}</Td>
                  <Td align="right">
                    <span className="inline-flex gap-2">
                      <Link href={p.edit} className={buttonClasses("outline", "sm")} aria-label={`Edit ${p.title}`}>
                        <Pencil className="size-4" /> Edit
                      </Link>
                      <a href={p.href} target="_blank" rel="noopener noreferrer" className={buttonClasses("ghost", "sm")} aria-label={`View ${p.title}`}>
                        <ExternalLink className="size-4" />
                      </a>
                    </span>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Panel>

        <Panel title="Policies" description="Built-in policies start with ready-made text that fills in your store details. Customise to edit the wording." flush>
          <Table minWidth={640}>
            <THead>
              <Th>Policy</Th>
              <Th>Text</Th>
              <Th>Status</Th>
              <Th align="right">Actions</Th>
            </THead>
            <TBody>
              {BUILT_IN_POLICY_SLUGS.map((slug) => {
                const row = bySlug.get(slug);
                return (
                  <Tr key={slug}>
                    <Td>
                      <span className="font-semibold">{row?.title ?? POLICY_DEFAULTS[slug].title}</span>
                      <span className="block font-mono text-xs text-muted">/policies/{slug}</span>
                    </Td>
                    <Td className="text-muted">{row ? `Customised · ${formatDate(row.updatedAt)}` : "Default text"}</Td>
                    <Td>
                      <Status published={row?.isPublished ?? true} footer={row?.showInFooter ?? true} />
                    </Td>
                    <Td align="right">
                      <span className="inline-flex gap-2">
                        {row ? (
                          <Link href={`/admin/pages/${row.id}`} className={buttonClasses("outline", "sm")} aria-label={`Edit ${row.title}`}>
                            <Pencil className="size-4" /> Edit
                          </Link>
                        ) : (
                          <ActionButton action={customizePolicy.bind(null, slug)} label={`Customise ${POLICY_DEFAULTS[slug].title}`}>
                            <Pencil className="size-4" /> Customise
                          </ActionButton>
                        )}
                        <a href={`/policies/${slug}`} target="_blank" rel="noopener noreferrer" className={buttonClasses("ghost", "sm")} aria-label="View policy">
                          <ExternalLink className="size-4" />
                        </a>
                      </span>
                    </Td>
                  </Tr>
                );
              })}
              {customPolicies.map((p) => (
                <PageRow key={p.id} page={p} />
              ))}
            </TBody>
          </Table>
        </Panel>

        <Panel title="Your pages" description="Extra pages such as Warranty, Bulk orders or Careers, at /pages/…" flush>
          <Table minWidth={640}>
            <THead>
              <Th>Page</Th>
              <Th>Updated</Th>
              <Th>Status</Th>
              <Th align="right">Actions</Th>
            </THead>
            <TBody>
              {customPages.length === 0 && <EmptyRow colSpan={4}>No custom pages yet. Use “New page” to add one.</EmptyRow>}
              {customPages.map((p) => (
                <PageRow key={p.id} page={p} />
              ))}
            </TBody>
          </Table>
        </Panel>
      </div>
    </>
  );
}

function PageRow({ page }: { page: { id: string; title: string; slug: string; kind: "POLICY" | "PAGE"; isPublished: boolean; showInFooter: boolean; updatedAt: Date } }) {
  const href = pageHref(page.kind, page.slug);
  return (
    <Tr>
      <Td>
        <span className="font-semibold">{page.title}</span>
        <span className="block font-mono text-xs text-muted">{href}</span>
      </Td>
      <Td className="text-muted">{formatDate(page.updatedAt)}</Td>
      <Td>
        <Status published={page.isPublished} footer={page.showInFooter} />
      </Td>
      <Td align="right">
        <span className="inline-flex gap-2">
          <Link href={`/admin/pages/${page.id}`} className={buttonClasses("outline", "sm")} aria-label={`Edit ${page.title}`}>
            <Pencil className="size-4" /> Edit
          </Link>
          <a href={href} target="_blank" rel="noopener noreferrer" className={buttonClasses("ghost", "sm")} aria-label={`View ${page.title}`}>
            <ExternalLink className="size-4" />
          </a>
        </span>
      </Td>
    </Tr>
  );
}
