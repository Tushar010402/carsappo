import { ExternalLink, Truck } from "lucide-react";
import type { AccessibleOrder } from "@/lib/order-access";
import { shiprocketEnabled, trackAwb } from "@/lib/shiprocket";

/** Courier details plus live Shiprocket scan history when an AWB is assigned. */
export async function ShipmentTracking({ order }: { order: AccessibleOrder }) {
  if (!order.awbCode) return null;
  let live: Awaited<ReturnType<typeof trackAwb>> | null = null;
  if (shiprocketEnabled()) {
    live = await trackAwb(order.awbCode).catch(() => null);
  }
  const url = live?.trackUrl || order.trackingUrl;
  return (
    <div className="rounded-2xl border border-line p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-semibold">
          <Truck className="size-4" /> {order.courierName || "Courier"} · AWB {order.awbCode}
        </p>
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium underline">
            Track on courier site <ExternalLink className="size-3.5" />
          </a>
        )}
      </div>
      {live?.currentStatus && <p className="mt-2 text-sm">Current status: <b>{live.currentStatus}</b></p>}
      {live?.activities.length ? (
        <ol className="mt-4 max-h-64 space-y-3 overflow-y-auto border-l border-line pl-4 text-sm">
          {live.activities.slice(0, 15).map((a, i) => (
            <li key={i}>
              <p className="font-medium">{a.activity}</p>
              <p className="text-xs text-muted">
                {a.location} · {a.date}
              </p>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
