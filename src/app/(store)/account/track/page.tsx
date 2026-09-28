import type { Metadata } from "next";
import Link from "next/link";
import { Truck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { OrderProgress } from "@/components/order/timeline";
import { EmptyState } from "@/components/ui/container";

export const metadata: Metadata = { title: "Track orders" };

export default async function TrackOrdersPage() {
  const user = await requireUser("/account/track");
  const orders = await prisma.order.findMany({
    where: { userId: user.id, status: { in: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY"] } },
    orderBy: { createdAt: "desc" },
    include: { events: { orderBy: { createdAt: "asc" } } },
  });
  return (
    <div>
      <h1 className="mb-6 text-3xl font-semibold">Track orders</h1>
      {orders.length === 0 ? (
        <EmptyState icon={<Truck className="size-6" />} title="No active shipments" description="Orders on their way to you will appear here." />
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <Link key={o.id} href={`/account/orders/${o.orderNumber}`} className="block rounded-[28px] border border-line p-6 transition hover:border-ink">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2 text-sm">
                <p className="font-semibold">
                  {o.orderNumber} · {ORDER_STATUS_LABEL[o.status]}
                </p>
                <p className="text-muted">
                  {o.awbCode ? `${o.courierName ?? "Courier"} · AWB ${o.awbCode}` : "Awaiting dispatch"}
                  {o.estimatedDelivery && ` · ETA ${formatDate(o.estimatedDelivery)}`}
                </p>
              </div>
              <OrderProgress status={o.status} events={o.events} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
