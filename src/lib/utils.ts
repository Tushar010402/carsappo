import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function absoluteUrl(path = "/") {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Same-site path to send the user to after login, or `fallback` for anything that could leave the site. */
export function safeRedirectPath(input: unknown, fallback = "/") {
  if (typeof input !== "string" || !input.startsWith("/")) return fallback;
  // Browsers drop tabs/newlines and read "\" as "/", so "/\t/evil.com" or "/\\evil.com" would be off-site.
  const cleaned = input.replace(/[\u0000-\u001F\u007F]/g, "");
  if (cleaned.startsWith("//") || cleaned.startsWith("/\\")) return fallback;
  try {
    const url = new URL(cleaned, "http://same-site.invalid");
    if (url.origin !== "http://same-site.invalid") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

export function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

export function whatsappLink(number: string, text?: string) {
  const digits = number.replace(/\D/g, "");
  const withCountry = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCountry}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function youtubeId(url: string | null | undefined) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

/** True if a product was added within the last `days` days (used for the "New" badge). */
export function isRecent(date: Date | string, days = 21) {
  return Date.now() - new Date(date).getTime() < days * 24 * 60 * 60 * 1000;
}

/** Today's date in India as YYYY-MM-DD (for date inputs). */
export function todayInIndia() {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
