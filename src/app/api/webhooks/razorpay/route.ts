import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { confirmOrder } from "@/lib/orders";

/**
 * Razorpay webhook (Dashboard → Settings → Webhooks): subscribe to payment.captured,
 * order.paid, payment.failed and refund.processed. Set RAZORPAY_WEBHOOK_SECRET.
 * This is the safety net if the customer closes the browser before returning to the site.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  const event = JSON.parse(raw) as {
    event: string;
    payload: {
      payment?: { entity: { id: string; order_id: string; error_description?: string } };
      order?: { entity: { id: string } };
      refund?: { entity: { payment_id: string } };
    };
  };

  const payment = event.payload.payment?.entity;
  const rzpOrderId = event.payload.order?.entity.id ?? payment?.order_id;

  switch (event.event) {
    case "payment.captured":
    case "order.paid": {
      const order = rzpOrderId ? await prisma.order.findUnique({ where: { razorpayOrderId: rzpOrderId } }) : null;
      if (order) await confirmOrder(order.id, { paid: true, razorpayPaymentId: payment?.id });
      break;
    }
    case "payment.failed": {
      if (rzpOrderId) {
        const order = await prisma.order.findUnique({ where: { razorpayOrderId: rzpOrderId } });
        if (order && order.paymentStatus === "PENDING") {
          await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED" } });
          await prisma.orderEvent.create({
            data: { orderId: order.id, status: order.status, note: `Payment failed${payment?.error_description ? `: ${payment.error_description}` : ""}` },
          });
        }
      }
      break;
    }
    case "refund.processed": {
      const paymentId = event.payload.refund?.entity.payment_id;
      if (paymentId) await prisma.order.updateMany({ where: { razorpayPaymentId: paymentId }, data: { paymentStatus: "REFUNDED" } });
      break;
    }
  }
  return NextResponse.json({ ok: true });
}
