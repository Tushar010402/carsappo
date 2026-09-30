import { BadgeCheck, MapPin, ShieldCheck, Sparkles, Truck } from "lucide-react";
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

export type HeroContent = {
  eyebrow: string;
  title: string;
  titleHighlight: string;
  bullets: string[];
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  trustLine: string;
};

const BULLET_ICONS = [Truck, MapPin, BadgeCheck, Sparkles];

export function Hero({
  banner,
  modelCount,
  content,
  freeShippingLabel,
}: {
  banner?: HeroBanner | null;
  modelCount: number;
  /** Default hero copy from Admin → Storefront → Homepage; a HOME_HERO banner overrides it. */
  content: HeroContent;
  freeShippingLabel: string;
}) {
  // A banner title highlights its last two words; the default title has its own highlighted part.
  const [lead, highlight] = banner?.title
    ? [banner.title.split(" ").slice(0, -2).join(" "), banner.title.split(" ").slice(-2).join(" ")]
    : [content.title, content.titleHighlight];
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
            {banner?.eyebrow || content.eyebrow}
          </p>
          <h1 className="mt-6 text-5xl leading-[1.02] font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            {lead} {highlight && <span className="text-brand">{highlight}</span>}
          </h1>
          {banner?.subtitle ? (
            <p className="mt-6 max-w-xl text-lg text-zinc-300">{banner.subtitle}</p>
          ) : (
            content.bullets.length > 0 && (
              <ul className="mt-7 space-y-3 text-base text-zinc-300 sm:text-lg">
                {content.bullets.map((b, i) => {
                  const Icon = BULLET_ICONS[i % BULLET_ICONS.length];
                  return (
                    <li key={b} className="flex items-center gap-3">
                      <Icon className="size-5 shrink-0 text-brand" /> {b}
                    </li>
                  );
                })}
              </ul>
            )
          )}
          <div className="mt-9 flex flex-wrap gap-3">
            {(banner?.ctaLabel || content.primaryLabel) && (
              <ButtonLink href={banner?.ctaHref || content.primaryHref || "/shop"} size="lg">
                {banner?.ctaLabel || content.primaryLabel}
              </ButtonLink>
            )}
            {(banner?.secondaryCtaLabel || content.secondaryLabel) && (
              <ButtonLink
                href={banner?.secondaryCtaHref || content.secondaryHref || "/services"}
                size="lg"
                variant="dark"
                className="ring-1 ring-white/25 hover:ring-white/60"
              >
                {banner?.secondaryCtaLabel || content.secondaryLabel}
              </ButtonLink>
            )}
          </div>
          <div className="mt-10 max-w-xl">
            <SmartSearch variant="hero" />
          </div>
          {content.trustLine && (
            <p className="mt-6 flex items-center gap-2 text-xs text-zinc-400">
              <ShieldCheck className="size-4 shrink-0 text-brand" /> {content.trustLine}
            </p>
          )}
        </div>

        {!banner?.image && (
          <div className="relative hidden lg:block">
            <div className="absolute inset-x-8 top-1/2 h-40 -translate-y-1/2 rounded-full bg-brand/10 blur-3xl" />
            <CarArt className="relative w-full drop-shadow-[0_20px_40px_rgba(255,200,0,0.15)]" />
            <div className="absolute top-2 right-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <p className="text-[11px] tracking-wider text-zinc-400 uppercase">Free shipping</p>
              <p className="font-display text-sm font-semibold">{freeShippingLabel}</p>
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
