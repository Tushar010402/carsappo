"use server";

import { z } from "zod";
import type { ReturnStatus } from "@prisma/client";
import { assertAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { setOrderStatus } from "@/lib/orders";
import { razorpayEnabled, refundRazorpayPayment } from "@/lib/razorpay";
import { formatINR, rupeesToPaise } from "@/lib/format";
import { RETURN_STATUS_LABEL } from "@/lib/constants";
import { sendMail, simpleEmail } from "@/lib/mailer";
import { absoluteUrl } from "@/lib/utils";
import { checkbox, formObject, idSchema, optionalText } from "@/lib/admin/form";
import { appendNote, done, failed, invalid, revalidateAdmin, revalidateStore } from "@/lib/admin/server";
import type { ActionState } from "@/lib/admin/types";

const STATUSES = Object.keys(RETURN_STATUS_LABEL) as [ReturnStatus, ...ReturnStatus[]];

/** Allowed forward moves; the same status can always be re-saved to update the note. */
const TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  REQUESTED: ["APPROVED", "REJECTED"],
  APPROVED: ["PICKED_UP", "REJECTED", "REFUNDED"],
  REJECTED: ["APPROVED"],
  PICKED_UP: ["REFUNDED"],
  REFUNDED: [],
};

const CUSTOMER_COPY: Record<ReturnStatus, string> = {
  REQUESTED: "We've received your return request.",
  APPROVED: "Your return request is approved. Our courier partner will contact you to pick up the item.",
  REJECTED: "Unfortunately your return request could not be approved.",
  PICKED_UP: "We've picked up your return. Your refund will be processed after a quality check.",
  REFUNDED: "Your return is complete and the refund has been initiated.",
};

const schema = z.object({
  returnId: idSchema,
  status: z.enum(STATUSES),
  adminNote: optionalText(2000),
  refund: checkbox,
  amount: z.preprocess((v) => (v === "" || v === undefined ? null : v), z.coerce.number().positive("Enter a positive amount").nullable()),
});

export async function updateReturn(_: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await assertAdmin();
  const parsed = schema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { returnId, status, adminNote, refund, amount } = parsed.data;

  const request = await prisma.returnRequest.findUnique({ where: { id: returnId }, include: { order: true } });
  if (!request) return failed("Return request not found");
  const order = request.order;
  const changed = request.status !== status;
  if (changed && !TRANSITIONS[request.status].includes(status)) {
    return failed(`Can't move a return from ${RETURN_STATUS_LABEL[request.status]} to ${RETURN_STATUS_LABEL[status]}`, { status: "Not allowed" });
  }

  let refundLine: string | null = null;
  if (changed && status === "REFUNDED" && refund) {
    if (order.paymentStatus !== "PAID") return failed("The order isn't marked paid, so there is nothing to refund. Untick “Refund payment”.");
    const remaining = order.total - order.refundedAmount;
    if (remaining <= 0) return failed("This order has already been fully refunded. Untick “Refund payment”.");
    const refundAmount = amount === null ? remaining : rupeesToPaise(amount);
    if (refundAmount > remaining) return failed(`Refund can't exceed the refundable balance (${formatINR(remaining)})`, { amount: "Too high" });
    const full = order.refundedAmount + refundAmount >= order.total;
    if (order.paymentMethod === "RAZORPAY" && order.razorpayPaymentId) {
      if (!razorpayEnabled()) return failed("Razorpay isn't configured — refund manually and untick “Refund payment”.");
      try {
        const r = await refundRazorpayPayment(order.razorpayPaymentId, refundAmount === order.total ? undefined : refundAmount);
        refundLine = `Return refund ${formatINR(refundAmount)} via Razorpay (${r.id}) by ${admin.name}`;
      } catch (err) {
        return failed(`Razorpay refund failed: ${err instanceof Error ? err.message : "unknown error"}`);
      }
    } else {
      refundLine = `Return refund ${formatINR(refundAmount)} recorded (paid outside Razorpay) by ${admin.name}`;
    }
    await prisma.order.update({
      where: { id: order.id },
      data: {
        ...(full ? { paymentStatus: "REFUNDED" as const } : {}),
        refundedAmount: { increment: refundAmount },
        adminNote: appendNote(order.adminNote, refundLine),
      },
    });
  }

  await prisma.returnRequest.update({ where: { id: returnId }, data: { status, adminNote } });

  if (changed) {
    if (status === "REFUNDED" && order.status !== "RETURNED") {
      // Restocks items and notifies the customer through the order timeline.
      await setOrderStatus(order.id, "RETURNED", "Return received and refunded", { notify: false });
    }
    const userId = request.userId ?? order.userId;
    const title = `Return ${RETURN_STATUS_LABEL[status].toLowerCase()} · order ${order.orderNumber}`;
    const body = `${CUSTOMER_COPY[status]}${adminNote && status === "REJECTED" ? ` Note: ${adminNote}` : ""}`;
    if (userId) {
      await prisma.notification.create({ data: { userId, title, body, link: `/account/orders/${order.orderNumber}` } });
    }
    await sendMail({
      to: order.email,
      subject: `${title} — Carsappo`,
      html: simpleEmail(title, [body], { label: "View order", href: absoluteUrl(`/order/${order.orderNumber}?t=${order.accessToken}`) }),
    }).catch((e) => console.error("[return mail]", e));
  }

  revalidateAdmin();
  revalidateStore(`/account/orders/${order.orderNumber}`, `/order/${order.orderNumber}`);
  return done(changed ? `Return ${RETURN_STATUS_LABEL[status].toLowerCase()}${refundLine ? " · refund issued" : ""} · customer notified` : "Return updated");
}
