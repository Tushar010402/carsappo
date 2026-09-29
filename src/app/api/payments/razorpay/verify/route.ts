import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { confirmOrder } from "@/lib/orders";
import { rememberOrderAccess } from "@/lib/order-access";

const schema = z.object({
  razorpay_order_id: z.string().min(1).max(64),
  razorpay_payment_id: z.string().min(1).max(64),
  razorpay_signature: z.string().min(1).max(256),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payment response" }, { status: 400 });
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return NextResponse.json({ error: "Payment verification failed. If money was deducted, it will be refunded automatically." }, { status: 400 });
  }
  const order = await prisma.order.findUnique({ where: { razorpayOrderId: razorpay_order_id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  await confirmOrder(order.id, { paid: true, razorpayPaymentId: razorpay_payment_id });
  await rememberOrderAccess(order);
  return NextResponse.json({ redirect: `/order/${order.orderNumber}?placed=1` });
}
