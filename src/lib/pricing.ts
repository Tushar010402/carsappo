import "server-only";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { validateCoupon, describeCoupon } from "@/lib/coupons";
import { estimateDelivery, type DeliveryEstimate } from "@/lib/delivery";
import { allocateDiscount, gstIncluded, SHIPPING_GST_RATE } from "@/lib/gst";

export type QuoteInput = {
  items: { productId: string; quantity: number }[];
  couponCode?: string | null;
  pincode?: string | null;
  paymentMethod?: "RAZORPAY" | "COD";
  email?: string | null;
  userId?: string | null;
};

export type QuoteLine = {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  image: string | null;
  price: number;
  mrp: number | null;
  quantity: number;
  requestedQuantity: number;
  stock: number;
  lineTotal: number;
  gstRate: number;
  hsnCode: string | null;
};

export type Quote = {
  lines: QuoteLine[];
  itemCount: number;
  subtotal: number;
  mrpTotal: number;
  discount: number;
  coupon: { code: string; description: string } | null;
  couponError: string | null;
  shippingFee: number;
  codFee: number;
  codAvailable: boolean;
  freeShippingThreshold: number;
  amountToFreeShipping: number;
  taxTotal: number;
  total: number;
  delivery: DeliveryEstimate;
  /** Human-readable problems (out of stock, quantity reduced, removed items). */
  issues: string[];
  /** Product IDs that no longer exist / are inactive / out of stock. */
  removed: string[];
};

/** Authoritative server-side pricing. The client cart is never trusted for prices. */
export async function computeQuote(input: QuoteInput): Promise<Quote> {
  const settings = await getSettings();
  const ship = settings.shipping;

  // Merge duplicate lines.
  const qtyById = new Map<string, number>();
  for (const it of input.items) qtyById.set(it.productId, (qtyById.get(it.productId) ?? 0) + it.quantity);

  const products = await prisma.product.findMany({
    where: { id: { in: [...qtyById.keys()] }, isActive: true },
    select: {
      id: true,
      slug: true,
      name: true,
      sku: true,
      price: true,
      mrp: true,
      stock: true,
      gstRate: true,
      hsnCode: true,
      images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const issues: string[] = [];
  const removed: string[] = [];
  const lines: QuoteLine[] = [];

  for (const [productId, requested] of qtyById) {
    const p = byId.get(productId);
    if (!p) {
      removed.push(productId);
      issues.push("An item in your cart is no longer available and was removed.");
      continue;
    }
    if (p.stock <= 0) {
      removed.push(productId);
      issues.push(`${p.name} is out of stock.`);
      continue;
    }
    const quantity = Math.min(requested, p.stock, 20);
    if (quantity < requested) issues.push(`Only ${p.stock} unit(s) of ${p.name} available — quantity updated.`);
    lines.push({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      sku: p.sku,
      image: p.images[0]?.url ?? null,
      price: p.price,
      mrp: p.mrp,
      quantity,
      requestedQuantity: requested,
      stock: p.stock,
      lineTotal: p.price * quantity,
      gstRate: p.gstRate,
      hsnCode: p.hsnCode,
    });
  }

  const subtotal = lines.reduce((a, l) => a + l.lineTotal, 0);
  const mrpTotal = lines.reduce((a, l) => a + Math.max(l.mrp ?? l.price, l.price) * l.quantity, 0);
  const itemCount = lines.reduce((a, l) => a + l.quantity, 0);

  let discount = 0;
  let coupon: Quote["coupon"] = null;
  let couponError: string | null = null;
  if (input.couponCode && subtotal > 0) {
    const res = await validateCoupon({ code: input.couponCode, subtotal, email: input.email, userId: input.userId });
    if (res.ok) {
      discount = res.discount;
      coupon = { code: res.coupon.code, description: res.coupon.description || describeCoupon(res.coupon) };
    } else {
      couponError = res.error;
    }
  }

  const afterDiscount = subtotal - discount;
  const freeShipping = afterDiscount >= ship.freeShippingThreshold;
  const shippingFee = subtotal === 0 || freeShipping ? 0 : ship.flatShippingFee;
  const codAvailable = ship.codEnabled && afterDiscount + shippingFee <= ship.codMaxOrder;
  const codFee = input.paymentMethod === "COD" && codAvailable ? ship.codFee : 0;

  const lineDiscounts = allocateDiscount(
    lines.map((l) => l.lineTotal),
    discount,
  );
  const goodsTax = lines.reduce((acc, l, i) => acc + gstIncluded(l.lineTotal - lineDiscounts[i], l.gstRate), 0);
  const taxTotal = goodsTax + gstIncluded(shippingFee, SHIPPING_GST_RATE) + gstIncluded(codFee, SHIPPING_GST_RATE);

  return {
    lines,
    itemCount,
    subtotal,
    mrpTotal,
    discount,
    coupon,
    couponError,
    shippingFee,
    codFee,
    codAvailable,
    freeShippingThreshold: ship.freeShippingThreshold,
    amountToFreeShipping: freeShipping || subtotal === 0 ? 0 : ship.freeShippingThreshold - afterDiscount,
    taxTotal,
    total: afterDiscount + shippingFee + codFee,
    delivery: estimateDelivery(input.pincode, ship.dispatchDays, undefined, settings.delivery),
    issues: [...new Set(issues)],
    removed,
  };
}
