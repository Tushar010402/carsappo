import Link from "next/link";
import type { Order, OrderItem } from "@prisma/client";
import { ChevronRight } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { SmartImage } from "@/components/ui/smart-image";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import { formatDate, formatINR } from "@/lib/format";

export function statusTone(status: Order["status"]): BadgeTone {
  switch (status) {
    case "DELIVERED":
      return "success";
    case "CANCELLED":
    case "RETURNED":
      return "danger";
    case "PENDING":
      return "warning";
    case "SHIPPED":
    case "OUT_FOR_DELIVERY":
      return "info";
    default:
      return "soft";
  }
}

export function OrderList({ orders }: { orders: (Order & { items: OrderItem[] })[] }) {
  return (
    <ul className="space-y-3">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/account/orders/${o.orderNumber}`} className="flex items-center gap-4 rounded-2xl border border-line p-4 transition hover:border-ink">
            <div className="flex -space-x-3">
              {o.items.slice(0, 3).map((i) => (
                <span key={i.id} className="relative size-12 overflow-hidden rounded-xl border-2 border-white bg-mist">
                  {i.image && <SmartImage src={i.image} alt="" fill sizes="48px" className="object-cover" />}
                </span>
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                {o.orderNumber} <Badge tone={statusTone(o.status)}>{ORDER_STATUS_LABEL[o.status]}</Badge>
              </p>
              <p className="mt-0.5 truncate text-xs text-muted">
                {formatDate(o.createdAt)} · {o.items.length} item{o.items.length > 1 ? "s" : ""} · {o.items.map((i) => i.name).join(", ")}
              </p>
            </div>
            <p className="font-display font-semibold">{formatINR(o.total)}</p>
            <ChevronRight className="size-4 text-muted" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
