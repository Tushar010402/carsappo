import "server-only";
import { after } from "next/server";
import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { financialYear } from "@/lib/gst";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import { BRAND, adminEmail, orderConfirmationEmail, sendMail, simpleEmail, statusUpdateEmail } from "@/lib/mailer";
import { formatINR } from "@/lib/format";
import { absoluteUrl } from "@/lib/utils";

type Tx = Prisma.TransactionClient;

export async function nextSequence(key: string, tx: Tx | typeof prisma = prisma) {
  const counter = await tx.counter.upsert({
    where: { key },
    create: { key, value: 1 },
    update: { value: { increment: 1 } },
  });
  return counter.value;
}

export async function generateOrderNumber(tx: Tx | typeof prisma = prisma) {
  const n = await nextSequence("order", tx);
  return `CS${100000 + n}`;
}

async function generateInvoiceNumber(tx: Tx, date = new Date()) {
  const fy = financialYear(date);
  const n = await nextSequence(`invoice-${fy}`, tx);
  return `CS/${fy}/${String(n).padStart(5, "0")}`;
}

export async function generateBookingNumber() {
  const n = await nextSequence("booking");
  return `CB${10000 + n}`;
}

/** Only run side effects (email) after the response is sent; falls back to fire-and-forget outside a request. */
function defer(task: () => Promise<unknown>) {
  try {
    after(task);
  } catch {
    void task().catch((e) => console.error(e));
  }
}

/**
 * Confirms an order after successful payment (or immediately for COD). Idempotent:
 * safe to call from both the checkout callback and the Razorpay webhook.
 */
export async function confirmOrder(orderId: string, opts: { razorpayPaymentId?: string; paid?: boolean } = {}) {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new Error("Order not found");
    if (order.status === "CANCELLED") return { order, changed: false };

    // Claim the stock commit exactly once.
    const claim = await tx.order.updateMany({ where: { id: orderId, stockCommitted: false }, data: { stockCommitted: true } });
    const firstConfirmation = claim.count === 1;

    if (firstConfirmation) {
      for (const item of order.items) {
        if (!item.productId) continue;
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity }, salesCount: { increment: item.quantity } },
        });
      }
      if (order.couponCode) {
        const coupon = await tx.coupon.findUnique({ where: { code: order.couponCode } });
        if (coupon) {
          await tx.couponUsage.create({ data: { couponId: coupon.id, userId: order.userId, email: order.email, orderId: order.id } });
          await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
        }
      }
    }

    const data: Prisma.OrderUpdateInput = {};
    if (opts.paid) {
      data.paymentStatus = "PAID";
      if (opts.razorpayPaymentId) data.razorpayPaymentId = opts.razorpayPaymentId;
    }
    if (order.status === "PENDING") data.status = "CONFIRMED";
    if (!order.invoiceNumber) {
      data.invoiceNumber = await generateInvoiceNumber(tx);
      data.invoiceDate = new Date();
    }
    const updated = await tx.order.update({ where: { id: orderId }, data, include: { items: true } });
    if (order.status === "PENDING") {
      await tx.orderEvent.create({
        data: {
          orderId,
          status: "CONFIRMED",
          note: order.paymentMethod === "COD" ? "Order placed with Cash on Delivery" : "Payment received",
        },
      });
    }
    return { order: updated, changed: firstConfirmation };
  });

  if (result.changed) {
    const o = result.order;
    if (o.userId) {
      await prisma.notification.create({
        data: {
          userId: o.userId,
          title: `Order ${o.orderNumber} confirmed`,
          body: `We've received your order of ${formatINR(o.total)}. We'll notify you when it ships.`,
          link: `/account/orders/${o.orderNumber}`,
        },
      });
    }
    defer(() => sendMail({ to: o.email, subject: `Order ${o.orderNumber} confirmed — ${BRAND}`, html: orderConfirmationEmail(o) }));
    const admin = adminEmail();
    if (admin) {
      defer(() =>
        sendMail({
          to: admin,
          subject: `New order ${o.orderNumber} · ${formatINR(o.total)}`,
          html: simpleEmail(`New order ${o.orderNumber}`, [`${o.shipName} · ${o.shipCity}, ${o.shipState}`, `${o.paymentMethod} · ${formatINR(o.total)}`], {
            label: "Open in admin",
            href: absoluteUrl(`/admin/orders/${o.id}`),
          }),
        }),
      );
    }
  }
  return result.order;
}

const CUSTOMER_MESSAGES: Partial<Record<OrderStatus, (n: string) => { title: string; body: string }>> = {
  PROCESSING: (n) => ({ title: `Order ${n} is packed`, body: "Your order has been quality checked and packed. It will ship soon." }),
  SHIPPED: (n) => ({ title: `Order ${n} has shipped`, body: "Your order is on its way. Track it from your account." }),
  OUT_FOR_DELIVERY: (n) => ({ title: `Order ${n} is out for delivery`, body: "Our courier partner will deliver your order today." }),
  DELIVERED: (n) => ({ title: `Order ${n} delivered`, body: "Enjoy your purchase! Share a review to help other car owners." }),
  CANCELLED: (n) => ({ title: `Order ${n} cancelled`, body: "Your order has been cancelled. Any payment made will be refunded to the original method." }),
  RETURNED: (n) => ({ title: `Order ${n} returned`, body: "Your return has been received." }),
};

/** Moves an order to a new status with a timeline event, restocking and customer notifications. */
export async function setOrderStatus(orderId: string, status: OrderStatus, note?: string | null, opts: { notify?: boolean } = {}) {
  const notify = opts.notify ?? true;
  const order = await prisma.$transaction(async (tx) => {
    const current = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!current) throw new Error("Order not found");
    if (current.status === status) return null;

    if ((status === "CANCELLED" || status === "RETURNED") && current.stockCommitted) {
      const release = await tx.order.updateMany({ where: { id: orderId, stockCommitted: true }, data: { stockCommitted: false } });
      if (release.count === 1) {
        for (const item of current.items) {
          if (!item.productId) continue;
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity }, salesCount: { decrement: item.quantity } },
          });
        }
      }
    }

    const updated = await tx.order.update({ where: { id: orderId }, data: { status } });
    await tx.orderEvent.create({ data: { orderId, status, note: note || ORDER_STATUS_LABEL[status] } });
    return updated;
  });

  if (order && notify) {
    const msg = CUSTOMER_MESSAGES[status]?.(order.orderNumber);
    if (msg) {
      if (order.userId) {
        await prisma.notification.create({
          data: { userId: order.userId, title: msg.title, body: msg.body, link: `/account/orders/${order.orderNumber}` },
        });
      }
      defer(() => sendMail({ to: order.email, subject: `${msg.title} — ${BRAND}`, html: statusUpdateEmail(order, msg.title, msg.body) }));
    }
  }
  return order;
}

/** Customers can cancel until the order is being packed; after that they contact support. */
export function canCustomerCancel(status: OrderStatus) {
  return status === "PENDING" || status === "CONFIRMED";
}

export const orderWithDetails = {
  items: { include: { product: { select: { slug: true } } } },
  events: { orderBy: { createdAt: "asc" } },
  returnRequests: { orderBy: { createdAt: "desc" } },
} satisfies Prisma.OrderInclude;

/** Whether a delivered order is still inside the return window. */
export function isWithinReturnWindow(deliveredAt: Date | undefined, windowDays: number) {
  return !!deliveredAt && Date.now() - deliveredAt.getTime() < windowDays * 864e5;
}
