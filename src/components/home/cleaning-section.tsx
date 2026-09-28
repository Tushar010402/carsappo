import Link from "next/link";
import { Armchair, ArrowRight, Check, CircleDot, Gauge, MapPin, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { SERVICE_TYPES } from "@/lib/constants";
import { formatINR } from "@/lib/format";

const ICONS = { DAILY_EXTERIOR: Sparkles, INTERIOR: Armchair, TYRE_POLISH: CircleDot, DASHBOARD_POLISH: Gauge } as const;

export function CleaningSection({ startingPrice }: { startingPrice: number | null }) {
  return (
    <section className="bg-brand">
      <div className="container-x grid gap-12 py-20 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:py-28">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-ink px-3.5 py-1.5 text-xs font-semibold text-white">
            <MapPin className="size-3.5 text-brand" /> Available only in Greater Noida
          </p>
          <h2 className="mt-6 text-4xl leading-tight font-semibold sm:text-5xl">Daily Car Cleaning, at your doorstep.</h2>
          <p className="mt-4 max-w-lg text-lg text-ink/70">
            Wake up to a spotless car every morning. Our trained cleaners use premium waterless products — right at your parking spot.
          </p>
          <ul className="mt-6 space-y-2 text-sm font-medium">
            {["Cleaned before you leave for work", "Scratch-free waterless formula", "Trained, verified cleaners", "Pause or cancel anytime"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <Check className="size-4" /> {t}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <ButtonLink href="/services/book" variant="dark" size="lg">
              Book Service <ArrowRight className="size-4" />
            </ButtonLink>
            {startingPrice !== null && (
              <p className="text-sm">
                Plans from <span className="font-display text-lg font-semibold">{formatINR(startingPrice)}</span>/month
              </p>
            )}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {SERVICE_TYPES.map((s) => {
            const Icon = ICONS[s.value];
            return (
              <Link
                key={s.value}
                href={`/services#${s.value.toLowerCase().replace(/_/g, "-")}`}
                className="group rounded-[var(--radius-card)] bg-ink p-6 text-white transition hover:-translate-y-0.5"
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-brand text-ink">
                  <Icon className="size-6" strokeWidth={1.8} />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{s.label}</h3>
                <p className="mt-1.5 text-sm text-zinc-400">{s.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                  Learn more <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
