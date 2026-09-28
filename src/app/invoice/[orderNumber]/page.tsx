import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAccessibleOrder } from "@/lib/order-access";
import { getSettings } from "@/lib/settings";
import { firstParam } from "@/lib/utils";
import { TaxInvoice } from "@/components/order/invoice";
import { PrintButton } from "@/components/order/print-button";

export const metadata: Metadata = { title: "Tax invoice", robots: { index: false } };

export default async function InvoicePage({ params, searchParams }: PageProps<"/invoice/[orderNumber]">) {
  const { orderNumber } = await params;
  const order = await getAccessibleOrder(orderNumber, firstParam((await searchParams).t));
  if (!order || !order.invoiceNumber) notFound();
  const { store } = await getSettings();
  return (
    <div className="min-h-screen bg-mist py-8 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] justify-end px-4">
        <PrintButton />
      </div>
      <div className="shadow-soft print:shadow-none">
        <TaxInvoice order={order} store={store} />
      </div>
    </div>
  );
}
