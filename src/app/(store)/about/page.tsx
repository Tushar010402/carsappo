import type { Metadata } from "next";
import { BadgeCheck, HeartHandshake, Rocket, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { ButtonLink } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const metadata: Metadata = pageMetadata({
  title: "About Carsappo — India's Car Care Brand",
  description: "Carsappo is a car care brand for Indian car owners: premium accessories and car care products delivered across India, and daily car cleaning in Greater Noida.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <section className="container-x py-10 sm:py-14">
        <Breadcrumbs items={[{ name: "About", path: "/about" }]} />
        <p className="eyebrow mt-10">About Carsappo</p>
        <h1 className="mt-4 max-w-4xl text-5xl leading-[1.05] font-semibold sm:text-6xl">
          Everything your car needs. <span className="text-brand-dark">Nothing it doesn&apos;t.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">
          Carsappo is a car care brand built for Indian roads and Indian car owners. We bring premium accessories and car care products to your doorstep anywhere in
          India — and keep cars spotless every morning with our daily cleaning service in Greater Noida.
        </p>
      </section>

      <section className="bg-ink text-white">
        <div className="container-x grid gap-12 py-20 lg:grid-cols-2">
          <div>
            <p className="eyebrow text-brand">Our mission</p>
            <h2 className="mt-4 text-3xl leading-tight font-semibold sm:text-4xl">Make premium car care simple, honest and accessible.</h2>
          </div>
          <div className="space-y-5 text-zinc-300">
            <p>
              Buying car accessories in India often means guessing at fitment, second-guessing quality and paying showroom mark-ups. We started Carsappo to fix that —
              with products that fit your exact car, sourced directly and priced fairly.
            </p>
            <p>
              Our long-term goal: to become India&apos;s most trusted automotive brand, where customers can buy accessories, car care products and discover trusted
              services — all under one platform.
            </p>
          </div>
        </div>
      </section>

      <section className="container-x py-20">
        <h2 className="text-3xl font-semibold sm:text-4xl">What we stand for</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: BadgeCheck, title: "Genuine products", text: "Sourced from brands and authorised distributors. No fakes, ever." },
            { icon: Sparkles, title: "Perfect fit", text: "Shop by vehicle to see only what fits your brand, model, year and fuel type." },
            { icon: ShieldCheck, title: "Quality checked", text: "Every order is inspected before dispatch." },
            { icon: Truck, title: "Fast, India-wide delivery", text: "Dispatched within 24 hours, delivered across India." },
            { icon: HeartHandshake, title: "Real support", text: "Talk to real people on WhatsApp, phone or email." },
            { icon: Rocket, title: "Always improving", text: "New launches every month, shaped by customer feedback." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-[28px] border border-line p-7">
              <Icon className="size-7" strokeWidth={1.6} />
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-x pb-24">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[28px] bg-brand p-8 sm:p-10">
            <p className="eyebrow text-ink/60">Primary business</p>
            <h3 className="mt-3 text-2xl font-semibold">Online car accessories store</h3>
            <p className="mt-2 text-ink/70">Mats, seat covers, car care, electronics and more — delivered across India.</p>
            <ButtonLink href="/shop" variant="dark" className="mt-6">
              Shop accessories
            </ButtonLink>
          </div>
          <div className="rounded-[28px] bg-mist p-8 sm:p-10">
            <p className="eyebrow">Secondary business</p>
            <h3 className="mt-3 text-2xl font-semibold">Daily car cleaning — Greater Noida</h3>
            <p className="mt-2 text-muted">Doorstep daily exterior cleaning, interior cleaning, tyre and dashboard polish.</p>
            <ButtonLink href="/services" variant="outline" className="mt-6">
              Explore services
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
