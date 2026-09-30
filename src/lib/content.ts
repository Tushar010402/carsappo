/**
 * Default storefront copy and structure — every value here can be changed in the admin panel
 * (Storefront → Homepage / Navigation & footer, Pages, Services, Shipping). Text may contain
 * {tokens} such as {freeShipping} or {returnDays}; see CONTENT_TOKENS.
 */
import type { ServiceType } from "@prisma/client";
import { formatINR } from "@/lib/format";
import { siteUrl } from "@/lib/utils";

export const HOME_SECTIONS = [
  { id: "vehicle", label: "Shop by vehicle" },
  { id: "categories", label: "Shop by category" },
  { id: "bestSellers", label: "Best sellers" },
  { id: "promo", label: "Promo banner" },
  { id: "featured", label: "Featured products (latest / premium / trending)" },
  { id: "why", label: "Why Carsappo" },
  { id: "reviews", label: "Customer reviews" },
  { id: "cleaning", label: "Daily car cleaning" },
  { id: "instagram", label: "Instagram feed" },
] as const;

export type HomeSectionId = (typeof HOME_SECTIONS)[number]["id"];

export const HOME_DEFAULTS = {
  sections: HOME_SECTIONS.map((s) => ({ id: s.id as string, visible: true })),
  hero: {
    eyebrow: "Premium car care brand · Made for Indian roads",
    title: "Everything Your",
    titleHighlight: "Car Needs.",
    bullets: ["Premium Car Accessories Delivered Across India.", "Daily Car Cleaning Services Available in Greater Noida."],
    primaryLabel: "Shop Accessories",
    primaryHref: "/shop",
    secondaryLabel: "Explore Services",
    secondaryHref: "/services",
    trustLine: "Genuine products · Secure Razorpay payments · Easy {returnDays}-day returns",
  },
  vehicle: {
    eyebrow: "Shop by Vehicle",
    title: "Accessories that fit your car. Exactly.",
    subtitle: "Select your brand, model, year and fuel type — we'll show only compatible products like 7D mats, seat covers, dashboard covers and organisers.",
  },
  categories: { eyebrow: "Shop by Category", title: "Everything for your car, in one place.", linkLabel: "Shop all" },
  bestSellers: { eyebrow: "Best Sellers", title: "Most loved by {storeName} customers.", count: 12 },
  featured: {
    eyebrow: "Featured Products",
    title: "Fresh, premium and trending.",
    latestLabel: "Latest Products",
    premiumLabel: "Premium Collection",
    trendingLabel: "Trending Products",
    count: 8,
  },
  why: {
    eyebrow: "Why {storeName}",
    title: "A car care brand you can trust.",
    points: [
      { icon: "BadgeCheck", title: "Genuine Products", text: "Sourced directly from brands and authorised distributors." },
      { icon: "BadgeIndianRupee", title: "Wholesale Prices", text: "Premium quality at honest prices — no middlemen." },
      { icon: "Truck", title: "Fast Shipping", text: "Dispatched in {dispatchTime}, delivered across India." },
      { icon: "ShieldCheck", title: "Quality Checked", text: "Every order is inspected before it leaves our warehouse." },
      { icon: "Lock", title: "Secure Payments", text: "UPI, cards and net banking via Razorpay. {codShort}" },
      { icon: "Headset", title: "Customer Support", text: "Real humans on WhatsApp, phone and email to help you." },
    ],
  },
  reviews: { eyebrow: "Customer Reviews", title: "Real cars. Real customers." },
  cleaning: {
    badge: "Available only in Greater Noida",
    title: "Daily Car Cleaning, at your doorstep.",
    text: "Wake up to a spotless car every morning. Our trained cleaners use premium waterless products — right at your parking spot.",
    bullets: ["Cleaned before you leave for work", "Scratch-free waterless formula", "Trained, verified cleaners", "Pause or cancel anytime"],
    buttonLabel: "Book Service",
  },
  instagram: { title: "Follow the {storeName} garage", subtitle: "Latest posts, reels, installs and car care hacks." },
};

export const NAVIGATION_DEFAULTS = {
  header: [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    { label: "Services", href: "/services" },
    { label: "Blog", href: "/blog" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  megaPromoTitle: "Shop by Vehicle",
  megaPromoText: "Find accessories that fit your exact car.",
  megaPromoLink: "Select your car",
  footerBlurb: "Premium car accessories and car care products delivered across India, and daily car cleaning in Greater Noida.",
  newsletterTitle: "Join the {storeName} club",
  newsletterText: "Car care tips, new launches and member-only offers. No spam.",
  quickLinks: [
    { label: "Shop all", href: "/shop" },
    { label: "Best sellers", href: "/shop?collection=best-sellers" },
    { label: "New arrivals", href: "/shop?collection=new" },
    { label: "Track order", href: "/track-order" },
    { label: "Blog", href: "/blog" },
    { label: "FAQs", href: "/faq" },
    { label: "About us", href: "/about" },
  ],
  paymentBadges: ["UPI", "Visa", "Mastercard", "RuPay", "Net Banking"],
};

export const ABOUT_DEFAULTS = {
  metaTitle: "About {storeName} — India's Car Care Brand",
  metaDescription:
    "{storeName} is a car care brand for Indian car owners: premium accessories and car care products delivered across India, and daily car cleaning in Greater Noida.",
  eyebrow: "About {storeName}",
  heading: "Everything your car needs.",
  headingHighlight: "Nothing it doesn't.",
  intro:
    "{storeName} is a car care brand built for Indian roads and Indian car owners. We bring premium accessories and car care products to your doorstep anywhere in India — and keep cars spotless every morning with our daily cleaning service in Greater Noida.",
  missionEyebrow: "Our mission",
  missionTitle: "Make premium car care simple, honest and accessible.",
  missionText:
    "Buying car accessories in India often means guessing at fitment, second-guessing quality and paying showroom mark-ups. We started {storeName} to fix that — with products that fit your exact car, sourced directly and priced fairly.\n\nOur long-term goal: to become India's most trusted automotive brand, where customers can buy accessories, car care products and discover trusted services — all under one platform.",
  valuesTitle: "What we stand for",
  values: [
    { icon: "BadgeCheck", title: "Genuine products", text: "Sourced from brands and authorised distributors. No fakes, ever." },
    { icon: "Sparkles", title: "Perfect fit", text: "Shop by vehicle to see only what fits your brand, model, year and fuel type." },
    { icon: "ShieldCheck", title: "Quality checked", text: "Every order is inspected before dispatch." },
    { icon: "Truck", title: "Fast, India-wide delivery", text: "Dispatched within {dispatchTime}, delivered across India." },
    { icon: "HeartHandshake", title: "Real support", text: "Talk to real people on WhatsApp, phone or email." },
    { icon: "Rocket", title: "Always improving", text: "New launches every month, shaped by customer feedback." },
  ],
  primaryEyebrow: "Primary business",
  primaryTitle: "Online car accessories store",
  primaryText: "Mats, seat covers, car care, electronics and more — delivered across India.",
  primaryButton: "Shop accessories",
  primaryHref: "/shop",
  secondaryEyebrow: "Secondary business",
  secondaryTitle: "Daily car cleaning — Greater Noida",
  secondaryText: "Doorstep daily exterior cleaning, interior cleaning, tyre and dashboard polish.",
  secondaryButton: "Explore services",
  secondaryHref: "/services",
};

export const CONTACT_DEFAULTS = {
  heading: "We're here to help.",
  intro: "Questions about fitment, orders, bulk purchases or our daily cleaning service? Reach out — real humans reply fast.",
  supportHours: "Mon–Sat, 9:30 AM – 7:00 PM IST",
  formTitle: "Send us a message",
  successMessage: "Thanks for reaching out! Our team will get back to you within 24 hours.",
  whatsappGreeting: "Hi {storeName}!",
};

export const SERVICE_TYPE_ORDER: ServiceType[] = ["DAILY_EXTERIOR", "INTERIOR", "TYRE_POLISH", "DASHBOARD_POLISH"];

export const SERVICES_CONTENT_DEFAULTS = {
  types: {
    DAILY_EXTERIOR: {
      visible: true,
      label: "Daily Exterior Cleaning",
      short: "Daily Exterior",
      description: "Waterless exterior wipe-down every morning at your parking spot, before you leave for work.",
      included: ["Body, glass and mirrors wiped every morning", "Premium lubricating waterless formula", "Fresh 800 GSM microfiber for every car", "6 days a week, before 10 AM"],
    },
    INTERIOR: {
      visible: true,
      label: "Interior Cleaning",
      short: "Interior",
      description: "Vacuuming, mat cleaning, dashboard and door-pad wipe with premium, safe products.",
      included: ["Full vacuum including boot", "Mats cleaned and dried", "Dashboard, console and door pads detailed", "Interior glass streak-free"],
    },
    TYRE_POLISH: {
      visible: true,
      label: "Tyre Polish",
      short: "Tyre Polish",
      description: "Deep-black, long-lasting tyre dressing that protects rubber from cracking and fading.",
      included: ["All four tyres cleaned", "Water-based, non-sling dressing", "Satin or glossy finish", "UV protection against cracking"],
    },
    DASHBOARD_POLISH: {
      visible: true,
      label: "Dashboard Polish",
      short: "Dashboard Polish",
      description: "Anti-static, UV-protective dashboard polish for a clean matte or glossy finish.",
      included: ["Dust removed from vents and crevices", "Anti-static polish repels dust", "Matte or gloss finish", "UV protection for plastics"],
    },
  },
  timeSlots: ["6:00 AM – 8:00 AM", "8:00 AM – 10:00 AM", "10:00 AM – 12:00 PM", "4:00 PM – 6:00 PM"],
  heroTitle: "Daily Car Cleaning.",
  heroHighlight: "Every morning.",
  heroText:
    "Trained {storeName} cleaners keep your car spotless at your parking spot — exterior every day, plus interior cleaning, tyre polish and dashboard polish.",
  servicesTitle: "Four services. One spotless car.",
  plansTitle: "Simple monthly plans. No hidden charges.",
  plansSubtitle: "Pause or cancel anytime with 3 days' notice.",
  steps: [
    { title: "Book online", text: "Pick a plan, your start date and preferred time slot." },
    { title: "We confirm", text: "Our team calls to confirm your parking spot and car details." },
    { title: "Daily shine", text: "A trained cleaner cleans your car every morning before you leave." },
    { title: "Stay spotless", text: "Weekly tyre polish and regular interior care keep it showroom-fresh." },
  ],
  faqTitle: "Questions, answered.",
  contactTitle: "Still have questions?",
  contactText: "Send us a message and we'll get back to you within a few hours.",
  bookingNote: "No payment now. We'll confirm by phone.",
};

export const DELIVERY_DEFAULTS = {
  zones: [
    { name: "Delhi NCR", prefixes: "110, 120, 121, 122, 124, 201, 203", minDays: 1, maxDays: 3 },
    { name: "Metro cities", prefixes: "400, 401, 411, 560, 600, 700, 500, 380, 302, 226, 160, 141", minDays: 3, maxDays: 5 },
    { name: "North-East, J&K & islands", prefixes: "78, 79, 18, 19, 744, 682", minDays: 6, maxDays: 10 },
  ],
  restName: "Rest of India",
  restMinDays: 4,
  restMaxDays: 7,
  skipSundays: true,
};

/* ─────────────────────────── Tokens ─────────────────────────── */

type TokenSettings = {
  store: { name: string; legalName: string; email: string; phone: string; address: string; gstin: string };
  shipping: { freeShippingThreshold: number; flatShippingFee: number; codEnabled: boolean; codFee: number; codMaxOrder: number; dispatchDays: number; returnWindowDays: number };
  services?: { serviceAreaNote: string };
  delivery?: typeof DELIVERY_DEFAULTS;
};

export const CONTENT_TOKENS: { token: string; description: string }[] = [
  { token: "{storeName}", description: "Store name" },
  { token: "{legalName}", description: "Legal / registered name" },
  { token: "{email}", description: "Support email" },
  { token: "{phone}", description: "Phone number" },
  { token: "{contact}", description: "Email and phone together" },
  { token: "{address}", description: "Registered address" },
  { token: "{gstin}", description: "GSTIN" },
  { token: "{registeredEntity}", description: "Legal name with address and GSTIN (when set)" },
  { token: "{grievanceOfficer}", description: "Legal name with address, for grievance notices" },
  { token: "{website}", description: "Website address, e.g. carsappo.com" },
  { token: "{freeShipping}", description: "Free-shipping threshold, e.g. ₹999" },
  { token: "{shippingFee}", description: "Flat shipping fee" },
  { token: "{codFee}", description: "Cash on delivery fee" },
  { token: "{codLimit}", description: "Largest order allowed on COD" },
  { token: "{codShort}", description: "“Cash on delivery available.” (empty when COD is off)" },
  { token: "{codNote}", description: "COD bullet for policies (empty when COD is off)" },
  { token: "{dispatchTime}", description: "Dispatch time, e.g. “24 hours”" },
  { token: "{returnDays}", description: "Return window in days" },
  { token: "{serviceArea}", description: "Car cleaning service-area note" },
  { token: "{deliveryTable}", description: "Delivery-time table built from your delivery zones" },
];

export function deliveryTable(delivery: typeof DELIVERY_DEFAULTS = DELIVERY_DEFAULTS) {
  const range = (a: number, b: number) => (a === b ? `${a} day${a === 1 ? "" : "s"}` : `${a}–${b} days`);
  return [
    "| Region | Estimated delivery after dispatch |",
    "|---|---|",
    ...delivery.zones.map((z) => `| ${z.name} | ${range(z.minDays, z.maxDays)} |`),
    `| ${delivery.restName} | ${range(delivery.restMinDays, delivery.restMaxDays)} |`,
  ].join("\n");
}

export function contentTokens(s: TokenSettings): Record<string, string> {
  const email = s.store.email;
  const ship = s.shipping;
  const legalName = s.store.legalName || s.store.name;
  const withAddress = `${legalName}${s.store.address ? `, ${s.store.address}` : ""}`;
  return {
    storeName: s.store.name,
    legalName,
    registeredEntity: `${withAddress}${s.store.gstin ? ` (GSTIN ${s.store.gstin})` : ""}`,
    grievanceOfficer: withAddress,
    website: new URL(siteUrl()).host,
    email,
    phone: s.store.phone,
    contact: [email, s.store.phone].filter(Boolean).join(" or "),
    address: s.store.address,
    gstin: s.store.gstin,
    freeShipping: formatINR(ship.freeShippingThreshold),
    shippingFee: formatINR(ship.flatShippingFee),
    codFee: formatINR(ship.codFee),
    codLimit: formatINR(ship.codMaxOrder),
    codShort: ship.codEnabled ? "Cash on delivery available." : "",
    codNote: ship.codEnabled ? `- Cash on Delivery is available on most pincodes for an additional ${formatINR(ship.codFee)}.` : "",
    dispatchTime: ship.dispatchDays <= 1 ? "24 hours" : `${ship.dispatchDays} business days`,
    returnDays: String(ship.returnWindowDays),
    serviceArea: s.services?.serviceAreaNote ?? "",
    deliveryTable: deliveryTable(s.delivery),
  };
}

/** Replaces {token}s with values; unknown tokens are left as typed. */
export function fillTokens(text: string, tokens: Record<string, string>) {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => (key in tokens ? tokens[key] : match)).trim();
}
