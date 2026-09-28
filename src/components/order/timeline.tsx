import { Check, X } from "lucide-react";
import type { OrderEvent, OrderStatus } from "@prisma/client";
import { ORDER_PROGRESS, ORDER_STATUS_LABEL } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function OrderProgress({ status, events }: { status: OrderStatus; events: OrderEvent[] }) {
  if (status === "CANCELLED" || status === "RETURNED") {
    return (
      <p className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        <X className="size-4" /> This order was {status === "CANCELLED" ? "cancelled" : "returned"}.
      </p>
    );
  }
  const current = ORDER_PROGRESS.indexOf(status);
  return (
    <div>
      <ol className="grid grid-cols-5 gap-1">
        {ORDER_PROGRESS.map((s, i) => {
          const done = current >= i;
          const at = events.filter((e) => e.status === s).at(-1)?.createdAt;
          return (
            <li key={s} className="flex flex-col items-center text-center">
              <div className="flex w-full items-center">
                <span className={cn("h-0.5 flex-1", i === 0 ? "bg-transparent" : done ? "bg-ink" : "bg-line")} />
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-full border-2", done ? "border-ink bg-ink text-brand" : "border-line bg-white text-muted")}>
                  {done ? <Check className="size-4" /> : <span className="text-xs">{i + 1}</span>}
                </span>
                <span className={cn("h-0.5 flex-1", i === ORDER_PROGRESS.length - 1 ? "bg-transparent" : current > i ? "bg-ink" : "bg-line")} />
              </div>
              <span className={cn("mt-2 text-[11px] font-medium sm:text-xs", done ? "text-ink" : "text-muted")}>{ORDER_STATUS_LABEL[s]}</span>
              {at && <span className="hidden text-[10px] text-muted sm:block">{formatDateTime(at)}</span>}
            </li>
          );
        })}
      </ol>
      {status === "PENDING" && <p className="mt-4 text-center text-sm text-amber-700">Awaiting payment confirmation.</p>}
    </div>
  );
}

export function OrderHistory({ events }: { events: OrderEvent[] }) {
  if (!events.length) return null;
  return (
    <ol className="relative space-y-4 border-l border-line pl-5">
      {[...events].reverse().map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full bg-ink" />
          <p className="text-sm font-medium">{ORDER_STATUS_LABEL[e.status]}</p>
          {e.note && e.note !== ORDER_STATUS_LABEL[e.status] && <p className="text-sm text-muted">{e.note}</p>}
          <p className="text-xs text-muted">{formatDateTime(e.createdAt)}</p>
        </li>
      ))}
    </ol>
  );
}
