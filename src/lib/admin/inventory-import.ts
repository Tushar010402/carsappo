import { GST_RATES } from "@/lib/constants";
import { csvText, parseCsv } from "@/lib/admin/csv";

/* Bulk price & stock update from a CSV (same columns as Inventory → Export CSV). Pure functions so
   the whole import can be checked (preview) before anything is written. */

export const IMPORT_LIMIT_ROWS = 5000;

const COLUMNS = {
  sku: ["sku"],
  price: ["price (inr)", "price", "selling price", "selling price (inr)"],
  mrp: ["mrp (inr)", "mrp"],
  stock: ["stock", "quantity", "qty"],
  lowStockAlert: ["low stock alert", "low-stock alert", "alert at"],
  gstRate: ["gst %", "gst", "gst rate", "gst rate %"],
} as const;

type Field = Exclude<keyof typeof COLUMNS, "sku">;
export const IMPORT_FIELDS: Field[] = ["price", "mrp", "stock", "lowStockAlert", "gstRate"];
const FIELD_LABEL: Record<Field, string> = { price: "Price", mrp: "MRP", stock: "Stock", lowStockAlert: "Low stock alert", gstRate: "GST %" };

export type ImportRow = {
  line: number;
  sku: string;
  price?: number;
  /** null clears the MRP. */
  mrp?: number | null;
  stock?: number;
  lowStockAlert?: number;
  gstRate?: number;
};

export type ParsedImport = { rows: ImportRow[]; columns: Field[]; errors: string[] };

const normalise = (h: string) => h.replace(/^﻿/, "").trim().toLowerCase().replace(/\s+/g, " ");

function number(raw: string) {
  const s = raw.replace(/[₹,\s]/g, "").replace(/^rs\.?/i, "");
  if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN;
  return Number(s);
}

export function parseInventoryCsv(text: string): ParsedImport {
  const table = parseCsv(text);
  if (table.length === 0) return { rows: [], columns: [], errors: ["The file is empty"] };
  const header = table[0].map(normalise);
  const index = Object.fromEntries(
    Object.entries(COLUMNS).map(([key, names]) => [key, header.findIndex((h) => (names as readonly string[]).includes(h))]),
  ) as Record<keyof typeof COLUMNS, number>;
  if (index.sku < 0) return { rows: [], columns: [], errors: ["The first row must include a SKU column"] };
  const columns = IMPORT_FIELDS.filter((f) => index[f] >= 0);
  if (columns.length === 0) return { rows: [], columns, errors: ["Add at least one column to update: Price (INR), MRP (INR), Stock, Low stock alert or GST %"] };
  if (table.length - 1 > IMPORT_LIMIT_ROWS) return { rows: [], columns, errors: [`Up to ${IMPORT_LIMIT_ROWS} rows per file — split it into smaller files`] };

  const rows: ImportRow[] = [];
  const errors: string[] = [];
  const seen = new Map<string, number>();
  table.slice(1).forEach((cells, i) => {
    const line = i + 2;
    const sku = csvText(cells[index.sku]).toUpperCase();
    if (!sku) return;
    const where = `Row ${line} (${sku})`;
    if (seen.has(sku)) {
      errors.push(`${where}: SKU repeats row ${seen.get(sku)}`);
      return;
    }
    seen.set(sku, line);
    const row: ImportRow = { line, sku };
    const problems: string[] = [];
    for (const field of columns) {
      const raw = csvText(cells[index[field]]);
      if (raw === "") continue; // blank = leave unchanged
      const n = number(raw);
      const label = FIELD_LABEL[field];
      if (!Number.isFinite(n)) {
        problems.push(`${label} “${raw}” is not a number`);
        continue;
      }
      if (field === "price") {
        if (n < 1 || n > 10_000_000) problems.push(`${label} must be between ₹1 and ₹1,00,00,000`);
        else row.price = Math.round(n * 100);
      } else if (field === "mrp") {
        if (n < 0 || n > 10_000_000) problems.push(`${label} must be between ₹0 and ₹1,00,00,000`);
        else row.mrp = n === 0 ? null : Math.round(n * 100);
      } else if (field === "gstRate") {
        if (!(GST_RATES as readonly number[]).includes(n)) problems.push(`${label} must be one of ${GST_RATES.join(", ")}`);
        else row.gstRate = n;
      } else {
        const max = field === "stock" ? 1_000_000 : 100_000;
        if (!Number.isInteger(n) || n < 0 || n > max) problems.push(`${label} must be a whole number from 0 to ${max.toLocaleString("en-IN")}`);
        else row[field] = n;
      }
    }
    if (problems.length) errors.push(`${where}: ${problems.join("; ")}`);
    else rows.push(row);
  });
  return { rows, columns, errors };
}

export type CurrentProduct = { id: string; sku: string; slug: string; name: string; price: number; mrp: number | null; stock: number; lowStockAlert: number; gstRate: number };

export type PlannedChange = {
  product: CurrentProduct;
  data: Partial<Pick<CurrentProduct, "price" | "mrp" | "stock" | "lowStockAlert" | "gstRate">>;
  summary: string;
};

/** Compares parsed rows with the catalogue: what changes, what stays, unknown SKUs and invalid combinations. */
export function planInventoryImport(rows: ImportRow[], products: CurrentProduct[]) {
  const bySku = new Map(products.map((p) => [p.sku.toUpperCase(), p]));
  const changes: PlannedChange[] = [];
  const unknown: string[] = [];
  const errors: string[] = [];
  let unchanged = 0;
  const rupees = (paise: number | null) => (paise === null ? "none" : `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`);

  for (const row of rows) {
    const product = bySku.get(row.sku);
    if (!product) {
      unknown.push(row.sku);
      continue;
    }
    const price = row.price ?? product.price;
    const mrp = row.mrp === undefined ? product.mrp : row.mrp;
    if (mrp !== null && mrp < price) {
      errors.push(`Row ${row.line} (${row.sku}): MRP ${rupees(mrp)} is below the selling price ${rupees(price)}`);
      continue;
    }
    const data: PlannedChange["data"] = {};
    const parts: string[] = [];
    if (price !== product.price) {
      data.price = price;
      parts.push(`price ${rupees(product.price)} → ${rupees(price)}`);
    }
    if (mrp !== product.mrp) {
      data.mrp = mrp;
      parts.push(`MRP ${rupees(product.mrp)} → ${rupees(mrp)}`);
    }
    if (row.stock !== undefined && row.stock !== product.stock) {
      data.stock = row.stock;
      parts.push(`stock ${product.stock} → ${row.stock}`);
    }
    if (row.lowStockAlert !== undefined && row.lowStockAlert !== product.lowStockAlert) {
      data.lowStockAlert = row.lowStockAlert;
      parts.push(`alert ${product.lowStockAlert} → ${row.lowStockAlert}`);
    }
    if (row.gstRate !== undefined && row.gstRate !== product.gstRate) {
      data.gstRate = row.gstRate;
      parts.push(`GST ${product.gstRate}% → ${row.gstRate}%`);
    }
    if (parts.length === 0) unchanged++;
    else changes.push({ product, data, summary: `${product.sku}: ${parts.join(", ")}` });
  }
  return { changes, unchanged, unknown, errors };
}
