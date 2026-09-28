import Link from "next/link";
import type { AccessibleOrder } from "@/lib/order-access";
import { SmartImage } from "@/components/ui/smart-image";
import { formatINR } from "@/lib/format";

export function OrderItems({ order }: { order: AccessibleOrder }) {
  return (
    <ul className="divide-y divide-line">
      {order.items.map((i) => (
        <li key={i.id} className="flex items-center gap-4 py-4">
          <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-mist">
            {i.image && <SmartImage src={i.image} alt="" fill sizes="64px" className="object-cover" />}
          </span>
          <div className="min-w-0 flex-1">
            {i.product?.slug ? (
              <Link href={`/product/${i.product.slug}`} className="text-sm font-medium hover:underline">
                {i.name}
              </Link>
            ) : (
              <p className="text-sm font-medium">{i.name}</p>
            )}
            <p className="text-xs text-muted">
              Qty {i.quantity} × {formatINR(i.price)}
            </p>
          </div>
          <p className="text-sm font-semibold">{formatINR(i.price * i.quantity)}</p>
        </li>
      ))}
    </ul>
  );
}

export function OrderTotals({ order }: { order: AccessibleOrder }) {
  const row = "flex justify-between text-sm";
  return (
    <div className="space-y-2">
      <div className={row}>
        <span className="text-muted">Subtotal</span>
        <span>{formatINR(order.subtotal)}</span>
      </div>
      {order.discount > 0 && (
        <div className={row}>
          <span className="text-muted">Discount {order.couponCode && `(${order.couponCode})`}</span>
          <span className="text-success">−{formatINR(order.discount)}</span>
        </div>
      )}
      <div className={row}>
        <span className="text-muted">Shipping</span>
        <span>{order.shippingFee ? formatINR(order.shippingFee) : "FREE"}</span>
      </div>
      {order.codFee > 0 && (
        <div className={row}>
          <span className="text-muted">COD charges</span>
          <span>{formatINR(order.codFee)}</span>
        </div>
      )}
      <div className={row}>
        <span className="text-muted">GST included</span>
        <span className="text-muted">{formatINR(order.taxTotal)}</span>
      </div>
      <div className="flex justify-between border-t border-line pt-3 font-display font-semibold">
        <span>Total</span>
        <span className="text-lg">{formatINR(order.total)}</span>
      </div>
    </div>
  );
}

export function ShippingAddress({ order }: { order: AccessibleOrder }) {
  return (
    <address className="text-sm leading-relaxed text-zinc-700 not-italic">
      <b className="text-ink">{order.shipName}</b>
      <br />
      {order.shipLine1}
      {order.shipLine2 && (
        <>
          <br />
          {order.shipLine2}
        </>
      )}
      {order.shipLandmark && (
        <>
          <br />
          Landmark: {order.shipLandmark}
        </>
      )}
      <br />
      {order.shipCity}, {order.shipState} {order.shipPincode}
      <br />
      {order.shipPhone}
    </address>
  );
}
