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

/** Parses CSV text (RFC 4180: quoted fields, "" escapes, CRLF/LF, optional BOM). Blank lines are dropped. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === "") quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/** Undoes the formula-injection guard `toCsv` adds ('=… → =…). */
export function csvText(value: string | undefined) {
  const s = (value ?? "").trim();
  return /^'[=+\-@]/.test(s) ? s.slice(1) : s;
}
