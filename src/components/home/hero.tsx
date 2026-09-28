import { MapPin, ShieldCheck, Truck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { SmartImage } from "@/components/ui/smart-image";
import { SmartSearch } from "@/components/layout/smart-search";
import { CarArt } from "@/components/home/car-art";

type HeroBanner = {
  id: string;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  image: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  secondaryCtaLabel: string | null;
  secondaryCtaHref: string | null;
};

export function Hero({ banner, modelCount }: { banner?: HeroBanner | null; modelCount: number }) {
  const title = banner?.title || "Everything Your Car Needs.";
  return (
    <section className="relative isolate overflow-hidden bg-ink text-white">
      {banner?.image ? (
        <>
          <SmartImage src={banner.image} alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink via-ink/80 to-ink/20" />
        </>
      ) : (
        <>
          <div className="dot-grid absolute inset-0 -z-20 opacity-60" />
          <div className="absolute -top-40 -right-40 -z-10 size-[640px] rounded-full bg-brand/15 blur-3xl" />
          <div className="absolute bottom-0 left-0 -z-10 h-px w-full bg-gradient-to-r from-transparent via-brand/60 to-transparent" />
        </>
      )}

      <div className="container-x grid items-center gap-10 pt-14 pb-16 lg:grid-cols-[1.05fr_1fr] lg:pt-24 lg:pb-28">
        <div className="animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-zinc-300">
            <span className="size-1.5 rounded-full bg-brand" />
            {banner?.eyebrow || "Premium car care brand · Made for Indian roads"}
          </p>
          <h1 className="mt-6 text-5xl leading-[1.02] font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            {title.split(" ").slice(0, -2).join(" ")} <span className="text-brand">{title.split(" ").slice(-2).join(" ")}</span>
          </h1>
          {banner?.subtitle ? (
            <p className="mt-6 max-w-xl text-lg text-zinc-300">{banner.subtitle}</p>
          ) : (
            <ul className="mt-7 space-y-3 text-base text-zinc-300 sm:text-lg">
              <li className="flex items-center gap-3">
                <Truck className="size-5 shrink-0 text-brand" /> Premium Car Accessories Delivered Across India.
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="size-5 shrink-0 text-brand" /> Daily Car Cleaning Services Available in Greater Noida.
              </li>
            </ul>
          )}
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href={banner?.ctaHref || "/shop"} size="lg">
              {banner?.ctaLabel || "Shop Accessories"}
            </ButtonLink>
            <ButtonLink href={banner?.secondaryCtaHref || "/services"} size="lg" variant="dark" className="ring-1 ring-white/25 hover:ring-white/60">
              {banner?.secondaryCtaLabel || "Explore Services"}
            </ButtonLink>
          </div>
          <div className="mt-10 max-w-xl">
            <SmartSearch variant="hero" />
          </div>
          <p className="mt-6 flex items-center gap-2 text-xs text-zinc-400">
            <ShieldCheck className="size-4 text-brand" /> Genuine products · Secure Razorpay payments · Easy 7-day returns
          </p>
        </div>

        {!banner?.image && (
          <div className="relative hidden lg:block">
            <div className="absolute inset-x-8 top-1/2 h-40 -translate-y-1/2 rounded-full bg-brand/10 blur-3xl" />
            <CarArt className="relative w-full drop-shadow-[0_20px_40px_rgba(255,200,0,0.15)]" />
            <div className="absolute top-2 right-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <p className="text-[11px] tracking-wider text-zinc-400 uppercase">Free shipping</p>
              <p className="font-display text-sm font-semibold">On orders above ₹999</p>
            </div>
            <div className="absolute bottom-0 left-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <p className="text-[11px] tracking-wider text-zinc-400 uppercase">Custom fit</p>
              <p className="font-display text-sm font-semibold">{modelCount > 10 ? `${Math.floor(modelCount / 10) * 10}+` : modelCount} car models</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
