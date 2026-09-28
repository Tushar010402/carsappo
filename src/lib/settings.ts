import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";

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
  },
} as const;

type Widen<T> = T extends string ? string : T extends number ? number : T extends boolean ? boolean : { -readonly [K in keyof T]: Widen<T[K]> };

export type Settings = Widen<typeof SETTINGS_DEFAULTS>;
export type SettingsGroup = keyof Settings;

async function loadSettings(): Promise<Settings> {
  const result = structuredClone(SETTINGS_DEFAULTS) as unknown as Settings;
  let rows: { key: string; value: string }[] = [];
  try {
    rows = await prisma.setting.findMany();
  } catch (err) {
    // Keep the storefront rendering (e.g. during a build without DB access) with defaults.
    console.warn("[settings] could not load settings, using defaults:", (err as Error).message);
    return result;
  }
  for (const row of rows) {
    if (!(row.key in result)) continue;
    try {
      const parsed = JSON.parse(row.value);
      const group = row.key as SettingsGroup;
      Object.assign(result[group], parsed);
    } catch {
      // ignore corrupt rows; defaults apply
    }
  }
  return result;
}

export const getSettings = unstable_cache(loadSettings, ["settings-v1"], { tags: ["settings"], revalidate: 300 });

export async function saveSettingsGroup<G extends SettingsGroup>(group: G, value: Partial<Settings[G]>) {
  const current = (await loadSettings())[group];
  const merged = { ...current, ...value };
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
