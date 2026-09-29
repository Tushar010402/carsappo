import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createRazorpayOrder, fetchRazorpayOrder, razorpayEnabled, razorpayKeyId } from "@/lib/razorpay";
import { confirmOrder } from "@/lib/orders";
import { rememberOrderAccess } from "@/lib/order-access";
import { getSettings } from "@/lib/settings";

const schema = z.object({ orderNumber: z.string().max(20), token: z.string().max(40) });

/** Re-opens payment for an order whose online payment was abandoned or failed. */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !razorpayEnabled()) return NextResponse.json({ error: "Payment unavailable" }, { status: 400 });
  const order = await prisma.order.findUnique({ where: { orderNumber: parsed.data.orderNumber } });
  if (!order || order.accessToken !== parsed.data.token) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status !== "PENDING" || order.paymentStatus === "PAID") return NextResponse.json({ error: "This order doesn't need payment" }, { status: 400 });

  // Reuse the existing Razorpay order unless it can't be paid any more, so a late payment on it is never orphaned.
  let rzp = order.razorpayOrderId ? await fetchRazorpayOrder(order.razorpayOrderId).catch(() => null) : null;
  if (rzp?.status === "paid") {
    await confirmOrder(order.id, { paid: true });
    await rememberOrderAccess(order);
    return NextResponse.json({ redirect: `/order/${order.orderNumber}?placed=1` });
  }
  if (!rzp || rzp.amount !== order.total) {
    rzp = { ...(await createRazorpayOrder({ amount: order.total, receipt: order.orderNumber, notes: { orderId: order.id } })), amount_paid: 0 };
  }
  await prisma.order.update({ where: { id: order.id }, data: { razorpayOrderId: rzp.id, paymentStatus: "PENDING" } });
  const { store } = await getSettings();
  return NextResponse.json({
    razorpay: {
      key: razorpayKeyId(),
      orderId: rzp.id,
      amount: rzp.amount,
      currency: rzp.currency,
      name: store.name,
      description: `Order ${order.orderNumber}`,
      prefill: { name: order.shipName, email: order.email, contact: order.phone },
    },
  });
}
