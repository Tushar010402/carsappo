/**
 * GST helpers. All catalogue prices are GST-inclusive, so tax is *extracted* from amounts.
 * Intra-state supplies (buyer state == seller state) split tax into CGST + SGST; otherwise IGST.
 */

export const SHIPPING_SAC = "996812"; // courier services
export const SHIPPING_GST_RATE = 18;

/** GST contained in a GST-inclusive amount (paise). */
export function gstIncluded(amountInclusive: number, rate: number) {
  if (rate <= 0) return 0;
  return Math.round((amountInclusive * rate) / (100 + rate));
}

function normalizeState(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z]/g, "");
}

export function isIntraState(sellerState: string, buyerState: string) {
  return normalizeState(sellerState) === normalizeState(buyerState);
}

export type InvoiceSourceItem = {
  name: string;
  sku: string;
  hsnCode: string | null;
  price: number;
  quantity: number;
  gstRate: number;
};

export type InvoiceLine = {
  description: string;
  sku?: string;
  hsn: string;
  quantity: number;
  unitPrice: number; // inclusive
  gross: number; // inclusive, before discount
  discount: number;
  taxable: number;
  rate: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number; // inclusive, after discount
};

export type InvoiceBreakdown = {
  lines: InvoiceLine[];
  intraState: boolean;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  grandTotal: number;
  /** Tax grouped by rate for the invoice summary table. */
  byRate: { rate: number; taxable: number; tax: number }[];
};

function splitTax(tax: number, intra: boolean) {
  if (!intra) return { cgst: 0, sgst: 0, igst: tax };
  const cgst = Math.floor(tax / 2);
  return { cgst, sgst: tax - cgst, igst: 0 };
}

/**
 * Allocate an order-level discount across lines pro-rata to their value.
 * Returns an array of per-line discount amounts that sums exactly to `discount`.
 */
export function allocateDiscount(lineTotals: number[], discount: number) {
  const sum = lineTotals.reduce((a, b) => a + b, 0);
  if (discount <= 0 || sum <= 0) return lineTotals.map(() => 0);
  const shares = lineTotals.map((t) => Math.floor((t * discount) / sum));
  let remainder = discount - shares.reduce((a, b) => a + b, 0);
  for (let i = 0; remainder > 0 && i < shares.length; i++, remainder--) shares[i] += 1;
  return shares;
}

export function buildInvoice(args: {
  items: InvoiceSourceItem[];
  discount: number;
  shippingFee: number;
  codFee: number;
  sellerState: string;
  buyerState: string;
}): InvoiceBreakdown {
  const intra = isIntraState(args.sellerState, args.buyerState);
  const grossTotals = args.items.map((i) => i.price * i.quantity);
  const discounts = allocateDiscount(grossTotals, args.discount);

  const lines: InvoiceLine[] = args.items.map((item, idx) => {
    const gross = grossTotals[idx];
    const total = gross - discounts[idx];
    const tax = gstIncluded(total, item.gstRate);
    return {
      description: item.name,
      sku: item.sku,
      hsn: item.hsnCode || "—",
      quantity: item.quantity,
      unitPrice: item.price,
      gross,
      discount: discounts[idx],
      taxable: total - tax,
      rate: item.gstRate,
      ...splitTax(tax, intra),
      total,
    };
  });

  const feeLine = (description: string, amount: number): InvoiceLine => {
    const tax = gstIncluded(amount, SHIPPING_GST_RATE);
    return {
      description,
      hsn: SHIPPING_SAC,
      quantity: 1,
      unitPrice: amount,
      gross: amount,
      discount: 0,
      taxable: amount - tax,
      rate: SHIPPING_GST_RATE,
      ...splitTax(tax, intra),
      total: amount,
    };
  };
  if (args.shippingFee > 0) lines.push(feeLine("Shipping & handling", args.shippingFee));
  if (args.codFee > 0) lines.push(feeLine("Cash on delivery charges", args.codFee));

  const sum = (key: keyof Pick<InvoiceLine, "taxable" | "cgst" | "sgst" | "igst" | "total">) =>
    lines.reduce((acc, l) => acc + l[key], 0);

  const rateMap = new Map<number, { taxable: number; tax: number }>();
  for (const l of lines) {
    const entry = rateMap.get(l.rate) ?? { taxable: 0, tax: 0 };
    entry.taxable += l.taxable;
    entry.tax += l.cgst + l.sgst + l.igst;
    rateMap.set(l.rate, entry);
  }

  const cgst = sum("cgst");
  const sgst = sum("sgst");
  const igst = sum("igst");
  return {
    lines,
    intraState: intra,
    taxable: sum("taxable"),
    cgst,
    sgst,
    igst,
    totalTax: cgst + sgst + igst,
    grandTotal: sum("total"),
    byRate: [...rateMap.entries()].sort((a, b) => a[0] - b[0]).map(([rate, v]) => ({ rate, ...v })),
  };
}

/** Indian financial year label for a date, e.g. 2026-09-28 → "26-27". */
export function financialYear(date = new Date()) {
  const ist = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  const y = ist.getUTCFullYear();
  const startYear = ist.getUTCMonth() >= 3 ? y : y - 1;
  return `${String(startYear).slice(2)}-${String(startYear + 1).slice(2)}`;
}

const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n: number) {
  if (n < 20) return ones[n];
  return `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ""}`;
}

function threeDigits(n: number) {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return [h ? `${ones[h]} Hundred` : "", rest ? twoDigits(rest) : ""].filter(Boolean).join(" ");
}

/** Amount in words using the Indian numbering system, e.g. "Rupees One Thousand Four Hundred Ninety Nine Only". */
export function amountInWords(paise: number) {
  const rupees = Math.floor(paise / 100);
  const p = paise % 100;
  if (rupees === 0 && p === 0) return "Rupees Zero Only";
  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const rest = rupees % 1000;
  const parts = [
    crore ? `${threeDigits(crore)} Crore` : "",
    lakh ? `${twoDigits(lakh)} Lakh` : "",
    thousand ? `${twoDigits(thousand)} Thousand` : "",
    rest ? threeDigits(rest) : "",
  ].filter(Boolean);
  const words = `Rupees ${parts.join(" ") || "Zero"}`;
  return `${words}${p ? ` and ${twoDigits(p)} Paise` : ""} Only`;
}
