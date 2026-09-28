import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { computeQuote } from "@/lib/pricing";
import { checkoutSchema, fieldErrors } from "@/lib/validators";
import { confirmOrder, generateOrderNumber } from "@/lib/orders";
import { createRazorpayOrder, razorpayEnabled, razorpayKeyId } from "@/lib/razorpay";
import { rateLimit } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";

export async function POST(req: NextRequest) {
  if (!(await rateLimit("checkout", 20, 10 * 60 * 1000)).ok) {
    return NextResponse.json({ error: "Too many attempts. Please wait a moment and try again." }, { status: 429 });
  }
  const parsed = checkoutSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please fix the highlighted fields.", errors: fieldErrors(parsed.error) }, { status: 400 });
  const input = parsed.data;
  const user = await getCurrentUser();

  if (input.paymentMethod === "RAZORPAY" && !razorpayEnabled()) {
    return NextResponse.json({ error: "Online payments are temporarily unavailable. Please choose Cash on Delivery." }, { status: 400 });
  }

  const quote = await computeQuote({
    items: input.items,
    couponCode: input.couponCode,
    pincode: input.address.pincode,
    paymentMethod: input.paymentMethod,
    email: input.email,
    userId: user?.id,
  });

  if (!quote.lines.length) return NextResponse.json({ error: "Your cart is empty or items are out of stock.", quote }, { status: 409 });
  const quantityChanged = quote.removed.length > 0 || quote.lines.some((l) => l.quantity !== l.requestedQuantity);
  if (quantityChanged) {
    return NextResponse.json({ error: "Some items in your cart changed. Please review your order.", quote }, { status: 409 });
  }
  if (input.couponCode && quote.couponError) return NextResponse.json({ error: quote.couponError, quote }, { status: 409 });
  if (input.paymentMethod === "COD" && !quote.codAvailable) {
    return NextResponse.json({ error: "Cash on Delivery isn't available for this order. Please pay online." }, { status: 400 });
  }

  const a = input.address;
  const order = await prisma.$transaction(async (tx) => {
    const orderNumber = await generateOrderNumber(tx);
    return tx.order.create({
      data: {
        orderNumber,
        userId: user?.id,
        email: input.email,
        phone: input.phone,
        shipName: a.name,
        shipPhone: a.phone,
        shipLine1: a.line1,
        shipLine2: a.line2,
        shipLandmark: a.landmark,
        shipCity: a.city,
        shipState: a.state,
        shipPincode: a.pincode,
        gstin: input.gstin,
        subtotal: quote.subtotal,
        discount: quote.discount,
        shippingFee: quote.shippingFee,
        codFee: quote.codFee,
        taxTotal: quote.taxTotal,
        total: quote.total,
        couponCode: quote.coupon?.code,
        paymentMethod: input.paymentMethod,
        customerNote: input.note || null,
        estimatedDelivery: new Date(quote.delivery.latest),
        items: {
          create: quote.lines.map((l) => ({
            productId: l.productId,
            name: l.name,
            sku: l.sku,
            image: l.image,
            price: l.price,
            quantity: l.quantity,
            gstRate: l.gstRate,
            hsnCode: l.hsnCode,
          })),
        },
      },
    });
  });

  if (user && input.saveAddress && !input.addressId) {
    const exists = await prisma.address.findFirst({ where: { userId: user.id, line1: a.line1, pincode: a.pincode } });
    if (!exists) {
      const count = await prisma.address.count({ where: { userId: user.id } });
      await prisma.address.create({ data: { userId: user.id, ...a, isDefault: count === 0 } });
    }
  }

  const confirmationUrl = `/order/${order.orderNumber}?t=${order.accessToken}&placed=1`;

  if (input.paymentMethod === "COD") {
    await confirmOrder(order.id);
    return NextResponse.json({ orderNumber: order.orderNumber, redirect: confirmationUrl });
  }

  try {
    const rzp = await createRazorpayOrder({ amount: order.total, receipt: order.orderNumber, notes: { orderId: order.id } });
    await prisma.order.update({ where: { id: order.id }, data: { razorpayOrderId: rzp.id } });
    const { store } = await getSettings();
    return NextResponse.json({
      orderNumber: order.orderNumber,
      redirect: confirmationUrl,
      razorpay: {
        key: razorpayKeyId(),
        orderId: rzp.id,
        amount: rzp.amount,
        currency: rzp.currency,
        name: store.name,
        description: `Order ${order.orderNumber}`,
        prefill: { name: a.name, email: input.email, contact: input.phone },
      },
    });
  } catch (err) {
    console.error("[checkout] Razorpay order failed", err);
    return NextResponse.json(
      { error: "We couldn't start the payment. Please try again or choose Cash on Delivery.", orderNumber: order.orderNumber },
      { status: 502 },
    );
  }
}
