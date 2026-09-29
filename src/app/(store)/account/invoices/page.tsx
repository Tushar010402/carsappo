import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, formatINR } from "@/lib/format";
import { EmptyState } from "@/components/ui/container";

export const metadata: Metadata = { title: "Invoices" };

export default async function InvoicesPage() {
  const user = await requireUser("/account/invoices");
  const orders = await prisma.order.findMany({
    where: { userId: user.id, invoiceNumber: { not: null } },
    orderBy: { invoiceDate: "desc" },
    select: { orderNumber: true, invoiceNumber: true, invoiceDate: true, total: true, accessToken: true },
  });
  return (
    <div>
      <h1 className="mb-6 text-3xl font-semibold">GST invoices</h1>
      {orders.length === 0 ? (
        <EmptyState icon={<FileText className="size-6" />} title="No invoices yet" description="Invoices are generated as soon as an order is confirmed." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-mist text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Invoice</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 text-right font-semibold">Amount</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => (
                <tr key={o.orderNumber}>
                  <td className="px-4 py-3 font-medium">{o.invoiceNumber}</td>
                  <td className="px-4 py-3 text-muted">{o.invoiceDate && formatDate(o.invoiceDate)}</td>
                  <td className="px-4 py-3">{o.orderNumber}</td>
                  <td className="px-4 py-3 text-right">{formatINR(o.total)}</td>
                  <td className="px-4 py-3 text-right">
                    <a href={`/invoice/${o.orderNumber}`} target="_blank" className="font-semibold underline">
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
