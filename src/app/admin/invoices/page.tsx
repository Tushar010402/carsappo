import type { Metadata } from "next";
import Link from "next/link";
import { Download, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { invoiceRows } from "@/lib/admin/invoices";
import { withParams } from "@/lib/admin/query";
import { Callout, EmptyRow, Money, PageHeader, Panel, StatCard, TBody, THead, Table, Td, Th, Tr } from "@/components/admin/ui";
import { FilterBar, FilterDate, SearchInput } from "@/components/admin/filters";
import { OrderStatusBadge } from "@/components/admin/status-badge";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = { title: "GST invoices" };

export default async function InvoicesPage({ searchParams }: PageProps<"/admin/invoices">) {
  await requireAdmin();
  const sp = await searchParams;
  const data = await invoiceRows(sp);
  const { rows, totals } = data;

  return (
    <>
      <PageHeader
        title="GST invoices"
        description={`Tax invoices issued ${formatDate(data.from)} – ${formatDate(data.to)}. Prices are GST-inclusive; tax is back-calculated per line.`}
        actions={
          <a href={withParams("/admin/invoices/export", sp, { from: data.from, to: data.to })} className={buttonClasses("dark", "sm")}>
            <Download className="size-4" /> Export CSV for GST filing
          </a>
        }
      />
      {!data.sellerGstin && (
        <Callout tone="warning" className="mb-6" title="Store GSTIN is not set">
          Add your GSTIN under <Link href="/admin/settings" className="font-semibold underline">Settings → Store details</Link> so it is printed on invoices. Seller state:{" "}
          <b>{data.sellerState}</b>.
        </Callout>
      )}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Invoices" value={rows.length} />
        <StatCard label="Taxable value" value={<Money paise={totals.taxable} />} />
        <StatCard label="CGST + SGST" value={<Money paise={totals.cgst + totals.sgst} />} hint="Intra-state" />
        <StatCard label="IGST" value={<Money paise={totals.igst} />} hint="Inter-state" />
        <StatCard label="Invoice value" value={<Money paise={totals.total} />} tone="brand" />
      </div>
      <div className="space-y-6">
        <Panel flush>
          <FilterBar action="/admin/invoices" resetHref="/admin/invoices">
            <SearchInput defaultValue={data.q} placeholder="Invoice number…" />
            <FilterDate label="From" name="from" defaultValue={data.from} />
            <FilterDate label="To" name="to" defaultValue={data.to} />
          </FilterBar>
          <Table minWidth={1080}>
            <THead>
              <Th>Invoice</Th>
              <Th>Date</Th>
              <Th>Customer</Th>
              <Th>Place of supply</Th>
              <Th align="right">Taxable</Th>
              <Th align="right">CGST</Th>
              <Th align="right">SGST</Th>
              <Th align="right">IGST</Th>
              <Th align="right">Total</Th>
              <Th>Order</Th>
            </THead>
            <TBody>
              {rows.length === 0 && <EmptyRow colSpan={10}>No invoices in this period.</EmptyRow>}
              {rows.map(({ order: o, inv }) => (
                <Tr key={o.id}>
                  <Td>
                    <a href={`/invoice/${o.orderNumber}?t=${o.accessToken}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-[13px] font-medium hover:underline">
                      {o.invoiceNumber} <ExternalLink className="size-3" />
                    </a>
                  </Td>
                  <Td className="whitespace-nowrap text-muted">{o.invoiceDate ? formatDate(o.invoiceDate) : "—"}</Td>
                  <Td className="whitespace-nowrap">
                    {o.shipName}
                    {o.gstin && <span className="block font-mono text-[11px] text-muted">B2B · {o.gstin}</span>}
                  </Td>
                  <Td className="whitespace-nowrap text-muted">{o.shipState}</Td>
                  <Td align="right">
                    <Money paise={inv.taxable} />
                  </Td>
                  <Td align="right">
                    <Money paise={inv.cgst} />
                  </Td>
                  <Td align="right">
                    <Money paise={inv.sgst} />
                  </Td>
                  <Td align="right">
                    <Money paise={inv.igst} />
                  </Td>
                  <Td align="right">
                    <Money paise={inv.grandTotal} className="font-semibold" />
                  </Td>
                  <Td>
                    <Link href={`/admin/orders/${o.id}`} className="block text-xs font-medium hover:underline">
                      {o.orderNumber}
                    </Link>
                    {(o.status === "CANCELLED" || o.status === "RETURNED" || o.paymentStatus === "REFUNDED") && <OrderStatusBadge status={o.status} />}
                  </Td>
                </Tr>
              ))}
            </TBody>
            {rows.length > 0 && (
              <tfoot className="border-t-2 border-line bg-mist/60 font-semibold">
                <tr>
                  <Td colSpan={4}>Total ({rows.length})</Td>
                  <Td align="right">
                    <Money paise={totals.taxable} />
                  </Td>
                  <Td align="right">
                    <Money paise={totals.cgst} />
                  </Td>
                  <Td align="right">
                    <Money paise={totals.sgst} />
                  </Td>
                  <Td align="right">
                    <Money paise={totals.igst} />
                  </Td>
                  <Td align="right">
                    <Money paise={totals.total} />
                  </Td>
                  <Td />
                </tr>
              </tfoot>
            )}
          </Table>
          {data.truncated && <p className="border-t border-line px-4 py-3 text-xs text-amber-700">Showing the first 5,000 invoices — narrow the date range.</p>}
        </Panel>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start">
          <Panel title="Tax by rate" flush>
            <table className="w-full text-sm">
              <thead className="bg-mist/70 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">
                <tr>
                  <th className="px-4 py-2">Rate</th>
                  <th className="px-4 py-2 text-right">Taxable</th>
                  <th className="px-4 py-2 text-right">Tax</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.byRate.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-muted">
                      —
                    </td>
                  </tr>
                )}
                {data.byRate.map((r) => (
                  <tr key={r.rate}>
                    <td className="px-4 py-2 font-medium">{r.rate}%</td>
                    <td className="px-4 py-2 text-right">
                      <Money paise={r.taxable} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Money paise={r.tax} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
          <Callout tone="info">
            Cancelled or refunded orders still appear here because their invoice numbers were issued — raise credit notes for them when filing. Shipping and COD fees are taxed at 18% (SAC 996812).
          </Callout>
        </div>
      </div>
    </>
  );
}
