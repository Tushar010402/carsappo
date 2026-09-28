import type { Metadata } from "next";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { REVENUE_SQL } from "@/lib/admin/metrics";
import { ADMIN_PAGE_SIZE, enumParam, pageParam, param, withParams } from "@/lib/admin/query";
import { EmptyRow, Money, PageHeader, Panel, TBody, THead, Table, Td, Th, Tr } from "@/components/admin/ui";
import { FilterBar, FilterSelect, SearchInput } from "@/components/admin/filters";
import { AdminPagination } from "@/components/admin/pagination";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = param(sp, "q");
  const role = enumParam(sp, "role", ["ADMIN", "CUSTOMER"] as const);
  const page = pageParam(sp);

  const where: Prisma.UserWhereInput = {
    ...(role ? { role } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q.replace(/\D/g, "") || q } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true, _count: { select: { orders: true } } },
    }),
    prisma.user.count({ where }),
  ]);

  const ids = users.map((u) => u.id);
  const spent = ids.length
    ? await prisma.$queryRaw<{ userId: string; total: bigint; last: Date | null }[]>`
        SELECT o."userId", COALESCE(SUM(o.total), 0)::bigint AS total, MAX(o."createdAt") AS last
        FROM "Order" o
        WHERE o."userId" IN (${Prisma.join(ids)}) AND ${REVENUE_SQL}
        GROUP BY o."userId"`
    : [];
  const spentBy = new Map(spent.map((s) => [s.userId, s]));

  return (
    <>
      <PageHeader title="Customers" description={`${total} account${total === 1 ? "" : "s"}. Guest checkouts are linked automatically when a customer registers with the same email.`} />
      <Panel flush>
        <FilterBar action="/admin/customers" resetHref="/admin/customers">
          <SearchInput defaultValue={q} placeholder="Search name, email or phone…" />
          <FilterSelect label="Role" name="role" defaultValue={role ?? ""}>
            <option value="">All roles</option>
            <option value="CUSTOMER">Customers</option>
            <option value="ADMIN">Admins</option>
          </FilterSelect>
        </FilterBar>
        <Table minWidth={760}>
          <THead>
            <Th>Customer</Th>
            <Th>Phone</Th>
            <Th align="right">Orders</Th>
            <Th align="right">Total spent</Th>
            <Th>Last order</Th>
            <Th>Joined</Th>
          </THead>
          <TBody>
            {users.length === 0 && <EmptyRow colSpan={6}>No customers found.</EmptyRow>}
            {users.map((u) => {
              const s = spentBy.get(u.id);
              return (
                <Tr key={u.id}>
                  <Td>
                    <Link href={`/admin/customers/${u.id}`} className="group flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-mist font-display text-xs font-semibold">
                        {u.name
                          .split(/\s+/)
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 font-medium group-hover:underline">
                          {u.name} {u.role === "ADMIN" && <Badge tone="dark">Admin</Badge>}
                        </span>
                        <span className="block truncate text-xs text-muted">{u.email}</span>
                      </span>
                    </Link>
                  </Td>
                  <Td className="text-muted">{u.phone ?? "—"}</Td>
                  <Td align="right">{u._count.orders}</Td>
                  <Td align="right">
                    <Money paise={Number(s?.total ?? 0)} className="font-medium" />
                  </Td>
                  <Td className="text-muted">{s?.last ? formatDate(s.last) : "—"}</Td>
                  <Td className="text-muted">{formatDate(u.createdAt)}</Td>
                </Tr>
              );
            })}
          </TBody>
        </Table>
        <AdminPagination page={page} pageSize={ADMIN_PAGE_SIZE} total={total} hrefFor={(n) => withParams("/admin/customers", sp, { page: n })} />
      </Panel>
    </>
  );
}
