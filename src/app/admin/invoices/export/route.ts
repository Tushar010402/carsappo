import type { NextRequest } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { csvMoney, csvResponse } from "@/lib/admin/csv";
import { invoiceRows } from "@/lib/admin/invoices";

/** GST register export: one row per invoice line (HSN, rate, taxable value, CGST/SGST/IGST). */
export async function GET(req: NextRequest) {
  try {
    await assertAdmin();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sp = Object.fromEntries(req.nextUrl.searchParams);
  const data = await invoiceRows(sp);
  const istDate = (d: Date | null) => (d ? new Date(d.getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 10) : "");

  const rows = data.rows.flatMap(({ order: o, inv }) =>
    inv.lines.map((l) => [
      o.invoiceNumber,
      istDate(o.invoiceDate),
      o.orderNumber,
      o.shipName,
      o.gstin ?? "",
      o.gstin ? "B2B" : "B2C",
      o.shipState,
      inv.intraState ? "Intra-state" : "Inter-state",
      l.description,
      l.hsn,
      l.quantity,
      l.rate,
      csvMoney(l.taxable),
      csvMoney(l.cgst),
      csvMoney(l.sgst),
      csvMoney(l.igst),
      csvMoney(l.total),
      csvMoney(inv.grandTotal),
      o.paymentMethod,
      o.status,
      o.paymentStatus,
    ]),
  );

  return csvResponse(
    `carsappo-gst-invoices-${data.from}-to-${data.to}.csv`,
    [
      "Invoice No",
      "Invoice Date",
      "Order No",
      "Customer",
      "Customer GSTIN",
      "Type",
      "Place of Supply",
      "Supply",
      "Description",
      "HSN/SAC",
      "Qty",
      "GST Rate %",
      "Taxable Value",
      "CGST",
      "SGST",
      "IGST",
      "Line Total",
      "Invoice Total",
      "Payment Method",
      "Order Status",
      "Payment Status",
    ],
    rows,
  );
}
