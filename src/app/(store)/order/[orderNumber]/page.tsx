import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, FileText, Package } from "lucide-react";
import { getAccessibleOrder } from "@/lib/order-access";
import { getCurrentUser } from "@/lib/auth";
import { razorpayEnabled } from "@/lib/razorpay";
import { formatDate, formatDateTime, formatINR } from "@/lib/format";
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/constants";
import { firstParam } from "@/lib/utils";
import { OrderHistory, OrderProgress } from "@/components/order/timeline";
import { OrderItems, OrderTotals, ShippingAddress } from "@/components/order/summary";
import { ShipmentTracking } from "@/components/order/tracking";
import { canCustomerCancel } from "@/lib/orders";
import { CancelOrderButton, PayNowButton } from "@/components/order/actions";
import { PurchaseTracker } from "@/components/order/purchase-tracker";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

export default async function OrderPage({ params, searchParams }: PageProps<"/order/[orderNumber]">) {
  const { orderNumber } = await params;
  const sp = await searchParams;
  const token = firstParam(sp.t);
  const order = await getAccessibleOrder(orderNumber, token);
  if (!order) notFound();
  const user = await getCurrentUser();

  const placed = firstParam(sp.placed) === "1";
  const confirmed = order.status !== "PENDING" && order.status !== "CANCELLED";
  const awaitingPayment = order.status === "PENDING" && order.paymentMethod === "RAZORPAY";
  const invoiceHref = `/invoice/${order.orderNumber}`;

  return (
    <div className="container-x max-w-5xl py-10 sm:py-14">
      {placed && confirmed && (
        <PurchaseTracker
          orderNumber={order.orderNumber}
          total={order.total}
          items={order.items.map((i) => ({ id: i.productId ?? i.sku, name: i.name, price: i.price, quantity: i.quantity }))}
        />
      )}

      <div className="rounded-[28px] bg-ink p-7 text-white sm:p-10">
        {awaitingPayment ? (
          <Clock className="size-10 text-brand" />
        ) : order.status === "CANCELLED" ? (
          <Package className="size-10 text-zinc-400" />
        ) : (
          <CheckCircle2 className="size-10 text-brand" />
        )}
        <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">
          {awaitingPayment
            ? "Almost there — complete your payment"
            : order.status === "CANCELLED"
              ? "This order was cancelled"
              : placed
                ? `Thank you, ${order.shipName.split(" ")[0]}! Your order is confirmed.`
                : `Order ${order.orderNumber}`}
        </h1>
        <p className="mt-3 text-zinc-400">
          Order <b className="text-white">{order.orderNumber}</b> · placed {formatDateTime(order.createdAt)} · {ORDER_STATUS_LABEL[order.status]}
        </p>
        {confirmed && order.estimatedDelivery && order.status !== "DELIVERED" && (
          <p className="mt-2 text-zinc-300">
            Estimated delivery by <b className="text-brand">{formatDate(order.estimatedDelivery)}</b>
          </p>
        )}
        {placed && confirmed && <p className="mt-2 text-sm text-zinc-400">A confirmation email has been sent to {order.email}.</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          {awaitingPayment && razorpayEnabled() && <PayNowButton orderNumber={order.orderNumber} token={order.accessToken} amountLabel={formatINR(order.total)} />}
          {order.invoiceNumber && (
            <ButtonLink href={invoiceHref} variant="outline-light" target="_blank">
              <FileText className="size-4" /> Download invoice
            </ButtonLink>
          )}
          <ButtonLink href="/shop" variant="outline-light">
            Continue shopping
          </ButtonLink>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <section className="rounded-[28px] border border-line p-6">
            <h2 className="mb-6 font-semibold">Order status</h2>
            <OrderProgress status={order.status} events={order.events} />
          </section>
          <ShipmentTracking order={order} />
          <section className="rounded-[28px] border border-line p-6">
            <h2 className="font-semibold">Items</h2>
            <OrderItems order={order} />
            <div className="border-t border-line pt-4">
              <OrderTotals order={order} />
            </div>
          </section>
        </div>
        <aside className="space-y-6">
          <section className="rounded-[28px] border border-line p-6">
            <h2 className="mb-3 font-semibold">Delivery address</h2>
            <ShippingAddress order={order} />
          </section>
          <section className="rounded-[28px] border border-line p-6 text-sm">
            <h2 className="mb-3 font-semibold">Payment</h2>
            <p>{order.paymentMethod === "COD" ? "Cash on Delivery" : "Online (Razorpay)"}</p>
            <p className="text-muted">Status: {PAYMENT_STATUS_LABEL[order.paymentStatus]}</p>
            {order.invoiceNumber && <p className="mt-2 text-muted">Invoice {order.invoiceNumber}</p>}
          </section>
          <section className="rounded-[28px] border border-line p-6">
            <h2 className="mb-4 font-semibold">History</h2>
            <OrderHistory events={order.events} />
          </section>
          {canCustomerCancel(order.status) && (
            <CancelOrderButton orderNumber={order.orderNumber} token={token ?? undefined} />
          )}
          {!user && (
            <div className="rounded-[28px] bg-brand-soft p-6 text-sm">
              <p className="font-semibold">Track all your orders in one place</p>
              <p className="mt-1 text-muted">Create an account with {order.email} and this order will appear in your dashboard.</p>
              <Link href={`/register?email=${encodeURIComponent(order.email)}`} className="mt-3 inline-block font-semibold underline">
                Create account
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
