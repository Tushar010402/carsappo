import type { Metadata } from "next";
import Link from "next/link";
import type { OrderStatus, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/constants";
import { ADMIN_PAGE_SIZE, dateRange, enumParam, pageParam, param, withParams } from "@/lib/admin/query";
import { EmptyRow, Money, PageHeader, Panel, TBody, THead, Table, Tabs, Td, Th, Tr } from "@/components/admin/ui";
import { FilterBar, FilterDate, FilterSelect, SearchInput } from "@/components/admin/filters";
import { AdminPagination } from "@/components/admin/pagination";
import { OrderStatusBadge, PaymentBadge } from "@/components/admin/status-badge";

export const metadata: Metadata = { title: "Orders" };

const STATUSES = Object.keys(ORDER_STATUS_LABEL) as OrderStatus[];
const PAYMENT_STATUSES = Object.keys(PAYMENT_STATUS_LABEL) as PaymentStatus[];
const METHODS = ["RAZORPAY", "COD"] as const satisfies readonly PaymentMethod[];
const QUICK = [
  { key: "", label: "All" },
  { key: "to-ship", label: "To ship" },
  { key: "PENDING", label: "Awaiting payment" },
  { key: "SHIPPED", label: "In transit" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "CANCELLED", label: "Cancelled" },
] as const;

export default async function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin();
  const sp = await searchParams;
  const view = param(sp, "view");
  const status = enumParam(sp, "status", STATUSES);
  const payment = enumParam(sp, "payment", PAYMENT_STATUSES);
  const method = enumParam(sp, "method", METHODS);
  const q = param(sp, "q");
  const { from, to, gte, lt } = dateRange(sp);
  const page = pageParam(sp);

  const where: Prisma.OrderWhereInput = {
    ...(view === "to-ship" ? { status: { in: ["CONFIRMED", "PROCESSING"] } } : {}),
    ...(status ? { status } : {}),
    ...(payment ? { paymentStatus: payment } : {}),
    ...(method ? { paymentMethod: method } : {}),
    ...(gte || lt ? { createdAt: { ...(gte ? { gte } : {}), ...(lt ? { lt } : {}) } } : {}),
    ...(q
      ? {
          OR: [
            { orderNumber: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q.replace(/\D/g, "") || q } },
            { shipPhone: { contains: q.replace(/\D/g, "") || q } },
            { shipName: { contains: q, mode: "insensitive" } },
            { awbCode: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [orders, total, toShip, pending] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      select: {
        id: true,
        orderNumber: true,
        createdAt: true,
        shipName: true,
        email: true,
        shipCity: true,
        shipState: true,
        total: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        awbCode: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where }),
    prisma.order.count({ where: { status: { in: ["CONFIRMED", "PROCESSING"] } } }),
    prisma.order.count({ where: { status: "PENDING" } }),
  ]);

  const activeQuick = view === "to-ship" ? "to-ship" : (status ?? "");
  const counts: Record<string, number | undefined> = { "to-ship": toShip, PENDING: pending };

  return (
    <>
      <PageHeader title="Orders" description="Search, filter and fulfil customer orders." />
      <Tabs
        items={QUICK.map((t) => ({
          href: t.key === "to-ship" ? "/admin/orders?view=to-ship" : t.key ? `/admin/orders?status=${t.key}` : "/admin/orders",
          label: t.label,
          active: activeQuick === t.key && !payment && !method && !q && !from && !to,
          count: counts[t.key],
        }))}
      />
      <Panel flush>
        <FilterBar action="/admin/orders" resetHref="/admin/orders">
          {view && <input type="hidden" name="view" value={view} />}
          <SearchInput defaultValue={q} placeholder="Order no., email, phone, name or AWB…" />
          <FilterSelect label="Status" name="status" defaultValue={status ?? ""}>
            <option value="">Any status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABEL[s]}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Payment" name="payment" defaultValue={payment ?? ""}>
            <option value="">Any payment</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PAYMENT_STATUS_LABEL[s]}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Method" name="method" defaultValue={method ?? ""}>
            <option value="">Any method</option>
            <option value="RAZORPAY">Online (Razorpay)</option>
            <option value="COD">Cash on delivery</option>
          </FilterSelect>
          <FilterDate label="From" name="from" defaultValue={from} />
          <FilterDate label="To" name="to" defaultValue={to} />
        </FilterBar>
        <Table minWidth={900}>
          <THead>
            <Th>Order</Th>
            <Th>Customer</Th>
            <Th align="right">Items</Th>
            <Th align="right">Total</Th>
            <Th>Payment</Th>
            <Th>Status</Th>
          </THead>
          <TBody>
            {orders.length === 0 && <EmptyRow colSpan={6}>No orders match these filters.</EmptyRow>}
            {orders.map((o) => (
              <Tr key={o.id}>
                <Td>
                  <Link href={`/admin/orders/${o.id}`} className="font-semibold text-ink hover:underline">
                    {o.orderNumber}
                  </Link>
                  <span className="block text-xs text-muted">{formatDateTime(o.createdAt)}</span>
                </Td>
                <Td>
                  <span className="block font-medium">{o.shipName}</span>
                  <span className="block max-w-64 truncate text-xs text-muted">
                    {o.email} · {o.shipCity}, {o.shipState}
                  </span>
                </Td>
                <Td align="right">{o._count.items}</Td>
                <Td align="right">
                  <Money paise={o.total} className="font-medium" />
                </Td>
                <Td>
                  <span className="flex flex-col items-start gap-1">
                    <PaymentBadge status={o.paymentStatus} method={o.paymentMethod} />
                    <span className="text-[11px] text-muted">{o.paymentMethod === "COD" ? "Cash on delivery" : "Online"}</span>
                  </span>
                </Td>
                <Td>
                  <span className="flex flex-col items-start gap-1">
                    <OrderStatusBadge status={o.status} />
                    {o.awbCode && <span className="font-mono text-[11px] text-muted">AWB {o.awbCode}</span>}
                  </span>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
        <AdminPagination page={page} pageSize={ADMIN_PAGE_SIZE} total={total} hrefFor={(n) => withParams("/admin/orders", sp, { page: n })} />
      </Panel>
    </>
  );
}
