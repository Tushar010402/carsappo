import type { Metadata } from "next";
import Link from "next/link";
import type { Brand } from "@prisma/client";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteBrand, saveBrand } from "@/app/admin/_actions/categories";
import { EmptyRow, PageHeader, Panel, TBody, THead, Table, Td, Th, Thumb, Tr } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-button";
import { FormDialog } from "@/components/admin/dialog";
import { AdminForm, FormError, FormField, FormSubmit } from "@/components/admin/form";
import { MediaInput } from "@/components/admin/media-input";
import { SlugFields } from "@/components/admin/slug-fields";
import { ActiveBadge } from "@/components/admin/status-badge";
import { CategoryIcon } from "@/components/icons/category-icon";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Categories & brands" };

function BrandForm({ brand }: { brand?: Brand }) {
  return (
    <AdminForm action={saveBrand} className="space-y-4">
      {brand && <input type="hidden" name="id" value={brand.id} />}
      <SlugFields defaultName={brand?.name} defaultSlug={brand?.slug} prefix="/shop?brand=" />
      <FormField name="logo" label="Logo" hint="Optional. Transparent PNG or SVG URL works best.">
        <MediaInput name="logo" defaultValue={brand?.logo} folder="brands" />
      </FormField>
      <FormError />
      <div className="flex justify-end">
        <FormSubmit>{brand ? "Save brand" : "Create brand"}</FormSubmit>
      </div>
    </AdminForm>
  );
}

export default async function CategoriesPage() {
  await requireAdmin();
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { parent: { select: { name: true } }, _count: { select: { products: true } } },
    }),
    prisma.brand.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { products: true } } } }),
  ]);

  return (
    <>
      <PageHeader
        title="Categories & brands"
        description="Organise the catalogue. Categories power the menu, category pages and homepage tiles."
        actions={
          <ButtonLink href="/admin/categories/new" size="sm">
            <Plus className="size-4" /> Add category
          </ButtonLink>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel title="Categories" flush>
          <Table minWidth={620}>
            <THead>
              <Th>Category</Th>
              <Th>Parent</Th>
              <Th align="right">Products</Th>
              <Th align="right">Order</Th>
              <Th>Status</Th>
              <Th>
                <span className="sr-only">Actions</span>
              </Th>
            </THead>
            <TBody>
              {categories.length === 0 && <EmptyRow colSpan={6}>No categories yet.</EmptyRow>}
              {categories.map((c) => (
                <Tr key={c.id}>
                  <Td>
                    <Link href={`/admin/categories/${c.id}`} className="group flex items-center gap-3">
                      {c.image ? (
                        <Thumb src={c.image} size={36} />
                      ) : (
                        <span className="grid size-9 place-items-center rounded-lg bg-brand-soft text-ink">
                          <CategoryIcon name={c.icon} className="size-4" />
                        </span>
                      )}
                      <span>
                        <span className="block font-medium group-hover:underline">{c.name}</span>
                        <span className="block font-mono text-xs text-muted">/{c.slug}</span>
                      </span>
                    </Link>
                  </Td>
                  <Td className="text-muted">{c.parent?.name ?? "—"}</Td>
                  <Td align="right">{c._count.products}</Td>
                  <Td align="right" className="text-muted">
                    {c.sortOrder}
                  </Td>
                  <Td>
                    <ActiveBadge active={c.isActive} />
                  </Td>
                  <Td align="right">
                    <Link href={`/admin/categories/${c.id}`} className="inline-grid size-8 place-items-center rounded-lg text-muted hover:bg-mist hover:text-ink" aria-label={`Edit ${c.name}`}>
                      <Pencil className="size-4" />
                    </Link>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Panel>

        <Panel
          title="Brands"
          description="Used for filters and product pages."
          flush
          actions={
            <FormDialog trigger={<><Plus className="size-4" /> Add</>} title="New brand">
              <BrandForm />
            </FormDialog>
          }
        >
          <ul className="divide-y divide-line">
            {brands.length === 0 && <li className="px-5 py-10 text-center text-sm text-muted">No brands yet.</li>}
            {brands.map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-5 py-3">
                <Thumb src={b.logo} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{b.name}</p>
                  <p className="text-xs text-muted">
                    {b._count.products} product{b._count.products === 1 ? "" : "s"} · <span className="font-mono">{b.slug}</span>
                  </p>
                </div>
                <FormDialog trigger={<Pencil className="size-4" />} triggerVariant="icon" triggerLabel={`Edit ${b.name}`} title={`Edit ${b.name}`}>
                  <BrandForm brand={b} />
                </FormDialog>
                <ActionButton
                  action={deleteBrand.bind(null, b.id)}
                  variant="icon-danger"
                  label={`Delete ${b.name}`}
                  confirm={`Delete brand "${b.name}"?${b._count.products ? ` ${b._count.products} product(s) will have no brand.` : ""}`}
                >
                  <Trash2 className="size-4" />
                </ActionButton>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
