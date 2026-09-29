import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getAccessibleOrder } from "@/lib/order-access";
import { getSettings } from "@/lib/settings";
import { razorpayEnabled } from "@/lib/razorpay";
import { isWithinReturnWindow } from "@/lib/orders";
import { formatDate, formatDateTime, formatINR } from "@/lib/format";
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL, RETURN_STATUS_LABEL } from "@/lib/constants";
import { OrderHistory, OrderProgress } from "@/components/order/timeline";
import { OrderItems, OrderTotals, ShippingAddress } from "@/components/order/summary";
import { ShipmentTracking } from "@/components/order/tracking";
import { CancelOrderButton, PayNowButton, ReturnRequestForm } from "@/components/order/actions";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { statusTone } from "@/components/account/order-list";

export async function generateMetadata({ params }: PageProps<"/account/orders/[orderNumber]">): Promise<Metadata> {
  return { title: `Order ${(await params).orderNumber}` };
}

export default async function AccountOrderPage({ params }: PageProps<"/account/orders/[orderNumber]">) {
  const { orderNumber } = await params;
  const user = await requireUser(`/account/orders/${orderNumber}`);
  const order = await getAccessibleOrder(orderNumber);
  if (!order || order.userId !== user.id) notFound();
  const { shipping } = await getSettings();

  const deliveredAt = order.events.filter((e) => e.status === "DELIVERED").at(-1)?.createdAt;
  const returnOpen =
    order.status === "DELIVERED" &&
    isWithinReturnWindow(deliveredAt, shipping.returnWindowDays) &&
    !order.returnRequests.some((r) => r.status !== "REJECTED");

  return (
    <div className="space-y-6">
      <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> All orders
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-3xl font-semibold">
            {order.orderNumber} <Badge tone={statusTone(order.status)}>{ORDER_STATUS_LABEL[order.status]}</Badge>
          </h1>
          <p className="mt-1 text-sm text-muted">
            Placed {formatDateTime(order.createdAt)}
            {order.estimatedDelivery && !["DELIVERED", "CANCELLED", "RETURNED"].includes(order.status) && ` · Arriving by ${formatDate(order.estimatedDelivery)}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {order.invoiceNumber && (
            <ButtonLink href={`/invoice/${order.orderNumber}`} target="_blank" variant="outline" size="sm">
              <FileText className="size-4" /> Invoice
            </ButtonLink>
          )}
          {(order.status === "PENDING" || order.status === "CONFIRMED") && <CancelOrderButton orderNumber={order.orderNumber} />}
        </div>
      </div>

      {order.status === "PENDING" && order.paymentMethod === "RAZORPAY" && razorpayEnabled() && (
        <div className="rounded-2xl bg-amber-50 p-5">
          <p className="mb-3 text-sm text-amber-900">Payment for this order is pending.</p>
          <PayNowButton orderNumber={order.orderNumber} token={order.accessToken} amountLabel={formatINR(order.total)} />
        </div>
      )}

      <section className="rounded-[28px] border border-line p-6">
        <OrderProgress status={order.status} events={order.events} />
      </section>
      <ShipmentTracking order={order} />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <section className="rounded-[28px] border border-line p-6">
          <h2 className="font-semibold">Items</h2>
          <OrderItems order={order} />
          <div className="border-t border-line pt-4">
            <OrderTotals order={order} />
          </div>
        </section>
        <div className="space-y-6">
          <section className="rounded-[28px] border border-line p-6">
            <h2 className="mb-3 font-semibold">Delivery address</h2>
            <ShippingAddress order={order} />
          </section>
          <section className="rounded-[28px] border border-line p-6 text-sm">
            <h2 className="mb-2 font-semibold">Payment</h2>
            <p>{order.paymentMethod === "COD" ? "Cash on Delivery" : "Online (Razorpay)"} · {PAYMENT_STATUS_LABEL[order.paymentStatus]}</p>
          </section>
          <section className="rounded-[28px] border border-line p-6">
            <h2 className="mb-4 font-semibold">History</h2>
            <OrderHistory events={order.events} />
          </section>
        </div>
      </div>

      {order.returnRequests.length > 0 && (
        <section className="rounded-[28px] border border-line p-6">
          <h2 className="mb-3 font-semibold">Return request</h2>
          {order.returnRequests.map((r) => (
            <div key={r.id} className="text-sm">
              <p>
                <Badge tone="info">{RETURN_STATUS_LABEL[r.status]}</Badge> <span className="ml-2">{r.reason}</span>
              </p>
              {r.adminNote && <p className="mt-2 text-muted">Note from Carsappo: {r.adminNote}</p>}
            </div>
          ))}
        </section>
      )}
      {returnOpen && (
        <section className="rounded-[28px] border border-line p-6">
          <h2 className="mb-1 font-semibold">Need to return something?</h2>
          <p className="mb-5 text-sm text-muted">Returns are accepted within {shipping.returnWindowDays} days of delivery.</p>
          <ReturnRequestForm orderNumber={order.orderNumber} />
        </section>
      )}
    </div>
  );
}
