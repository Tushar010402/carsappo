type Cell = string | number | boolean | null | undefined | Date;

function escapeCell(value: Cell) {
  if (value === null || value === undefined) return "";
  let s = value instanceof Date ? value.toISOString() : String(value);
  // Neutralise spreadsheet formula injection from user-supplied text.
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: Cell[][]) {
  return [header, ...rows].map((r) => r.map(escapeCell).join(",")).join("\r\n");
}

/** CSV download response (UTF-8 BOM so Excel shows ₹ and Hindi names correctly). */
export function csvResponse(filename: string, header: string[], rows: Cell[][]) {
  return new Response(`﻿${toCsv(header, rows)}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename.replace(/[^\w.-]/g, "_")}"`,
      "Cache-Control": "no-store",
    },
  });
}

/** Paise → rupees with 2 decimals for spreadsheets. */
export const csvMoney = (paise: number) => (paise / 100).toFixed(2);
