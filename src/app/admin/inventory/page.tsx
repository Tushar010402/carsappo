import type { Metadata } from "next";
import Link from "next/link";
import { Download, Upload } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/format";
import { lowStockCount } from "@/lib/admin/metrics";
import { inventoryWhere } from "@/lib/admin/inventory";
import { ADMIN_PAGE_SIZE, pageParam, withParams } from "@/lib/admin/query";
import { EmptyRow, PageHeader, Panel, StatCard, TBody, THead, Table, Td, Th, Thumb, Tr } from "@/components/admin/ui";
import { FilterBar, FilterSelect, SearchInput } from "@/components/admin/filters";
import { AdminPagination } from "@/components/admin/pagination";
import { StockBadge } from "@/components/admin/status-badge";
import { StockAdjuster } from "@/components/admin/stock-adjuster";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = { title: "Inventory" };

export default async function InventoryPage({ searchParams }: PageProps<"/admin/inventory">) {
  await requireAdmin();
  const sp = await searchParams;
  const { where, q, category, stock } = await inventoryWhere(sp);
  const page = pageParam(sp);

  const [products, total, categories, totals, low, out] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ stock: "asc" }, { name: "asc" }],
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        stock: true,
        lowStockAlert: true,
        isActive: true,
        category: { select: { name: true } },
        images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
      },
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    prisma.$queryRaw<{ units: bigint; value: bigint }[]>`SELECT COALESCE(SUM(GREATEST(stock, 0)), 0)::bigint AS units, COALESCE(SUM(GREATEST(stock, 0)::bigint * price), 0)::bigint AS value FROM "Product" WHERE "isActive" = true`,
    lowStockCount(),
    prisma.product.count({ where: { isActive: true, stock: { lte: 0 } } }),
  ]);

  const exportHref = withParams("/admin/inventory/export", sp, { page: undefined });

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Stock levels across the catalogue. Stock is deducted when an order is confirmed and restored on cancellation/return."
        actions={
          <>
            <a href={exportHref} className={buttonClasses("outline", "sm")}>
              <Download className="size-4" /> Export CSV
            </a>
            <Link href="/admin/inventory/import" className={buttonClasses("primary", "sm")}>
              <Upload className="size-4" /> Bulk update
            </Link>
          </>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Units in stock (active)" value={Number(totals[0]?.units ?? 0).toLocaleString("en-IN")} />
        <StatCard label="Stock value (selling price)" value={formatINR(Number(totals[0]?.value ?? 0))} />
        <StatCard label="Low stock" value={low} tone="warning" href="/admin/inventory?stock=low" hint="At or below the alert level" />
        <StatCard label="Out of stock" value={out} tone="danger" href="/admin/inventory?stock=out" hint="Active products" />
      </div>
      <Panel flush>
        <FilterBar action="/admin/inventory" resetHref="/admin/inventory">
          <SearchInput defaultValue={q} placeholder="Search name or SKU…" />
          <FilterSelect label="Category" name="category" defaultValue={category ?? ""}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Stock" name="stock" defaultValue={stock ?? ""}>
            <option value="">All</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
            <option value="in">In stock</option>
          </FilterSelect>
        </FilterBar>
        <Table minWidth={820}>
          <THead>
            <Th>Product</Th>
            <Th>Category</Th>
            <Th align="right">Price</Th>
            <Th>Status</Th>
            <Th align="right">Alert at</Th>
            <Th align="right">Adjust stock</Th>
          </THead>
          <TBody>
            {products.length === 0 && <EmptyRow colSpan={6}>No products match.</EmptyRow>}
            {products.map((p) => (
              <Tr key={p.id}>
                <Td>
                  <Link href={`/admin/products/${p.id}`} className="group flex items-center gap-3">
                    <Thumb src={p.images[0]?.url} size={36} />
                    <span className="min-w-0">
                      <span className="block max-w-72 truncate font-medium group-hover:underline">{p.name}</span>
                      <span className="font-mono text-xs text-muted">
                        {p.sku}
                        {!p.isActive && " · hidden"}
                      </span>
                    </span>
                  </Link>
                </Td>
                <Td className="text-muted">{p.category.name}</Td>
                <Td align="right">{formatINR(p.price)}</Td>
                <Td>
                  <StockBadge stock={p.stock} alert={p.lowStockAlert} />
                </Td>
                <Td align="right" className="text-muted">
                  {p.lowStockAlert}
                </Td>
                <Td align="right">
                  <StockAdjuster key={`${p.id}-${p.stock}`} productId={p.id} stock={p.stock} name={p.name} />
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
        <AdminPagination page={page} pageSize={ADMIN_PAGE_SIZE} total={total} hrefFor={(n) => withParams("/admin/inventory", sp, { page: n })} />
      </Panel>
    </>
  );
}
