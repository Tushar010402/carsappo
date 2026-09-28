"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getAccessibleOrder } from "@/lib/order-access";
import { setOrderStatus } from "@/lib/orders";
import { refundRazorpayPayment, razorpayEnabled } from "@/lib/razorpay";
import { cancelShiprocketOrder, shiprocketEnabled } from "@/lib/shiprocket";
import { getSettings } from "@/lib/settings";
import { rateLimit } from "@/lib/rate-limit";
import { RETURN_REASONS } from "@/lib/constants";
import { adminEmail, sendMail, simpleEmail } from "@/lib/mailer";
import { absoluteUrl } from "@/lib/utils";
import type { FormState } from "@/lib/validators";

export async function cancelOrder(_: FormState, formData: FormData): Promise<FormState> {
  const orderNumber = String(formData.get("orderNumber") ?? "");
  const token = String(formData.get("token") ?? "") || null;
  const order = await getAccessibleOrder(orderNumber, token);
  if (!order) return { message: "Order not found." };
  if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
    return { message: "This order is already being packed or shipped. Please contact support to cancel." };
  }

  await setOrderStatus(order.id, "CANCELLED", "Cancelled by customer");

  if (order.shiprocketOrderId && shiprocketEnabled()) {
    await cancelShiprocketOrder(order.shiprocketOrderId).catch((e) => console.error("[cancel] shiprocket", e));
  }
  if (order.paymentStatus === "PAID" && order.razorpayPaymentId && razorpayEnabled()) {
    try {
      await refundRazorpayPayment(order.razorpayPaymentId);
      await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "REFUNDED" } });
      await prisma.orderEvent.create({ data: { orderId: order.id, status: "CANCELLED", note: "Refund initiated to original payment method" } });
    } catch (e) {
      console.error("[cancel] refund failed", e);
      await prisma.order.update({ where: { id: order.id }, data: { adminNote: `${order.adminNote ?? ""}\nAutomatic refund failed — refund manually.`.trim() } });
    }
  }
  revalidatePath(`/order/${order.orderNumber}`);
  revalidatePath(`/account/orders/${order.orderNumber}`);
  return { ok: true, message: "Your order has been cancelled." };
}

const returnSchema = z.object({
  orderNumber: z.string().max(20),
  reason: z.enum(RETURN_REASONS as [string, ...string[]], { error: "Choose a reason" }),
  details: z.string().trim().max(1000).optional(),
});

export async function requestReturn(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Please log in to request a return." };
  const parsed = returnSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: { reason: parsed.error.issues[0].message } };

  const order = await prisma.order.findFirst({
    where: { orderNumber: parsed.data.orderNumber, userId: user.id },
    include: { events: true, returnRequests: true },
  });
  if (!order || order.status !== "DELIVERED") return { message: "Returns can be requested only for delivered orders." };
  if (order.returnRequests.some((r) => r.status !== "REJECTED")) return { message: "A return request already exists for this order." };

  const { shipping } = await getSettings();
  const deliveredAt = order.events.filter((e) => e.status === "DELIVERED").at(-1)?.createdAt ?? order.updatedAt;
  const windowEnds = new Date(deliveredAt.getTime() + shipping.returnWindowDays * 864e5);
  if (windowEnds < new Date()) return { message: `The ${shipping.returnWindowDays}-day return window for this order has closed.` };

  await prisma.returnRequest.create({
    data: { orderId: order.id, userId: user.id, reason: parsed.data.reason, details: parsed.data.details },
  });
  await prisma.notification.create({
    data: {
      userId: user.id,
      title: `Return requested for ${order.orderNumber}`,
      body: "We'll review your request within 24 hours and arrange a pickup.",
      link: `/account/returns`,
    },
  });
  const admin = adminEmail();
  if (admin) {
    await sendMail({
      to: admin,
      subject: `Return request · ${order.orderNumber}`,
      html: simpleEmail(`Return request for ${order.orderNumber}`, [parsed.data.reason, parsed.data.details ?? ""], {
        label: "Review in admin",
        href: absoluteUrl(`/admin/returns`),
      }),
    });
  }
  revalidatePath(`/account/orders/${order.orderNumber}`);
  return { ok: true, message: "Return requested. We'll contact you within 24 hours to arrange a pickup." };
}

export async function lookupOrder(_: FormState, formData: FormData): Promise<FormState> {
  if (!(await rateLimit("track", 10, 10 * 60 * 1000)).ok) return { message: "Too many attempts. Please try again later." };
  const orderNumber = String(formData.get("orderNumber") ?? "").trim().toUpperCase();
  const contact = String(formData.get("contact") ?? "").trim().toLowerCase();
  if (!orderNumber || !contact) return { message: "Enter your order number and email or phone." };
  const order = await prisma.order.findUnique({ where: { orderNumber } });
  const phoneDigits = contact.replace(/\D/g, "").slice(-10);
  const matches =
    order && (order.email.toLowerCase() === contact || (phoneDigits.length === 10 && (order.phone.endsWith(phoneDigits) || order.shipPhone.endsWith(phoneDigits))));
  if (!order || !matches) return { message: "We couldn't find an order with those details." };
  redirect(`/order/${order.orderNumber}?t=${order.accessToken}`);
}
