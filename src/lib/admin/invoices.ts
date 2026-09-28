import "server-only";
import { prisma } from "@/lib/db";
import { buildInvoice } from "@/lib/gst";
import { getSettings } from "@/lib/settings";
import { currentMonthRange, dateRange, param, type SearchParams } from "@/lib/admin/query";

export const INVOICE_LIMIT = 5000;

/** Invoiced orders in an IST date range (default: current month) with their GST breakdown. */
export async function invoiceRows(sp: SearchParams) {
  const { store } = await getSettings();
  const range = dateRange(sp, currentMonthRange());
  const q = param(sp, "q");
  const orders = await prisma.order.findMany({
    where: {
      invoiceNumber: q ? { contains: q, mode: "insensitive" } : { not: null },
      invoiceDate: { gte: range.gte, lt: range.lt },
    },
    orderBy: { invoiceDate: "asc" },
    take: INVOICE_LIMIT,
    select: {
      id: true,
      orderNumber: true,
      accessToken: true,
      invoiceNumber: true,
      invoiceDate: true,
      shipName: true,
      shipState: true,
      gstin: true,
      status: true,
      paymentMethod: true,
      paymentStatus: true,
      discount: true,
      shippingFee: true,
      codFee: true,
      total: true,
      items: { select: { name: true, sku: true, hsnCode: true, price: true, quantity: true, gstRate: true } },
    },
  });

  const rows = orders.map((o) => {
    const inv = buildInvoice({
      items: o.items,
      discount: o.discount,
      shippingFee: o.shippingFee,
      codFee: o.codFee,
      sellerState: store.state,
      buyerState: o.shipState,
    });
    return { order: o, inv };
  });

  const totals = rows.reduce(
    (acc, { inv }) => ({
      taxable: acc.taxable + inv.taxable,
      cgst: acc.cgst + inv.cgst,
      sgst: acc.sgst + inv.sgst,
      igst: acc.igst + inv.igst,
      total: acc.total + inv.grandTotal,
    }),
    { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 },
  );

  const byRate = new Map<number, { taxable: number; tax: number }>();
  for (const { inv } of rows) {
    for (const r of inv.byRate) {
      const e = byRate.get(r.rate) ?? { taxable: 0, tax: 0 };
      e.taxable += r.taxable;
      e.tax += r.tax;
      byRate.set(r.rate, e);
    }
  }

  return {
    rows,
    totals,
    byRate: [...byRate.entries()].sort((a, b) => a[0] - b[0]).map(([rate, v]) => ({ rate, ...v })),
    from: range.from!,
    to: range.to!,
    q,
    sellerState: store.state,
    sellerGstin: store.gstin,
    truncated: orders.length >= INVOICE_LIMIT,
  };
}
