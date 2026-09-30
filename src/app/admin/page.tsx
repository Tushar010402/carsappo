import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarCheck, IndianRupee, Inbox, PackageCheck, ReceiptText, ShoppingBag, TrendingUp, Truck } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, formatDateTime, formatINR } from "@/lib/format";
import { getSettings, serviceName } from "@/lib/settings";
import { lowStockCount, lowStockProducts, toShipWhere } from "@/lib/admin/metrics";
import { periodFor, revenueByDay, revenueSummary } from "@/lib/admin/analytics";
import { EmptyRow, Money, Panel, StatCard, TBody, THead, Table, Td, Th, Thumb, Tr } from "@/components/admin/ui";
import { ColumnChart } from "@/components/admin/charts";
import { BookingStatusBadge, OrderStatusBadge, PaymentBadge, StockBadge } from "@/components/admin/status-badge";

export const metadata: Metadata = { title: "Dashboard" };

const wholeINR = (paise: number) => formatINR(Math.round(paise / 100) * 100);

function ViewAll({ href, label = "View all" }: { href: string; label?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-xs font-semibold text-ink hover:underline">
      {label} <ArrowRight className="size-3.5" />
    </Link>
  );
}

export default async function AdminDashboard() {
  const admin = await requireAdmin();
  const today = periodFor(1);
  const month = periodFor(30);
  const fortnight = periodFor(14);

  const [todayStats, monthStats, trend, toShip, pendingPayment, lowCount, lowIds, newBookings, unread, pendingReviews, recentOrders, bookings, settings] = await Promise.all([
    revenueSummary(today.start, today.end),
    revenueSummary(month.start, month.end),
    revenueByDay(fortnight.start, fortnight.end),
    prisma.order.count({ where: toShipWhere }),
    prisma.order.count({ where: { status: "PENDING" } }),
    lowStockCount(),
    lowStockProducts(8),
    prisma.serviceBooking.count({ where: { status: "NEW" } }),
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.review.count({ where: { isApproved: false } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, orderNumber: true, createdAt: true, shipName: true, shipCity: true, total: true, status: true, paymentStatus: true, paymentMethod: true },
    }),
    prisma.serviceBooking.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { plan: { select: { name: true } } } }),
    getSettings(),
  ]);

  const lowStock = lowIds.length
    ? await prisma.product.findMany({
        where: { id: { in: lowIds } },
        orderBy: { stock: "asc" },
        select: { id: true, name: true, sku: true, stock: true, lowStockAlert: true, images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 } },
      })
    : [];

  const hour = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()));
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">{formatDate(new Date())}</p>
          <h1 className="mt-1 text-2xl font-semibold">
            {greeting}, {admin.name.split(" ")[0]}
          </h1>
        </div>
        {(toShip > 0 || newBookings > 0 || pendingReviews > 0) && (
          <p className="text-sm text-muted">
            {toShip > 0 && (
              <Link href="/admin/orders?view=to-ship" className="font-semibold text-ink underline decoration-brand decoration-2 underline-offset-4">
                {toShip} order{toShip === 1 ? "" : "s"} to ship
              </Link>
            )}
            {toShip > 0 && newBookings > 0 && " · "}
            {newBookings > 0 && (
              <Link href="/admin/services?status=NEW" className="font-semibold text-ink underline decoration-brand decoration-2 underline-offset-4">
                {newBookings} new booking{newBookings === 1 ? "" : "s"}
              </Link>
            )}
            {(toShip > 0 || newBookings > 0) && pendingReviews > 0 && " · "}
            {pendingReviews > 0 && (
              <Link href="/admin/reviews" className="font-semibold text-ink underline decoration-brand decoration-2 underline-offset-4">
                {pendingReviews} review{pendingReviews === 1 ? "" : "s"} to moderate
              </Link>
            )}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue today" value={wholeINR(todayStats.revenue)} hint={`${todayStats.orders} order${todayStats.orders === 1 ? "" : "s"}`} icon={<IndianRupee className="size-4" />} tone="brand" href="/admin/analytics?range=7" />
        <StatCard label="Revenue · last 30 days" value={wholeINR(monthStats.revenue)} hint="Paid + live COD orders" icon={<TrendingUp className="size-4" />} href="/admin/analytics" />
        <StatCard label="Orders · last 30 days" value={monthStats.orders} hint={`${todayStats.orders} today`} icon={<ShoppingBag className="size-4" />} href="/admin/orders" />
        <StatCard label="Average order value" value={wholeINR(monthStats.aov)} hint="Last 30 days" icon={<ReceiptText className="size-4" />} href="/admin/analytics" />
        <StatCard
          label="Ready to ship"
          value={toShip}
          hint={pendingPayment ? `${pendingPayment} awaiting payment` : "Confirmed & packed orders"}
          icon={<Truck className="size-4" />}
          tone={toShip ? "warning" : "default"}
          href="/admin/orders?view=to-ship"
        />
        <StatCard label="Low stock" value={lowCount} hint="At or below alert level" icon={<AlertTriangle className="size-4" />} tone={lowCount ? "danger" : "default"} href="/admin/inventory?stock=low" />
        <StatCard label="New service bookings" value={newBookings} hint="Awaiting confirmation" icon={<CalendarCheck className="size-4" />} tone={newBookings ? "warning" : "default"} href="/admin/services?status=NEW" />
        <StatCard label="Unread messages" value={unread} hint="Contact form" icon={<Inbox className="size-4" />} href="/admin/messages" />
      </div>

      <Panel title="Revenue · last 14 days" actions={<ViewAll href="/admin/analytics" label="Analytics" />} className="mt-6">
        <ColumnChart
          label="Revenue per day, last 14 days"
          height={160}
          format={(v) => (v >= 100000 ? `₹${Math.round(v / 100000)}k` : `₹${Math.round(v / 100)}`)}
          data={trend.map((d) => {
            const date = new Date(`${d.day}T00:00:00Z`);
            return {
              key: d.day,
              label: date.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }),
              value: d.revenue,
              detail: `${d.orders} order${d.orders === 1 ? "" : "s"}`,
            };
          })}
        />
      </Panel>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel title="Recent orders" actions={<ViewAll href="/admin/orders" />} flush>
          <Table minWidth={620}>
            <THead>
              <Th>Order</Th>
              <Th>Customer</Th>
              <Th align="right">Total</Th>
              <Th>Payment</Th>
              <Th>Status</Th>
            </THead>
            <TBody>
              {recentOrders.length === 0 && <EmptyRow colSpan={5}>No orders yet.</EmptyRow>}
              {recentOrders.map((o) => (
                <Tr key={o.id}>
                  <Td>
                    <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:underline">
                      {o.orderNumber}
                    </Link>
                    <span className="block text-xs text-muted">{formatDateTime(o.createdAt)}</span>
                  </Td>
                  <Td>
                    {o.shipName}
                    <span className="block text-xs text-muted">{o.shipCity}</span>
                  </Td>
                  <Td align="right">
                    <Money paise={o.total} className="font-medium" />
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
          <Panel title="Low stock" actions={<ViewAll href="/admin/inventory?stock=low" />} flush>
            {lowStock.length === 0 ? (
              <p className="flex items-center gap-2 px-5 py-6 text-sm text-muted">
                <PackageCheck className="size-4 text-success" /> All products are above their alert levels.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {lowStock.map((p) => (
                  <li key={p.id}>
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-mist/50">
                      <Thumb src={p.images[0]?.url} size={32} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{p.name}</span>
                        <span className="font-mono text-[11px] text-muted">{p.sku}</span>
                      </span>
                      <StockBadge stock={p.stock} alert={p.lowStockAlert} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Recent bookings" actions={<ViewAll href="/admin/services" />} flush>
            {bookings.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted">No car cleaning bookings yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {bookings.map((b) => (
                  <li key={b.id}>
                    <Link href={`/admin/services/bookings/${b.id}`} className="flex items-start gap-3 px-5 py-2.5 hover:bg-mist/50">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {b.name} · {b.carModel}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {b.plan?.name ?? serviceName(settings, b.serviceType)} · from {formatDate(b.preferredDate)}
                        </span>
                      </span>
                      <BookingStatusBadge status={b.status} />
                    </Link>
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
