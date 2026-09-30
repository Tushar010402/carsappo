import type { Metadata } from "next";
import { Armchair, CalendarCheck, Check, CircleDot, Gauge, MapPin, Phone, Sparkles, Star, Wand2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSettings, servicePincodes, serviceTypes, textRenderer } from "@/lib/settings";
import { formatINR } from "@/lib/format";
import { faqJsonLd, localBusinessJsonLd, pageMetadata } from "@/lib/seo";
import { ButtonLink } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import { JsonLd } from "@/components/ui/json-ld";
import { SectionHeader } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ContactForm } from "@/components/services/contact-form";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, cheapest] = await Promise.all([
    getSettings(),
    prisma.servicePlan.findFirst({ where: { isActive: true, period: "MONTHLY" }, orderBy: { price: "asc" }, select: { price: true } }).catch(() => null),
  ]);
  const names = serviceTypes(settings).map((t) => t.label.toLowerCase());
  return pageMetadata({
    title: "Daily Car Cleaning in Greater Noida — Doorstep Plans",
    description: `Daily doorstep car cleaning in Greater Noida${cheapest ? ` from ${formatINR(cheapest.price)}/month` : ""}: ${names.join(", ")} by trained ${settings.store.name} cleaners.`,
    path: "/services",
  });
}

const ICONS = { DAILY_EXTERIOR: Sparkles, INTERIOR: Armchair, TYRE_POLISH: CircleDot, DASHBOARD_POLISH: Gauge } as const;
const STEP_ICONS = [CalendarCheck, Phone, Wand2, Sparkles];


export default async function ServicesPage() {
  const [settings, plans, faqs] = await Promise.all([
    getSettings(),
    prisma.servicePlan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.faq.findMany({ where: { scope: "SERVICES", isActive: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  const monthly = plans.filter((p) => p.period === "MONTHLY");
  const oneTime = plans.filter((p) => p.period === "ONE_TIME");
  const pincodes = servicePincodes(settings);
  const minPrice = monthly.length ? Math.min(...monthly.map((p) => p.price)) : null;
  const t = textRenderer(settings);
  const c = settings.services;
  const types = serviceTypes(settings);
  const prices = plans.map((p) => p.price);

  return (
    <>
      <JsonLd
        data={localBusinessJsonLd({
          name: `${settings.store.name} Daily Car Cleaning`,
          phone: settings.store.phone,
          areaServed: settings.store.city || "Greater Noida",
          priceRange: prices.length ? `${formatINR(Math.min(...prices))} – ${formatINR(Math.max(...prices))}` : "",
        })}
      />
      <JsonLd data={faqJsonLd(faqs)} />

      <section className="relative isolate overflow-hidden bg-ink text-white">
        <div className="dot-grid absolute inset-0 -z-10" />
        <div className="absolute -top-32 -left-32 -z-10 size-[520px] rounded-full bg-brand/15 blur-3xl" />
        <div className="container-x py-16 sm:py-24">
          <Breadcrumbs light items={[{ name: "Services", path: "/services" }]} />
          <p className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-ink">
            <MapPin className="size-3.5" /> {t(settings.home.cleaning.badge)}
          </p>
          <h1 className="mt-6 max-w-3xl text-5xl leading-[1.05] font-semibold sm:text-6xl">
            {t(c.heroTitle)} {c.heroHighlight && <span className="text-brand">{t(c.heroHighlight)}</span>}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-zinc-300">
            {t(c.heroText)}
            {minPrice !== null && ` Plans from ${formatINR(minPrice)}/month.`}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/services/book" size="lg">
              Book Service
            </ButtonLink>
            <ButtonLink href="#pricing" size="lg" variant="outline-light">
              View pricing plans
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="container-x py-20 sm:py-24">
        <SectionHeader eyebrow="What we do" title={t(c.servicesTitle)} />
        <div className="grid gap-4 md:grid-cols-2">
          {types.map((s) => {
            const Icon = ICONS[s.value];
            return (
              <article key={s.value} id={s.value.toLowerCase().replace(/_/g, "-")} className="scroll-mt-28 rounded-[28px] border border-line p-7">
                <span className="grid size-12 place-items-center rounded-2xl bg-brand">
                  <Icon className="size-6" strokeWidth={1.8} />
                </span>
                <h2 className="mt-5 text-2xl font-semibold">{s.label}</h2>
                <p className="mt-2 text-muted">{s.description}</p>
                <ul className="mt-5 space-y-2">
                  {s.included.map((i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" /> {i}
                    </li>
                  ))}
                </ul>
                <ButtonLink href={`/services/book?type=${s.value}`} variant="outline" size="sm" className="mt-6">
                  Book {s.short}
                </ButtonLink>
              </article>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-24 bg-mist">
        <div className="container-x py-20 sm:py-24">
          <SectionHeader eyebrow="Pricing plans" title={t(c.plansTitle)} subtitle={t(c.plansSubtitle)} />
          <div className="grid gap-4 lg:grid-cols-3">
            {monthly.map((p) => (
              <div key={p.id} className={cn("relative flex flex-col rounded-[28px] p-7", p.isPopular ? "bg-ink text-white shadow-lift" : "border border-line bg-white")}>
                {p.isPopular && (
                  <span className="absolute -top-3 left-7 inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-xs font-bold text-ink">
                    <Star className="size-3 fill-current" /> Most popular
                  </span>
                )}
                <p className={cn("text-sm font-medium", p.isPopular ? "text-zinc-400" : "text-muted")}>{p.vehicleSize}</p>
                <h3 className="mt-1 text-xl font-semibold">{p.name}</h3>
                <p className="mt-5">
                  <span className="font-display text-4xl font-semibold">{formatINR(p.price)}</span>
                  <span className={p.isPopular ? "text-zinc-400" : "text-muted"}>/month</span>
                </p>
                <p className={cn("mt-3 text-sm", p.isPopular ? "text-zinc-300" : "text-muted")}>{p.description}</p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2 text-sm">
                      <Check className={cn("mt-0.5 size-4 shrink-0", p.isPopular ? "text-brand" : "text-success")} /> {f}
                    </li>
                  ))}
                </ul>
                <ButtonLink href={`/services/book?type=${p.serviceType}&plan=${p.id}`} variant={p.isPopular ? "primary" : "dark"} className="mt-8 w-full">
                  Choose plan
                </ButtonLink>
              </div>
            ))}
          </div>
          {oneTime.length > 0 && (
            <>
              <h3 className="mt-16 mb-6 text-2xl font-semibold">One-time services</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {oneTime.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-white p-5">
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="mt-1 text-sm text-muted">{p.description}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-xl font-semibold">{formatINR(p.price)}</p>
                      <a href={`/services/book?type=${p.serviceType}&plan=${p.id}`} className="text-sm font-semibold underline">
                        Book
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="container-x py-20 sm:py-24">
        <SectionHeader eyebrow="How it works" title="Book in 2 minutes." />
        <ol className={cn("grid gap-4", c.steps.length >= 4 ? "md:grid-cols-4" : "md:grid-cols-3")}>
          {c.steps.map((step, i) => {
            const Icon = STEP_ICONS[i % STEP_ICONS.length];
            return (
              <li key={`${i}-${step.title}`} className="rounded-[28px] border border-line p-6">
                <p className="font-display text-sm font-semibold text-muted">{String(i + 1).padStart(2, "0")}</p>
                <Icon className="mt-4 size-7" strokeWidth={1.6} />
                <h3 className="mt-4 text-lg font-semibold">{t(step.title)}</h3>
                <p className="mt-1 text-sm text-muted">{t(step.text)}</p>
              </li>
            );
          })}
        </ol>
        <div className="mt-10 rounded-[28px] bg-brand-soft p-7">
          <p className="flex items-center gap-2 font-semibold">
            <MapPin className="size-5" /> Service area
          </p>
          <p className="mt-2 text-sm">{settings.services.serviceAreaNote}</p>
          {pincodes.length > 0 && <p className="mt-2 text-sm text-muted">Serviceable pincodes: {pincodes.join(", ")}</p>}
        </div>
      </section>

      {/* FAQs + contact */}
      <section id="faqs" className="scroll-mt-24 bg-mist">
        <div className="container-x grid gap-12 py-20 sm:py-24 lg:grid-cols-2">
          <div>
            <SectionHeader eyebrow="FAQs" title={t(c.faqTitle)} />
            <Accordion items={faqs.map((f) => ({ q: f.question, a: f.answer }))} />
          </div>
          <div className="rounded-[28px] bg-white p-7">
            <h2 className="text-2xl font-semibold">{t(c.contactTitle)}</h2>
            <p className="mt-2 mb-6 text-sm text-muted">{t(c.contactText)}</p>
            <ContactForm defaultSubject="Daily car cleaning enquiry" />
          </div>
        </div>
      </section>
    </>
  );
}
