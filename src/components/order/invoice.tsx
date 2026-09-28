import type { Order, OrderItem } from "@prisma/client";
import { amountInWords, buildInvoice } from "@/lib/gst";
import { formatDate, formatINR } from "@/lib/format";
import type { Settings } from "@/lib/settings";

/** GST tax invoice (A4). Prices are GST-inclusive; tax is back-calculated per line. */
export function TaxInvoice({ order, store }: { order: Order & { items: OrderItem[] }; store: Settings["store"] }) {
  const inv = buildInvoice({
    items: order.items,
    discount: order.discount,
    shippingFee: order.shippingFee,
    codFee: order.codFee,
    sellerState: store.state,
    buyerState: order.shipState,
  });
  const money = (p: number) => formatINR(p, true);
  const th = "border-b border-zinc-300 px-2 py-2 text-left font-semibold";
  const td = "border-b border-zinc-200 px-2 py-2 align-top";

  return (
    <article className="mx-auto max-w-[210mm] bg-white p-8 text-[12px] leading-relaxed text-ink print:p-0">
      <header className="flex items-start justify-between gap-6 border-b-2 border-ink pb-5">
        <div>
          <p className="font-display text-2xl font-bold tracking-[0.08em]">
            CARS<span className="text-brand-dark">APPO</span>
          </p>
          <p className="mt-2 font-semibold">{store.legalName || store.name}</p>
          <p className="max-w-xs text-zinc-600">{store.address}</p>
          {store.gstin && <p>GSTIN: <b>{store.gstin}</b></p>}
          <p className="text-zinc-600">State: {store.state}</p>
          {store.email && <p className="text-zinc-600">{store.email}{store.phone ? ` · ${store.phone}` : ""}</p>}
        </div>
        <div className="text-right">
          <p className="font-display text-xl font-semibold">TAX INVOICE</p>
          <p className="mt-2">Invoice No: <b>{order.invoiceNumber}</b></p>
          <p>Invoice Date: {order.invoiceDate ? formatDate(order.invoiceDate) : "—"}</p>
          <p>Order No: {order.orderNumber}</p>
          <p>Order Date: {formatDate(order.createdAt)}</p>
          <p>Payment: {order.paymentMethod === "COD" ? "Cash on Delivery" : "Prepaid (Online)"}</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-6 border-b border-zinc-300 py-5">
        <div>
          <p className="mb-1 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">Billed to</p>
          <p className="font-semibold">{order.shipName}</p>
          <p className="text-zinc-600">
            {order.shipLine1}
            {order.shipLine2 ? `, ${order.shipLine2}` : ""}, {order.shipCity}, {order.shipState} – {order.shipPincode}
          </p>
          <p className="text-zinc-600">{order.email} · {order.phone}</p>
          {order.gstin && <p>GSTIN: <b>{order.gstin}</b></p>}
        </div>
        <div>
          <p className="mb-1 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">Shipped to</p>
          <p className="font-semibold">{order.shipName}</p>
          <p className="text-zinc-600">
            {order.shipLine1}
            {order.shipLine2 ? `, ${order.shipLine2}` : ""}, {order.shipCity}, {order.shipState} – {order.shipPincode}
          </p>
          <p className="mt-2">
            Place of supply: <b>{order.shipState}</b> · {inv.intraState ? "Intra-state (CGST + SGST)" : "Inter-state (IGST)"}
          </p>
        </div>
      </section>

      <table className="mt-5 w-full border-collapse">
        <thead className="bg-zinc-100">
          <tr>
            <th className={th}>#</th>
            <th className={th}>Description</th>
            <th className={th}>HSN/SAC</th>
            <th className={`${th} text-right`}>Qty</th>
            <th className={`${th} text-right`}>Rate</th>
            <th className={`${th} text-right`}>Disc.</th>
            <th className={`${th} text-right`}>Taxable</th>
            <th className={`${th} text-right`}>GST</th>
            {inv.intraState ? (
              <>
                <th className={`${th} text-right`}>CGST</th>
                <th className={`${th} text-right`}>SGST</th>
              </>
            ) : (
              <th className={`${th} text-right`}>IGST</th>
            )}
            <th className={`${th} text-right`}>Total</th>
          </tr>
        </thead>
        <tbody>
          {inv.lines.map((l, i) => (
            <tr key={i}>
              <td className={td}>{i + 1}</td>
              <td className={td}>
                {l.description}
                {l.sku && <span className="block text-[10px] text-zinc-500">SKU {l.sku}</span>}
              </td>
              <td className={td}>{l.hsn}</td>
              <td className={`${td} text-right`}>{l.quantity}</td>
              <td className={`${td} text-right`}>{money(l.unitPrice)}</td>
              <td className={`${td} text-right`}>{l.discount ? money(l.discount) : "—"}</td>
              <td className={`${td} text-right`}>{money(l.taxable)}</td>
              <td className={`${td} text-right`}>{l.rate}%</td>
              {inv.intraState ? (
                <>
                  <td className={`${td} text-right`}>{money(l.cgst)}</td>
                  <td className={`${td} text-right`}>{money(l.sgst)}</td>
                </>
              ) : (
                <td className={`${td} text-right`}>{money(l.igst)}</td>
              )}
              <td className={`${td} text-right font-medium`}>{money(l.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="mt-6 grid grid-cols-[1fr_260px] gap-8">
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">Amount in words</p>
          <p className="font-medium">{amountInWords(inv.grandTotal)}</p>
          <table className="mt-4 w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-zinc-100">
                <th className={th}>GST rate</th>
                <th className={`${th} text-right`}>Taxable value</th>
                <th className={`${th} text-right`}>Tax amount</th>
              </tr>
            </thead>
            <tbody>
              {inv.byRate.map((r) => (
                <tr key={r.rate}>
                  <td className={td}>{r.rate}%</td>
                  <td className={`${td} text-right`}>{money(r.taxable)}</td>
                  <td className={`${td} text-right`}>{money(r.tax)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between"><span>Taxable value</span><span>{money(inv.taxable)}</span></div>
          {inv.intraState ? (
            <>
              <div className="flex justify-between"><span>CGST</span><span>{money(inv.cgst)}</span></div>
              <div className="flex justify-between"><span>SGST</span><span>{money(inv.sgst)}</span></div>
            </>
          ) : (
            <div className="flex justify-between"><span>IGST</span><span>{money(inv.igst)}</span></div>
          )}
          <div className="flex justify-between border-t-2 border-ink pt-2 font-display text-base font-semibold">
            <span>Grand total</span>
            <span>{money(inv.grandTotal)}</span>
          </div>
          <p className="text-[10px] text-zinc-500">Prices are inclusive of GST.</p>
        </div>
      </section>

      <footer className="mt-12 flex items-end justify-between border-t border-zinc-300 pt-5 text-[11px] text-zinc-500">
        <p>
          This is a computer-generated invoice and does not require a physical signature.
          <br />
          Goods once sold are subject to our return policy at carsappo.com/policies/return-policy.
        </p>
        <p className="text-right">
          For {store.legalName || store.name}
          <br />
          <span className="mt-6 inline-block font-semibold text-ink">Authorised Signatory</span>
        </p>
      </footer>
    </article>
  );
}
