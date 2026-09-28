import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { SmartImage } from "@/components/ui/smart-image";

export function PromoBanner({
  banner,
}: {
  banner: { eyebrow: string | null; title: string; subtitle: string | null; image: string | null; ctaLabel: string | null; ctaHref: string | null };
}) {
  return (
    <div className="relative isolate overflow-hidden rounded-[28px] bg-ink px-6 py-12 text-white sm:px-12 sm:py-16">
      {banner.image ? (
        <>
          <SmartImage src={banner.image} alt="" fill sizes="100vw" className="-z-20 object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/90 to-ink/30" />
        </>
      ) : (
        <>
          <div className="dot-grid absolute inset-0 -z-10" />
          <div className="absolute -right-24 -bottom-24 -z-10 size-96 rounded-full bg-brand/30 blur-3xl" />
        </>
      )}
      <div className="max-w-xl">
        {banner.eyebrow && <p className="eyebrow text-brand">{banner.eyebrow}</p>}
        <h2 className="mt-3 text-3xl leading-tight font-semibold sm:text-4xl">{banner.title}</h2>
        {banner.subtitle && <p className="mt-3 text-zinc-300">{banner.subtitle}</p>}
        {banner.ctaHref && (
          <ButtonLink href={banner.ctaHref} className="mt-7">
            {banner.ctaLabel || "Shop now"} <ArrowRight className="size-4" />
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
