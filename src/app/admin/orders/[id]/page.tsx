import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, FileText, Mail, MapPin, Phone, User } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { razorpayEnabled } from "@/lib/razorpay";
import { shiprocketEnabled } from "@/lib/shiprocket";
import { ORDER_STATUS_LABEL, RETURN_STATUS_LABEL } from "@/lib/constants";
import { formatDate, formatDateTime, formatINR } from "@/lib/format";
import { PageHeader, Panel, Thumb } from "@/components/admin/ui";
import { OrderStatusBadge, PaymentBadge, ReturnStatusBadge } from "@/components/admin/status-badge";
import { AdminNotePanel, PaymentPanel, ShippingPanel, StatusPanel } from "@/components/admin/orders/order-panels";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Order" };

export default async function OrderDetailPage({ params }: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { id: true, slug: true } } } },
      events: { orderBy: [{ createdAt: "desc" }, { id: "desc" }] },
      returnRequests: { orderBy: { createdAt: "desc" } },
      user: { select: { id: true, name: true, email: true, _count: { select: { orders: true } } } },
    },
  });
  if (!order) notFound();

  const itemsTotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totals: [string, number, string?][] = [
    ["Subtotal", order.subtotal],
    ...(order.discount ? ([["Discount" + (order.couponCode ? ` (${order.couponCode})` : ""), -order.discount]] as [string, number][]) : []),
    ["Shipping", order.shippingFee],
    ...(order.codFee ? ([["COD fee", order.codFee]] as [string, number][]) : []),
  ];

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            Order {order.orderNumber}
            <OrderStatusBadge status={order.status} />
            <PaymentBadge status={order.paymentStatus} method={order.paymentMethod} />
          </span>
        }
        description={`Placed ${formatDateTime(order.createdAt)} · ${order.paymentMethod === "COD" ? "Cash on delivery" : "Online payment"}`}
        back={{ href: "/admin/orders", label: "Orders" }}
        actions={
          <>
            {order.invoiceNumber && (
              <a href={`/invoice/${order.orderNumber}?t=${order.accessToken}`} target="_blank" rel="noopener noreferrer" className={buttonClasses("outline", "sm")}>
                <FileText className="size-4" /> Invoice
              </a>
            )}
            <a href={`/order/${order.orderNumber}?t=${order.accessToken}`} target="_blank" rel="noopener noreferrer" className={buttonClasses("outline", "sm")}>
              <ExternalLink className="size-4" /> Customer view
            </a>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <Panel title={`Items (${order.items.length})`} flush>
            <ul className="divide-y divide-line">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 px-5 py-3">
                  <Thumb src={item.image} size={48} />
                  <div className="min-w-0 flex-1">
                    {item.product ? (
                      <Link href={`/admin/products/${item.product.id}`} className="font-medium hover:underline">
                        {item.name}
                      </Link>
                    ) : (
                      <span className="font-medium">{item.name}</span>
                    )}
                    <p className="text-xs text-muted">
                      <span className="font-mono">{item.sku}</span> · HSN {item.hsnCode || "—"} · GST {item.gstRate}%
                    </p>
                  </div>
                  <div className="text-right text-sm tabular-nums">
                    <p className="text-muted">
                      {formatINR(item.price)} × {item.quantity}
                    </p>
                    <p className="font-semibold">{formatINR(item.price * item.quantity)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-line bg-mist/40 px-5 py-4">
              <dl className="ml-auto max-w-xs space-y-1.5 text-sm">
                {totals.map(([label, amount]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <dt className="text-muted">{label}</dt>
                    <dd className="tabular-nums">{amount < 0 ? `−${formatINR(-amount, true)}` : formatINR(amount, true)}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-4 border-t border-line pt-2 text-base font-semibold">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatINR(order.total, true)}</dd>
                </div>
                <div className="flex justify-between gap-4 text-xs text-muted">
                  <dt>GST included</dt>
                  <dd className="tabular-nums">{formatINR(order.taxTotal, true)}</dd>
                </div>
              </dl>
              {itemsTotal !== order.subtotal && <p className="mt-2 text-right text-xs text-amber-700">Line items total {formatINR(itemsTotal)} differs from the stored subtotal.</p>}
            </div>
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Customer">
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <User className="size-4 text-muted" />
                  {order.user ? (
                    <Link href={`/admin/customers/${order.user.id}`} className="font-medium hover:underline">
                      {order.user.name}
                    </Link>
                  ) : (
                    <span className="font-medium">{order.shipName}</span>
                  )}
                  {order.user ? <Badge tone="soft">{order.user._count.orders} orders</Badge> : <Badge tone="soft">Guest</Badge>}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="size-4 text-muted" />
                  <a href={`mailto:${order.email}`} className="hover:underline">
                    {order.email}
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="size-4 text-muted" />
                  <a href={`tel:${order.phone}`} className="hover:underline">
                    {order.phone}
                  </a>
                </p>
                {order.gstin && (
                  <p className="text-xs text-muted">
                    Business GSTIN: <span className="font-mono text-ink">{order.gstin}</span>
                  </p>
                )}
              </div>
            </Panel>
            <Panel title="Shipping address">
              <address className="flex gap-2 text-sm not-italic">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted" />
                <span>
                  <b>{order.shipName}</b> · {order.shipPhone}
                  <br />
                  {order.shipLine1}
                  {order.shipLine2 && (
                    <>
                      <br />
                      {order.shipLine2}
                    </>
                  )}
                  {order.shipLandmark && (
                    <>
                      <br />
                      Landmark: {order.shipLandmark}
                    </>
                  )}
                  <br />
                  {order.shipCity}, {order.shipState} {order.shipPincode}
                </span>
              </address>
            </Panel>
          </div>

          {order.customerNote && (
            <Panel title="Customer note">
              <p className="text-sm whitespace-pre-line">{order.customerNote}</p>
            </Panel>
          )}

          {order.returnRequests.length > 0 && (
            <Panel title="Return requests" actions={<Link href="/admin/returns" className="text-sm font-medium underline-offset-4 hover:underline">Manage returns</Link>}>
              <ul className="space-y-3">
                {order.returnRequests.map((r) => (
                  <li key={r.id} className="rounded-xl border border-line p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{r.reason}</span>
                      <ReturnStatusBadge status={r.status} />
                    </div>
                    {r.details && <p className="mt-1 text-muted">{r.details}</p>}
                    <p className="mt-1 text-xs text-muted">
                      {formatDateTime(r.createdAt)} · {RETURN_STATUS_LABEL[r.status]}
                    </p>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <Panel title="Timeline">
            <ol className="relative space-y-4 border-l border-line pl-5">
              {order.events.map((e, i) => (
                <li key={e.id} className="relative">
                  <span className={`absolute top-1.5 -left-[25px] size-2.5 rounded-full ${i === 0 ? "bg-brand ring-4 ring-brand-soft" : "bg-ink"}`} />
                  <p className="text-sm font-medium">{ORDER_STATUS_LABEL[e.status]}</p>
                  {e.note && e.note !== ORDER_STATUS_LABEL[e.status] && <p className="text-sm text-muted">{e.note}</p>}
                  <p className="text-xs text-muted">{formatDateTime(e.createdAt)}</p>
                </li>
              ))}
              <li className="relative">
                <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full bg-zinc-300" />
                <p className="text-sm font-medium">Order placed</p>
                <p className="text-xs text-muted">{formatDateTime(order.createdAt)}</p>
              </li>
            </ol>
            {order.invoiceNumber && (
              <p className="mt-5 border-t border-line pt-3 text-xs text-muted">
                Invoice <b className="text-ink">{order.invoiceNumber}</b> issued {order.invoiceDate ? formatDate(order.invoiceDate) : ""}
                {order.estimatedDelivery && <> · Estimated delivery {formatDate(order.estimatedDelivery)}</>}
              </p>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <StatusPanel order={order} />
          <PaymentPanel order={order} razorpayConfigured={razorpayEnabled()} />
          <ShippingPanel order={order} shiprocketConfigured={shiprocketEnabled()} />
          <AdminNotePanel order={order} />
        </div>
      </div>
    </>
  );
}
