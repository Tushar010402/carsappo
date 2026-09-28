import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Eye, EyeOff, Pencil, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { lowStockProducts } from "@/lib/admin/metrics";
import { ADMIN_PAGE_SIZE, enumParam, pageParam, param, withParams } from "@/lib/admin/query";
import { setProductActive } from "@/app/admin/_actions/products";
import { EmptyRow, PageHeader, Panel, TBody, THead, Table, Td, Th, Thumb, Tr } from "@/components/admin/ui";
import { FilterBar, FilterSelect, SearchInput } from "@/components/admin/filters";
import { AdminPagination } from "@/components/admin/pagination";
import { ActionButton } from "@/components/admin/action-button";
import { ActiveBadge, StockBadge } from "@/components/admin/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Products" };

const STATUSES = ["active", "hidden", "low", "out"] as const;
const SORTS = { newest: { createdAt: "desc" }, name: { name: "asc" }, "price-desc": { price: "desc" }, "price-asc": { price: "asc" }, "stock-asc": { stock: "asc" }, sales: { salesCount: "desc" } } as const;

export default async function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = param(sp, "q");
  const category = param(sp, "category");
  const status = enumParam(sp, "status", STATUSES);
  const sort = enumParam(sp, "sort", Object.keys(SORTS) as (keyof typeof SORTS)[]) ?? "newest";
  const page = pageParam(sp);

  const where: Prisma.ProductWhereInput = {
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }, { tags: { has: q.toLowerCase() } }] } : {}),
    ...(category ? { categoryId: category } : {}),
    ...(status === "active" ? { isActive: true } : {}),
    ...(status === "hidden" ? { isActive: false } : {}),
    ...(status === "out" ? { stock: { lte: 0 } } : {}),
  };
  if (status === "low") where.id = { in: await lowStockProducts() };

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [SORTS[sort], { id: "asc" }],
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        sku: true,
        slug: true,
        price: true,
        mrp: true,
        stock: true,
        lowStockAlert: true,
        isActive: true,
        isUniversal: true,
        isBestSeller: true,
        salesCount: true,
        category: { select: { name: true } },
        images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
      },
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);

  return (
    <>
      <PageHeader
        title="Products"
        description={`${total} product${total === 1 ? "" : "s"}${q || category || status ? " match your filters" : " in the catalogue"}`}
        actions={
          <ButtonLink href="/admin/products/new" variant="primary" size="sm">
            <Plus className="size-4" /> Add product
          </ButtonLink>
        }
      />
      <Panel flush>
        <FilterBar action="/admin/products" resetHref="/admin/products">
          <SearchInput defaultValue={q} placeholder="Search name, SKU or tag…" />
          <FilterSelect label="Category" name="category" defaultValue={category ?? ""}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Status" name="status" defaultValue={status ?? ""}>
            <option value="">Any status</option>
            <option value="active">Active</option>
            <option value="hidden">Hidden</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </FilterSelect>
          <FilterSelect label="Sort" name="sort" defaultValue={sort}>
            <option value="newest">Newest</option>
            <option value="name">Name A–Z</option>
            <option value="sales">Best selling</option>
            <option value="price-desc">Price high–low</option>
            <option value="price-asc">Price low–high</option>
            <option value="stock-asc">Stock low–high</option>
          </FilterSelect>
        </FilterBar>
        <Table minWidth={860}>
          <THead>
            <Th>Product</Th>
            <Th>Category</Th>
            <Th align="right">Price</Th>
            <Th>Stock</Th>
            <Th align="right">Sold</Th>
            <Th>Status</Th>
            <Th align="right">
              <span className="sr-only">Actions</span>
            </Th>
          </THead>
          <TBody>
            {products.length === 0 && (
              <EmptyRow colSpan={7}>
                No products found. <Link href="/admin/products/new" className="font-semibold text-ink underline">Add a product</Link>
              </EmptyRow>
            )}
            {products.map((p) => (
              <Tr key={p.id}>
                <Td>
                  <Link href={`/admin/products/${p.id}`} className="group flex items-center gap-3">
                    <Thumb src={p.images[0]?.url} alt="" size={44} />
                    <span className="min-w-0">
                      <span className="block max-w-80 truncate font-medium text-ink group-hover:underline">{p.name}</span>
                      <span className="flex items-center gap-1.5 text-xs text-muted">
                        <span className="font-mono">{p.sku}</span>
                        {p.isUniversal && <Badge tone="soft">Universal</Badge>}
                        {p.isBestSeller && <Badge tone="brand">Best seller</Badge>}
                      </span>
                    </span>
                  </Link>
                </Td>
                <Td className="text-muted">{p.category.name}</Td>
                <Td align="right">
                  <span className="font-medium">{formatINR(p.price)}</span>
                  {p.mrp && p.mrp > p.price && <span className="block text-xs text-muted line-through">{formatINR(p.mrp)}</span>}
                </Td>
                <Td>
                  <StockBadge stock={p.stock} alert={p.lowStockAlert} />
                </Td>
                <Td align="right">{p.salesCount}</Td>
                <Td>
                  <ActiveBadge active={p.isActive} />
                </Td>
                <Td align="right">
                  <div className="flex justify-end gap-0.5">
                    <ActionButton
                      action={setProductActive.bind(null, p.id, !p.isActive)}
                      variant="icon"
                      label={p.isActive ? `Hide ${p.name}` : `Publish ${p.name}`}
                    >
                      {p.isActive ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </ActionButton>
                    <Link href={`/admin/products/${p.id}`} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-mist hover:text-ink" aria-label={`Edit ${p.name}`}>
                      <Pencil className="size-4" />
                    </Link>
                  </div>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
        <AdminPagination page={page} pageSize={ADMIN_PAGE_SIZE} total={total} hrefFor={(n) => withParams("/admin/products", sp, { page: n })} />
      </Panel>
    </>
  );
}
