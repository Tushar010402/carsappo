import type { Metadata } from "next";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { RETURN_STATUS_LABEL } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Returns" };

export default async function ReturnsPage() {
  const user = await requireUser("/account/returns");
  const returns = await prisma.returnRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { order: { select: { orderNumber: true } } },
  });
  return (
    <div>
      <h1 className="mb-2 text-3xl font-semibold">Returns</h1>
      <p className="mb-6 text-sm text-muted">
        To request a return, open a delivered order from{" "}
        <Link href="/account/orders" className="underline">
          My Orders
        </Link>
        .
      </p>
      {returns.length === 0 ? (
        <EmptyState icon={<RotateCcw className="size-6" />} title="No return requests" />
      ) : (
        <ul className="space-y-3">
          {returns.map((r) => (
            <li key={r.id} className="rounded-2xl border border-line p-5 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/account/orders/${r.order.orderNumber}`} className="font-semibold underline">
                  {r.order.orderNumber}
                </Link>
                <Badge tone={r.status === "REJECTED" ? "danger" : r.status === "REFUNDED" ? "success" : "info"}>{RETURN_STATUS_LABEL[r.status]}</Badge>
              </div>
              <p className="mt-2">{r.reason}</p>
              {r.details && <p className="mt-1 text-muted">{r.details}</p>}
              {r.adminNote && <p className="mt-2 rounded-xl bg-mist p-3">Carsappo: {r.adminNote}</p>}
              <p className="mt-2 text-xs text-muted">Requested {formatDate(r.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
