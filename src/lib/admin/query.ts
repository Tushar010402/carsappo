import { firstParam } from "@/lib/utils";

export type SearchParams = Record<string, string | string[] | undefined>;

export const ADMIN_PAGE_SIZE = 25;

export function param(sp: SearchParams, key: string) {
  return firstParam(sp[key])?.trim() || undefined;
}

export function pageParam(sp: SearchParams) {
  const n = Number(firstParam(sp.page));
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

/** Picks a value only if it is one of the allowed options. */
export function enumParam<T extends string>(sp: SearchParams, key: string, allowed: readonly T[]): T | undefined {
  const v = param(sp, key);
  return allowed.find((a) => a === v);
}

/** Builds a query string from the current params with overrides (undefined/"" removes a key). */
export function withParams(base: string, sp: SearchParams, overrides: Record<string, string | number | undefined | null>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const value = firstParam(v);
    if (value) qs.set(k, value);
  }
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined || v === null || v === "") qs.delete(k);
    else qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Start of the given calendar day (YYYY-MM-DD) in IST, as a UTC Date. */
export function istDayStart(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) - IST_OFFSET_MS);
}

/** Today's date (YYYY-MM-DD) in IST. */
export function istToday(date = new Date()) {
  return new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export function isYmd(v: string | undefined): v is string {
  return !!v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
}

/** Parses ?from=YYYY-MM-DD&to=YYYY-MM-DD into an IST [gte, lt) range. */
export function dateRange(sp: SearchParams, defaults?: { from: string; to: string }) {
  const fromRaw = param(sp, "from");
  const toRaw = param(sp, "to");
  const from = isYmd(fromRaw) ? fromRaw : defaults?.from;
  const to = isYmd(toRaw) ? toRaw : defaults?.to;
  const gte = from ? istDayStart(from) : undefined;
  const lt = to ? new Date(istDayStart(to).getTime() + 24 * 60 * 60 * 1000) : undefined;
  return { from, to, gte, lt };
}

/** First and last day (YYYY-MM-DD) of the current IST month. */
export function currentMonthRange(date = new Date()) {
  const today = istToday(date);
  const [y, m] = today.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${today.slice(0, 7)}-01`, to: `${today.slice(0, 7)}-${String(last).padStart(2, "0")}`, month: `${y}-${String(m).padStart(2, "0")}` };
}

/** Date → "YYYY-MM-DDTHH:mm" in IST, for <input type="datetime-local">. */
export function toIstInput(date: Date | null | undefined) {
  if (!date) return "";
  return new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 16);
}
