"use server";

import { z } from "zod";
import type { OrderStatus } from "@prisma/client";
import { assertAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { confirmOrder, setOrderStatus } from "@/lib/orders";
import { razorpayEnabled, refundRazorpayPayment } from "@/lib/razorpay";
import {
  assignAwb,
  cancelShiprocketOrder,
  createShiprocketOrder,
  generateLabel,
  mapShiprocketStatus,
  requestPickup,
  shiprocketEnabled,
  trackAwb,
} from "@/lib/shiprocket";
import { getSettings } from "@/lib/settings";
import { formatINR, rupeesToPaise } from "@/lib/format";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import { sendMail, simpleEmail } from "@/lib/mailer";
import { absoluteUrl } from "@/lib/utils";
import { checkbox, formObject, idSchema, linkField, optionalDate, optionalText } from "@/lib/admin/form";
import { appendNote, dbError, done, failed, invalid, revalidateAdmin, revalidateStore } from "@/lib/admin/server";
import type { ActionState } from "@/lib/admin/types";

const STATUSES = Object.keys(ORDER_STATUS_LABEL) as [OrderStatus, ...OrderStatus[]];

function refreshOrder(order: { id: string; orderNumber: string }) {
  revalidateAdmin();
  revalidateStore(`/order/${order.orderNumber}`, `/account/orders/${order.orderNumber}`, `/invoice/${order.orderNumber}`);
}

async function loadOrder(id: string) {
  return prisma.order.findUnique({ where: { id: idSchema.parse(id) }, include: { items: true } });
}

const statusSchema = z.object({
  orderId: idSchema,
  status: z.enum(STATUSES),
  note: optionalText(500),
  notify: checkbox,
});

export async function updateOrderStatus(_: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await assertAdmin();
  const parsed = statusSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { orderId, status, note, notify } = parsed.data;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return failed("Order not found");
  if (order.status === status) return failed(`Order is already ${ORDER_STATUS_LABEL[status].toLowerCase()}`);
  if (status === "PENDING") return failed("Orders can't be moved back to awaiting payment");

  try {
    // Leaving PENDING (unpaid) for a live status must go through confirmOrder so stock and the invoice number are committed.
    if (order.status === "PENDING" && status !== "CANCELLED") {
      await confirmOrder(orderId);
      await prisma.order.update({ where: { id: orderId }, data: { adminNote: appendNote(order.adminNote, `Confirmed manually by ${admin.name} before payment was received`) } });
    }
    if (status !== "CONFIRMED" || order.status !== "PENDING") {
      await setOrderStatus(orderId, status, note ?? undefined, { notify });
    }
    refreshOrder(order);
    return done(`Order marked ${ORDER_STATUS_LABEL[status].toLowerCase()}${notify ? " · customer notified" : ""}`);
  } catch (err) {
    return dbError(err, "Could not update the order status");
  }
}

export async function saveAdminNote(_: ActionState, formData: FormData): Promise<ActionState> {
  await assertAdmin();
  const parsed = z.object({ orderId: idSchema, adminNote: optionalText(5000) }).safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  try {
    const order = await prisma.order.update({ where: { id: parsed.data.orderId }, data: { adminNote: parsed.data.adminNote } });
    refreshOrder(order);
    return done("Note saved");
  } catch (err) {
    return dbError(err);
  }
}

export async function markCodPaid(orderId: string): Promise<ActionState> {
  const admin = await assertAdmin();
  const order = await loadOrder(orderId);
  if (!order) return failed("Order not found");
  if (order.paymentMethod !== "COD") return failed("Only Cash on Delivery orders can be marked paid here");
  if (order.paymentStatus === "PAID") return failed("Payment is already marked as received");
  if (order.status === "CANCELLED") return failed("This order is cancelled");
  try {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: "PAID", adminNote: appendNote(order.adminNote, `COD payment of ${formatINR(order.total)} marked received by ${admin.name}`) },
    });
    refreshOrder(order);
    return done("COD payment marked as received");
  } catch (err) {
    return dbError(err);
  }
}

/** For online orders stuck at "awaiting payment" after the admin verified the payment in the Razorpay dashboard. */
export async function markOnlinePaid(orderId: string): Promise<ActionState> {
  const admin = await assertAdmin();
  const order = await loadOrder(orderId);
  if (!order) return failed("Order not found");
  if (order.paymentMethod !== "RAZORPAY") return failed("Not an online payment order");
  if (order.paymentStatus === "PAID") return failed("Order is already paid");
  if (order.status === "CANCELLED") return failed("This order is cancelled");
  try {
    await confirmOrder(order.id, { paid: true });
    await prisma.order.update({ where: { id: order.id }, data: { adminNote: appendNote(order.adminNote, `Payment marked received manually by ${admin.name}`) } });
    refreshOrder(order);
    return done("Payment recorded and order confirmed");
  } catch (err) {
    return dbError(err);
  }
}

const refundSchema = z.object({
  orderId: idSchema,
  amount: z.preprocess((v) => (v === "" || v === undefined ? null : v), z.coerce.number().positive("Enter a positive amount").nullable()),
  reason: optionalText(300),
  manual: checkbox,
});

export async function refundOrder(_: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await assertAdmin();
  const parsed = refundSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { orderId, reason, manual } = parsed.data;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return failed("Order not found");
  if (order.paymentStatus !== "PAID") return failed("Only paid orders can be refunded");

  const remaining = order.total - order.refundedAmount;
  if (remaining <= 0) return failed("This order has already been fully refunded");
  const amount = parsed.data.amount === null ? remaining : rupeesToPaise(parsed.data.amount);
  if (amount > remaining) return failed(`Refund can't exceed the refundable balance (${formatINR(remaining)})`, { amount: "Too high" });
  const full = order.refundedAmount + amount >= order.total;

  let reference = "manual";
  if (!manual) {
    if (order.paymentMethod !== "RAZORPAY" || !order.razorpayPaymentId) {
      return failed("No Razorpay payment on this order. Refund the customer directly, then tick “Record only”.");
    }
    if (!razorpayEnabled()) return failed("Razorpay is not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)");
    try {
      // Omitting the amount refunds the whole payment; only do that when nothing was refunded before.
      const refund = await refundRazorpayPayment(order.razorpayPaymentId, amount === order.total ? undefined : amount);
      reference = refund.id;
    } catch (err) {
      return failed(`Razorpay refund failed: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  const line = `${full ? "Full" : "Partial"} refund of ${formatINR(amount)} ${manual ? "recorded (issued outside Razorpay)" : `via Razorpay (${reference})`} by ${admin.name}${reason ? ` — ${reason}` : ""}`;
  await prisma.order.update({
    where: { id: order.id },
    data: {
      ...(full ? { paymentStatus: "REFUNDED" as const } : {}),
      refundedAmount: { increment: amount },
      adminNote: appendNote(order.adminNote, line),
    },
  });
  if (order.userId) {
    await prisma.notification.create({
      data: {
        userId: order.userId,
        title: `Refund of ${formatINR(amount)} initiated`,
        body: `We've initiated a refund for order ${order.orderNumber}. It usually reaches your account in 5–7 working days.`,
        link: `/account/orders/${order.orderNumber}`,
      },
    });
  }
  await sendMail({
    to: order.email,
    subject: `Refund initiated for order ${order.orderNumber} — Carsappo`,
    html: simpleEmail(
      "Your refund is on its way",
      [`We've initiated a refund of ${formatINR(amount)} for order ${order.orderNumber}.`, "Refunds usually reach the original payment method in 5–7 working days."],
      { label: "View order", href: absoluteUrl(`/order/${order.orderNumber}?t=${order.accessToken}`) },
    ),
  }).catch((e) => console.error("[refund mail]", e));

  refreshOrder(order);
  return done(`${full ? "Full" : "Partial"} refund of ${formatINR(amount)} ${manual ? "recorded" : "initiated"}`);
}

// ───────────────────────── Shipping ─────────────────────────

const manualShippingSchema = z.object({
  orderId: idSchema,
  courierName: optionalText(80),
  awbCode: optionalText(60),
  trackingUrl: linkField(500),
  estimatedDelivery: optionalDate,
  markShipped: checkbox,
});

export async function saveShippingDetails(_: ActionState, formData: FormData): Promise<ActionState> {
  await assertAdmin();
  const parsed = manualShippingSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { orderId, markShipped, ...data } = parsed.data;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return failed("Order not found");
  if (markShipped && !data.awbCode) return failed("Enter the AWB / tracking number before marking as shipped", { awbCode: "Required to ship" });
  try {
    await prisma.order.update({ where: { id: orderId }, data });
    if (markShipped && ["CONFIRMED", "PROCESSING"].includes(order.status)) {
      await setOrderStatus(orderId, "SHIPPED", `Shipped via ${data.courierName || "courier"} · AWB ${data.awbCode}`, { notify: true });
    }
    refreshOrder(order);
    return done(markShipped ? "Shipping saved and order marked shipped" : "Shipping details saved");
  } catch (err) {
    return dbError(err);
  }
}

function packageDims(items: { quantity: number; product: { weightGrams: number; lengthCm: number; breadthCm: number; heightCm: number } | null }[]) {
  let weightGrams = 0;
  let lengthCm = 10;
  let breadthCm = 10;
  let heightCm = 0;
  for (const item of items) {
    const p = item.product ?? { weightGrams: 500, lengthCm: 20, breadthCm: 15, heightCm: 10 };
    weightGrams += p.weightGrams * item.quantity;
    lengthCm = Math.max(lengthCm, p.lengthCm);
    breadthCm = Math.max(breadthCm, p.breadthCm);
    heightCm += p.heightCm * item.quantity;
  }
  return { weightGrams: Math.max(weightGrams, 100), lengthCm, breadthCm, heightCm: Math.min(Math.max(heightCm, 5), 150) };
}

function requireShiprocket(): ActionState | null {
  return shiprocketEnabled() ? null : failed("Shiprocket is not configured. Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD.");
}

export async function createShipment(orderId: string): Promise<ActionState> {
  await assertAdmin();
  const blocked = requireShiprocket();
  if (blocked) return blocked;
  const order = await prisma.order.findUnique({
    where: { id: idSchema.parse(orderId) },
    include: { items: { include: { product: { select: { weightGrams: true, lengthCm: true, breadthCm: true, heightCm: true } } } } },
  });
  if (!order) return failed("Order not found");
  if (order.shiprocketOrderId) return failed("A Shiprocket shipment already exists for this order");
  if (["PENDING", "CANCELLED", "RETURNED"].includes(order.status)) return failed("Only confirmed orders can be shipped");
  try {
    const { shipping } = await getSettings();
    const res = await createShiprocketOrder(order, shipping.shiprocketPickupLocation || "Primary", packageDims(order.items));
    await prisma.order.update({
      where: { id: order.id },
      data: {
        shiprocketOrderId: String(res.order_id),
        shipmentId: res.shipment_id ? String(res.shipment_id) : null,
        ...(res.awb_code ? { awbCode: res.awb_code, courierName: res.courier_name ?? null, trackingUrl: `https://shiprocket.co/tracking/${res.awb_code}` } : {}),
      },
    });
    refreshOrder(order);
    return done(`Shiprocket order ${res.order_id} created`);
  } catch (err) {
    return failed(`Shiprocket: ${err instanceof Error ? err.message : "request failed"}`);
  }
}

export async function assignShipmentAwb(orderId: string): Promise<ActionState> {
  await assertAdmin();
  const blocked = requireShiprocket();
  if (blocked) return blocked;
  const order = await loadOrder(orderId);
  if (!order?.shipmentId) return failed("Create the Shiprocket shipment first");
  try {
    const { awbCode, courierName } = await assignAwb(order.shipmentId);
    await prisma.order.update({ where: { id: order.id }, data: { awbCode, courierName, trackingUrl: `https://shiprocket.co/tracking/${awbCode}` } });
    refreshOrder(order);
    return done(`AWB ${awbCode} assigned${courierName ? ` (${courierName})` : ""}. Mark the order shipped when it's handed over.`);
  } catch (err) {
    return failed(`Shiprocket: ${err instanceof Error ? err.message : "request failed"}`);
  }
}

export async function requestShipmentPickup(orderId: string): Promise<ActionState> {
  await assertAdmin();
  const blocked = requireShiprocket();
  if (blocked) return blocked;
  const order = await loadOrder(orderId);
  if (!order?.shipmentId || !order.awbCode) return failed("Assign an AWB before requesting pickup");
  try {
    await requestPickup(order.shipmentId);
    await prisma.order.update({ where: { id: order.id }, data: { adminNote: appendNote(order.adminNote, "Shiprocket pickup requested") } });
    refreshOrder(order);
    return done("Pickup requested");
  } catch (err) {
    return failed(`Shiprocket: ${err instanceof Error ? err.message : "request failed"}`);
  }
}

export async function generateShipmentLabel(orderId: string): Promise<ActionState> {
  await assertAdmin();
  const blocked = requireShiprocket();
  if (blocked) return blocked;
  const order = await loadOrder(orderId);
  if (!order?.shipmentId || !order.awbCode) return failed("Assign an AWB before generating the label");
  try {
    const labelUrl = await generateLabel(order.shipmentId);
    await prisma.order.update({ where: { id: order.id }, data: { labelUrl } });
    refreshOrder(order);
    return done("Shipping label ready");
  } catch (err) {
    return failed(`Shiprocket: ${err instanceof Error ? err.message : "request failed"}`);
  }
}

export async function syncShipmentTracking(orderId: string): Promise<ActionState> {
  await assertAdmin();
  const blocked = requireShiprocket();
  if (blocked) return blocked;
  const order = await loadOrder(orderId);
  if (!order?.awbCode) return failed("No AWB on this order yet");
  try {
    const t = await trackAwb(order.awbCode);
    const mapped = mapShiprocketStatus(t.currentStatus);
    const etd = t.etd ? new Date(t.etd) : null;
    await prisma.order.update({
      where: { id: order.id },
      data: {
        ...(t.trackUrl ? { trackingUrl: t.trackUrl } : {}),
        ...(etd && !Number.isNaN(etd.getTime()) ? { estimatedDelivery: etd } : {}),
      },
    });
    let changed = false;
    if (mapped && mapped !== order.status) {
      await setOrderStatus(order.id, mapped, `Courier update: ${t.currentStatus}`, { notify: true });
      changed = true;
    }
    refreshOrder(order);
    return done(t.currentStatus ? `Courier status: ${t.currentStatus}${changed ? ` → order ${ORDER_STATUS_LABEL[mapped!].toLowerCase()}` : ""}` : "No tracking updates yet");
  } catch (err) {
    return failed(`Shiprocket: ${err instanceof Error ? err.message : "request failed"}`);
  }
}

export async function cancelShipment(orderId: string): Promise<ActionState> {
  await assertAdmin();
  const blocked = requireShiprocket();
  if (blocked) return blocked;
  const order = await loadOrder(orderId);
  if (!order?.shiprocketOrderId) return failed("No Shiprocket shipment on this order");
  try {
    await cancelShiprocketOrder(order.shiprocketOrderId);
    await prisma.order.update({
      where: { id: order.id },
      data: {
        shiprocketOrderId: null,
        shipmentId: null,
        awbCode: null,
        courierName: null,
        trackingUrl: null,
        labelUrl: null,
        adminNote: appendNote(order.adminNote, `Shiprocket shipment ${order.shiprocketOrderId} cancelled`),
      },
    });
    refreshOrder(order);
    return done("Shiprocket shipment cancelled");
  } catch (err) {
    return failed(`Shiprocket: ${err instanceof Error ? err.message : "request failed"}`);
  }
}
