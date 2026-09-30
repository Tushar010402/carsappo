"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth";
import { saveSettingsGroup, type Settings, type SettingsGroup } from "@/lib/settings";
import { FEATURE_ICON_NAMES } from "@/components/icons/feature-icon";
import { HOME_SECTIONS, SERVICE_TYPE_ORDER } from "@/lib/content";
import { checkbox, formObject, intField, jsonField, stringList } from "@/lib/admin/form";
import { dbError, done, invalid, revalidateAdmin } from "@/lib/admin/server";
import type { ActionState } from "@/lib/admin/types";

/* Storefront copy: Admin → Storefront (homepage, navigation & footer), Pages (About, Contact),
   Services (service content) and Shipping (delivery zones). Every group is deep-merged, so each
   panel saves only its own fields. */

const text = (max: number) => z.string().trim().max(max, `Must be at most ${max} characters`).default("");
const required = (label: string, max: number) => z.string({ error: `${label} is required` }).trim().min(1, `${label} is required`).max(max);
const href = (label = "Link") =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(300)
    .refine((s) => s.startsWith("/") || s.startsWith("#") || /^https?:\/\//i.test(s) || /^(mailto|tel):/i.test(s), "Enter a path like /shop or a full URL");
const optionalHref = z.union([z.literal(""), href()]).default("");
const link = z.object({ label: required("Label", 40), href: href() });
const icon = z.string().refine((v) => FEATURE_ICON_NAMES.includes(v), "Choose an icon");
const iconCard = z.object({ icon, title: required("Title", 80), text: text(300) });

/** "hero.title" → { hero: { title } } so nested form field names map onto settings groups. */
function nest(flat: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [path, value] of Object.entries(flat)) {
    const keys = path.split(".");
    let node = out;
    keys.slice(0, -1).forEach((k) => (node = (node[k] ??= {}) as Record<string, unknown>));
    node[keys.at(-1)!] = value;
  }
  return out;
}

async function save<G extends SettingsGroup>(group: G, value: Partial<Settings[G]>, message: string): Promise<ActionState> {
  try {
    await saveSettingsGroup(group, value);
    revalidateAdmin();
    revalidatePath("/", "layout");
    return done(message);
  } catch (err) {
    return dbError(err);
  }
}

async function parseAndSave<G extends SettingsGroup>(group: G, schema: z.ZodType, formData: FormData, message: string) {
  await assertAdmin();
  const parsed = schema.safeParse(nest(formObject(formData)));
  if (!parsed.success) return invalid(parsed.error);
  return save(group, parsed.data as Partial<Settings[G]>, message);
}

/* ───────────── Homepage ───────────── */

const sectionIds = HOME_SECTIONS.map((s) => s.id) as string[];
const eyebrowTitle = z.object({ eyebrow: text(60), title: required("Heading", 120) });

const HOME_PARTS = {
  layout: z.object({
    sections: jsonField(z.array(z.object({ id: z.string().refine((id) => sectionIds.includes(id)), visible: z.boolean() })).max(20)),
    bestSellers: z.object({ count: intField("Best sellers to show", 1, 24) }),
    featured: z.object({ count: intField("Products per tab", 1, 24) }),
  }),
  hero: z.object({
    hero: z.object({
      eyebrow: text(80),
      title: required("Title", 60),
      titleHighlight: text(40),
      bullets: stringList(4, 120),
      primaryLabel: text(30),
      primaryHref: optionalHref,
      secondaryLabel: text(30),
      secondaryHref: optionalHref,
      trustLine: text(160),
    }),
  }),
  headings: z.object({
    vehicle: eyebrowTitle.extend({ subtitle: text(300) }),
    categories: eyebrowTitle.extend({ linkLabel: text(30) }),
    bestSellers: eyebrowTitle,
    featured: eyebrowTitle.extend({ latestLabel: text(40), premiumLabel: text(40), trendingLabel: text(40) }),
    why: eyebrowTitle,
    reviews: eyebrowTitle,
    instagram: z.object({ title: required("Heading", 120), subtitle: text(200) }),
  }),
  why: z.object({ why: z.object({ points: jsonField(z.array(iconCard).max(12)) }) }),
  cleaning: z.object({
    cleaning: z.object({ badge: text(80), title: required("Heading", 120), text: text(400), bullets: stringList(8, 100), buttonLabel: required("Button label", 30) }),
  }),
};

export async function saveHomeContent(part: keyof typeof HOME_PARTS, _: ActionState, formData: FormData): Promise<ActionState> {
  return parseAndSave("home", HOME_PARTS[part], formData, "Homepage updated");
}

/* ───────────── Navigation & footer ───────────── */

const NAVIGATION_PARTS = {
  header: z.object({
    header: jsonField(z.array(link).min(1, "Add at least one menu item").max(10)),
    megaPromoTitle: text(60),
    megaPromoText: text(120),
    megaPromoLink: text(40),
  }),
  footer: z.object({
    footerBlurb: text(300),
    newsletterTitle: text(60),
    newsletterText: text(160),
    quickLinks: jsonField(z.array(link).max(15)),
    paymentBadges: stringList(10, 20),
  }),
};

export async function saveNavigation(part: keyof typeof NAVIGATION_PARTS, _: ActionState, formData: FormData): Promise<ActionState> {
  return parseAndSave("navigation", NAVIGATION_PARTS[part], formData, "Navigation & footer updated");
}

/* ───────────── About & Contact pages ───────────── */

const aboutSchema = z.object({
  metaTitle: text(80),
  metaDescription: text(200),
  eyebrow: text(60),
  heading: required("Heading", 100),
  headingHighlight: text(60),
  intro: text(800),
  missionEyebrow: text(60),
  missionTitle: text(160),
  missionText: text(3000),
  valuesTitle: text(80),
  values: jsonField(z.array(iconCard).max(12)),
  primaryEyebrow: text(60),
  primaryTitle: text(100),
  primaryText: text(300),
  primaryButton: text(30),
  primaryHref: optionalHref,
  secondaryEyebrow: text(60),
  secondaryTitle: text(100),
  secondaryText: text(300),
  secondaryButton: text(30),
  secondaryHref: optionalHref,
});

export async function saveAboutPage(_: ActionState, formData: FormData): Promise<ActionState> {
  return parseAndSave("about", aboutSchema, formData, "About page saved");
}

const contactSchema = z.object({
  heading: required("Heading", 100),
  intro: text(400),
  supportHours: text(80),
  formTitle: required("Form title", 60),
  successMessage: required("Thank-you message", 200),
  whatsappGreeting: text(100),
});

export async function saveContactPage(_: ActionState, formData: FormData): Promise<ActionState> {
  return parseAndSave("contact", contactSchema, formData, "Contact page saved");
}

/* ───────────── Services content ───────────── */

const serviceTypeContent = z.object({
  visible: checkbox,
  label: required("Service name", 60),
  short: required("Short name", 30),
  description: text(300),
  included: stringList(10, 120),
});

const servicesContentSchema = z
  .object({
    types: z.object(Object.fromEntries(SERVICE_TYPE_ORDER.map((t) => [t, serviceTypeContent])) as Record<(typeof SERVICE_TYPE_ORDER)[number], typeof serviceTypeContent>),
    timeSlots: stringList(12, 40).refine((l) => l.length > 0, "Add at least one time slot"),
    heroTitle: required("Heading", 80),
    heroHighlight: text(60),
    heroText: text(400),
    servicesTitle: text(100),
    plansTitle: text(100),
    plansSubtitle: text(160),
    steps: jsonField(z.array(z.object({ title: required("Step title", 60), text: text(200) })).max(6)),
    faqTitle: text(80),
    contactTitle: text(80),
    contactText: text(200),
    bookingNote: text(160),
  })
  .refine((d) => Object.values(d.types).some((t) => t.visible), { message: "Keep at least one service visible", path: ["types"] });

export async function saveServicesContent(_: ActionState, formData: FormData): Promise<ActionState> {
  return parseAndSave("services", servicesContentSchema, formData, "Service content saved");
}

/* ───────────── Delivery zones ───────────── */

const days = (label: string) => intField(label, 0, 60);
const deliverySchema = z
  .object({
    zones: jsonField(
      z
        .array(
          z
            .object({
              name: required("Zone name", 60),
              prefixes: z
                .string()
                .trim()
                .min(1, "Add pincode prefixes")
                .max(1000)
                .refine((v) => v.split(/[\s,]+/).filter(Boolean).every((p) => /^\d{1,6}$/.test(p)), "Prefixes are 1–6 digit numbers separated by commas"),
              minDays: days("Minimum days"),
              maxDays: days("Maximum days"),
            })
            .refine((z) => z.minDays <= z.maxDays, "Minimum days can't exceed maximum days"),
        )
        .max(20),
    ),
    restName: required("Name", 60),
    restMinDays: days("Minimum days"),
    restMaxDays: days("Maximum days"),
    skipSundays: checkbox,
  })
  .refine((d) => d.restMinDays <= d.restMaxDays, { message: "Minimum days can't exceed maximum days", path: ["restMaxDays"] });

export async function saveDeliveryZones(_: ActionState, formData: FormData): Promise<ActionState> {
  return parseAndSave("delivery", deliverySchema, formData, "Delivery zones saved");
}
