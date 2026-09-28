"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import { saveSettingsGroup, type Settings, type SettingsGroup } from "@/lib/settings";
import { INDIAN_STATES } from "@/lib/constants";
import { gstinSchema } from "@/lib/validators";
import { checkbox, formObject, intField, rupeesField } from "@/lib/admin/form";
import { dbError, done, invalid, revalidateAdmin } from "@/lib/admin/server";
import type { ActionState } from "@/lib/admin/types";

/** Settings are stored as strings; empty optional inputs become "". */
const text = (max: number) => z.string().trim().max(max, `Must be at most ${max} characters`).default("");
const required = (label: string, max: number) => z.string({ error: `${label} is required` }).trim().min(1, `${label} is required`).max(max);
const matches = (re: RegExp, message: string, max = 200) =>
  text(max).refine((v) => v === "" || re.test(v), message);
const url = (message = "Enter a full URL starting with https://") => matches(/^https?:\/\/\S+$/i, message, 500);
const media = matches(/^(\/|https?:\/\/)\S+$/i, "Upload an image or enter a full URL", 1000);

function afterSave() {
  revalidateAdmin();
  // Settings feed the root layout (header, footer, metadata, tracking): refresh every page.
  revalidatePath("/", "layout");
}

async function save<G extends SettingsGroup>(group: G, value: Partial<Settings[G]>, message: string) {
  try {
    await saveSettingsGroup(group, value);
    afterSave();
    return done(message);
  } catch (err) {
    return dbError(err);
  }
}

const storeSchema = z.object({
  name: required("Store name", 60),
  legalName: text(120),
  tagline: text(120),
  phone: matches(/^\+?[\d\s-]{8,16}$/, "Enter a valid phone number", 20),
  whatsapp: matches(/^\+?[\d\s-]{10,16}$/, "Enter a WhatsApp number with country code, e.g. 919876543210", 20),
  email: text(120).refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email"),
  address: text(300),
  city: text(80),
  state: z.enum(INDIAN_STATES, { error: "Select a state" }),
  pincode: matches(/^[1-9]\d{5}$/, "Enter a valid 6-digit pincode", 6),
  gstin: text(15)
    .transform((v) => v.toUpperCase())
    .refine((v) => v === "" || gstinSchema.safeParse(v).success, "Enter a valid 15-character GSTIN"),
  logoUrl: media,
  announcement: text(200),
});

export async function saveStoreSettings(_: ActionState, formData: FormData): Promise<ActionState> {
  await assertAdmin();
  const parsed = storeSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  return save("store", parsed.data, "Store details saved");
}

const socialSchema = z.object({
  instagram: url(),
  facebook: url(),
  youtube: url(),
  x: url(),
  linkedin: url(),
  googleReviewsUrl: url(),
});

export async function saveSocialSettings(_: ActionState, formData: FormData): Promise<ActionState> {
  await assertAdmin();
  const parsed = socialSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  return save("social", parsed.data, "Social links saved");
}

const seoSchema = z.object({
  defaultTitle: required("Default title", 120),
  titleTemplate: required("Title template", 80).refine((v) => v.includes("%s"), "Must contain %s where the page title goes"),
  defaultDescription: required("Default description", 320),
  keywords: text(500),
  ogImage: media,
  googleSiteVerification: matches(/^[\w-]{10,100}$/, "Paste only the content value of the google-site-verification meta tag", 100),
});

export async function saveSeoSettings(_: ActionState, formData: FormData): Promise<ActionState> {
  await assertAdmin();
  const parsed = seoSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  return save("seo", parsed.data, "SEO settings saved");
}

// Same formats the storefront <Analytics> component accepts.
const trackingSchema = z.object({
  ga4Id: text(30)
    .transform((v) => v.toUpperCase())
    .refine((v) => v === "" || /^G-[A-Z0-9]{4,}$/.test(v), "GA4 Measurement ID looks like G-XXXXXXXXXX"),
  gtmId: text(30)
    .transform((v) => v.toUpperCase())
    .refine((v) => v === "" || /^GTM-[A-Z0-9]{4,}$/.test(v), "GTM container ID looks like GTM-XXXXXXX"),
  metaPixelId: matches(/^\d{6,20}$/, "Meta Pixel ID is a number, e.g. 123456789012345", 20),
  googleAdsId: text(30)
    .transform((v) => v.toUpperCase())
    .refine((v) => v === "" || /^AW-\d{6,}$/.test(v), "Google Ads ID looks like AW-123456789"),
  googleAdsPurchaseLabel: matches(/^[\w-]{4,}$/, "Conversion label is the part after the slash, e.g. AbC-D_efG", 60),
});

export async function saveTrackingSettings(_: ActionState, formData: FormData): Promise<ActionState> {
  await assertAdmin();
  const parsed = trackingSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  return save("tracking", parsed.data, "Tracking IDs saved");
}

const shippingSchema = z.object({
  freeShippingThreshold: rupeesField("Free shipping threshold", 0, 1_000_000),
  flatShippingFee: rupeesField("Shipping fee", 0, 10_000),
  codEnabled: checkbox,
  codFee: rupeesField("COD fee", 0, 10_000),
  codMaxOrder: rupeesField("COD order limit", 0, 10_000_000),
  dispatchDays: intField("Dispatch days", 0, 30),
  returnWindowDays: intField("Return window", 0, 90),
  shiprocketPickupLocation: required("Pickup location", 80),
});

export async function saveShippingSettings(_: ActionState, formData: FormData): Promise<ActionState> {
  await assertAdmin();
  const parsed = shippingSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  return save("shipping", parsed.data, "Shipping settings saved");
}

const servicesSchema = z.object({
  serviceablePincodes: z
    .string()
    .max(5000)
    .transform((v) => [...new Set(v.split(/[\s,]+/).map((p) => p.trim()).filter(Boolean))])
    .refine((list) => list.every((p) => /^[1-9]\d{5}$/.test(p)), "Every pincode must be 6 digits")
    .transform((list) => list.join(",")),
  serviceAreaNote: text(300),
});

export async function saveServicesSettings(_: ActionState, formData: FormData): Promise<ActionState> {
  await assertAdmin();
  const parsed = servicesSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  return save("services", parsed.data, "Service area saved");
}
