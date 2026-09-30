import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import type { ServiceType } from "@prisma/client";
import {
  ABOUT_DEFAULTS,
  CONTACT_DEFAULTS,
  DELIVERY_DEFAULTS,
  HOME_DEFAULTS,
  HOME_SECTIONS,
  NAVIGATION_DEFAULTS,
  SERVICE_TYPE_ORDER,
  SERVICES_CONTENT_DEFAULTS,
  contentTokens,
  fillTokens,
} from "@/lib/content";

/**
 * Admin-editable settings, stored as one JSON document per group in the `Setting` table.
 * Secrets (API keys, passwords) live in environment variables, never here.
 */
export const SETTINGS_DEFAULTS = {
  store: {
    name: "Carsappo",
    tagline: "Everything Your Car Needs.",
    legalName: "Carsappo",
    phone: "",
    whatsapp: "",
    email: "support@carsappo.com",
    address: "Greater Noida, Uttar Pradesh",
    city: "Greater Noida",
    state: "Uttar Pradesh",
    pincode: "201310",
    gstin: "",
    logoUrl: "",
    announcement: "Free shipping on orders above ₹999 · Daily car cleaning now live in Greater Noida",
  },
  social: {
    instagram: "https://www.instagram.com/carsappo",
    facebook: "",
    youtube: "",
    x: "",
    linkedin: "",
    googleReviewsUrl: "",
  },
  seo: {
    defaultTitle: "Carsappo — Everything Your Car Needs | Premium Car Accessories India",
    titleTemplate: "%s | Carsappo",
    defaultDescription:
      "Shop premium car accessories and car care products online across India — 7D mats, seat covers, polishes, microfiber, vacuum cleaners and perfumes. Daily car cleaning in Greater Noida.",
    keywords: "car accessories, car care products, 7D car mats, seat covers, car perfume, car vacuum cleaner, car cleaning Greater Noida",
    ogImage: "/images/og-default.png",
    googleSiteVerification: "",
  },
  tracking: {
    ga4Id: "",
    gtmId: "",
    metaPixelId: "",
    googleAdsId: "",
    googleAdsPurchaseLabel: "",
  },
  shipping: {
    freeShippingThreshold: 99900, // paise
    flatShippingFee: 7900,
    codEnabled: true,
    codFee: 4900,
    codMaxOrder: 1000000,
    dispatchDays: 1,
    shiprocketPickupLocation: "Primary",
    returnWindowDays: 7,
  },
  services: {
    serviceablePincodes: "201306,201308,201310,201312,201315,201318,203207,201009",
    serviceAreaNote: "Currently available only in Greater Noida (incl. Greater Noida West).",
    ...SERVICES_CONTENT_DEFAULTS,
  },
  // Storefront content (Admin → Storefront / Pages); see src/lib/content.ts.
  home: HOME_DEFAULTS,
  navigation: NAVIGATION_DEFAULTS,
  about: ABOUT_DEFAULTS,
  contact: CONTACT_DEFAULTS,
  delivery: DELIVERY_DEFAULTS,
};

type Widen<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends readonly (infer U)[]
        ? Widen<U>[]
        : { -readonly [K in keyof T]: Widen<T[K]> };

export type Settings = Widen<typeof SETTINGS_DEFAULTS>;
export type SettingsGroup = keyof Settings;

const defaults = () => structuredClone(SETTINGS_DEFAULTS) as unknown as Settings;

const isPlainObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Saved values over defaults, recursively for nested objects (arrays are replaced whole), so new default keys still apply. */
function deepMerge<T>(base: T, saved: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(saved)) return (saved === undefined ? base : saved) as T;
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(saved)) out[key] = key in base ? deepMerge((base as Record<string, unknown>)[key], value) : value;
  return out as T;
}

/** Defaults overlaid with the saved rows. Throws if the database is unreachable. */
async function loadSettings(): Promise<Settings> {
  const result = defaults();
  const rows = await prisma.setting.findMany();
  for (const row of rows) {
    if (!(row.key in result)) continue;
    try {
      const group = row.key as SettingsGroup;
      (result as Record<string, unknown>)[group] = deepMerge(result[group], JSON.parse(row.value));
    } catch {
      // ignore corrupt rows; defaults apply
    }
  }
  return result;
}

const cachedSettings = unstable_cache(loadSettings, ["settings-v2"], { tags: ["settings"], revalidate: 300 });

export async function getSettings(): Promise<Settings> {
  try {
    return await cachedSettings();
  } catch (err) {
    // Keep pages rendering (e.g. a build without DB access) with defaults — without caching them,
    // so the real settings appear as soon as the database is reachable.
    console.warn("[settings] could not load settings, using defaults:", (err as Error).message);
    return defaults();
  }
}

export async function saveSettingsGroup<G extends SettingsGroup>(group: G, value: Partial<Settings[G]>) {
  const current = (await loadSettings())[group];
  const merged = deepMerge(current, value);
  await prisma.setting.upsert({
    where: { key: group },
    create: { key: group, value: JSON.stringify(merged) },
    update: { value: JSON.stringify(merged) },
  });
  revalidateTag("settings", { expire: 0 });
}

export function servicePincodes(settings: Settings) {
  return settings.services.serviceablePincodes
    .split(/[\s,]+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Fills {tokens} (store name, shipping numbers, delivery table…) in admin-written copy. */
export function renderText(settings: Settings, text: string) {
  return fillTokens(text, contentTokens(settings));
}

/** A `renderText` bound to one settings snapshot, for pages that fill many strings. */
export function textRenderer(settings: Settings) {
  const tokens = contentTokens(settings);
  return (text: string) => fillTokens(text, tokens);
}

/** Car cleaning services as named in Admin → Services, in display order (hidden ones left out unless asked). */
export function serviceTypes(settings: Settings, { includeHidden = false } = {}) {
  return SERVICE_TYPE_ORDER.map((value) => ({ value, ...settings.services.types[value] })).filter((t) => includeHidden || t.visible);
}

export function serviceName(settings: Settings, value: ServiceType) {
  return settings.services.types[value]?.label || value;
}

/** Homepage sections in the saved order; sections added in later releases are appended, visible. */
export function homeSections(settings: Settings) {
  const known = new Set<string>(HOME_SECTIONS.map((s) => s.id));
  const saved = settings.home.sections.filter((s) => known.has(s.id));
  const missing = HOME_SECTIONS.filter((s) => !saved.some((x) => x.id === s.id)).map((s) => ({ id: s.id as string, visible: true }));
  return [...saved, ...missing];
}
