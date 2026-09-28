const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrPrecise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format an amount in paise as Indian Rupees, e.g. 149900 → ₹1,499 */
export function formatINR(paise: number, precise = false) {
  const rupees = paise / 100;
  if (precise || !Number.isInteger(rupees)) return inrPrecise.format(rupees);
  return inr.format(rupees);
}

export function rupeesToPaise(rupees: number | string) {
  const n = typeof rupees === "string" ? parseFloat(rupees) : rupees;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function paiseToRupees(paise: number) {
  return Math.round(paise) / 100;
}

export function discountPercent(price: number, mrp?: number | null) {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});
const shortDateFmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

export function formatDate(d: Date | string) {
  return dateFmt.format(new Date(d));
}

export function formatDateTime(d: Date | string) {
  return dateTimeFmt.format(new Date(d));
}

export function formatShortDate(d: Date | string) {
  return shortDateFmt.format(new Date(d));
}

export function titleCase(s: string) {
  return s
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
