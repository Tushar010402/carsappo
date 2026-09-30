import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/format";
import { revenueWhere } from "@/lib/admin/metrics";
import { setUserRole } from "@/app/admin/_actions/customers";
import { EmptyRow, KeyValues, Money, PageHeader, Panel, StatCard, TBody, THead, Table, Td, Th, Tr } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-button";
import { OrderStatusBadge, PaymentBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Customer" };

export default async function CustomerDetailPage({ params }: PageProps<"/admin/customers/[id]">) {
  const admin = await requireAdmin();
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] },
      orders: { orderBy: { createdAt: "desc" }, take: 50, include: { _count: { select: { items: true } } } },
      _count: { select: { orders: true, reviews: true, wishlist: true } },
    },
  });
  if (!user) notFound();

  const agg = await prisma.order.aggregate({ where: { userId: user.id, ...revenueWhere }, _sum: { total: true }, _count: { _all: true } });
  const spent = agg._sum.total ?? 0;
  const paidOrders = agg._count._all;
  const isSelf = user.id === admin.id;

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {user.name} {user.role === "ADMIN" && <Badge tone="dark">Admin</Badge>}
          </span>
        }
        description={`${user.email}${user.phone ? ` · ${user.phone}` : ""} · joined ${formatDate(user.createdAt)}`}
        back={{ href: "/admin/customers", label: "Customers" }}
        actions={
          user.role === "ADMIN" ? (
            <ActionButton
              action={setUserRole.bind(null, user.id, "CUSTOMER")}
              disabled={isSelf}
              confirm={`Remove admin access for ${user.name}?`}
              className="text-red-600"
            >
              <ShieldOff className="size-4" /> {isSelf ? "This is you" : "Remove admin"}
            </ActionButton>
          ) : (
            <ActionButton
              action={setUserRole.bind(null, user.id, "ADMIN")}
              confirm={`Give ${user.name} full admin access? They will be able to manage orders, products and settings.`}
            >
              <ShieldCheck className="size-4" /> Make admin
            </ActionButton>
          )
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Orders" value={user._count.orders} hint={`${paidOrders} counted as revenue`} />
        <StatCard label="Total spent" value={<Money paise={spent} />} />
        <StatCard label="Average order" value={<Money paise={paidOrders ? Math.round(spent / paidOrders) : 0} />} />
        <StatCard label="Reviews · wishlist" value={`${user._count.reviews} · ${user._count.wishlist}`} />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel title="Orders" flush>
          <Table minWidth={640}>
            <THead>
              <Th>Order</Th>
              <Th align="right">Items</Th>
              <Th align="right">Total</Th>
              <Th>Payment</Th>
              <Th>Status</Th>
            </THead>
            <TBody>
              {user.orders.length === 0 && <EmptyRow colSpan={5}>No orders yet.</EmptyRow>}
              {user.orders.map((o) => (
                <Tr key={o.id}>
                  <Td>
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:underline">
                      {o.orderNumber}
                    </Link>
                    <span className="block text-xs text-muted">{formatDateTime(o.createdAt)}</span>
                  </Td>
                  <Td align="right">{o._count.items}</Td>
                  <Td align="right">
                    <Money paise={o.total} />
                  </Td>
                  <Td>
                    <PaymentBadge status={o.paymentStatus} method={o.paymentMethod} />
                  </Td>
                  <Td>
                    <OrderStatusBadge status={o.status} />
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Panel>
        <div className="space-y-6">
          <Panel title="Contact">
            <KeyValues
              items={[
                ["Email", <a key="e" href={`mailto:${user.email}`} className="hover:underline">{user.email}</a>],
                ["Phone", user.phone ? <a key="p" href={`tel:${user.phone}`} className="hover:underline">{user.phone}</a> : "—"],
                ["Role", user.role === "ADMIN" ? "Admin" : "Customer"],
                ["Joined", formatDateTime(user.createdAt)],
              ]}
            />
          </Panel>
          <Panel title={`Addresses (${user.addresses.length})`}>
            {user.addresses.length === 0 ? (
              <p className="text-sm text-muted">No saved addresses.</p>
            ) : (
              <ul className="space-y-3">
                {user.addresses.map((a) => (
                  <li key={a.id} className="rounded-xl border border-line p-3 text-sm">
                    <p className="flex items-center gap-2 font-medium">
                      {a.name} {a.isDefault && <Badge tone="brand">Default</Badge>}
                    </p>
                    <p className="text-muted">
                      {a.line1}
                      {a.line2 ? `, ${a.line2}` : ""}
                      {a.landmark ? `, ${a.landmark}` : ""}, {a.city}, {a.state} {a.pincode}
                    </p>
                    <p className="text-xs text-muted">{a.phone}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
