import Link from "next/link";
import { cn } from "@/lib/utils";

/** Wordmark. Replace with the uploaded logo via Admin → Settings → Logo URL. */
export function Logo({ className, light, logoUrl }: { className?: string; light?: boolean; logoUrl?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2", className)} aria-label="Carsappo home">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="Carsappo" className="h-8 w-auto" />
      ) : (
        <>
          <span className="grid size-8 place-items-center rounded-lg bg-brand">
            <svg viewBox="0 0 24 24" className="size-5 text-ink" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 15.5 5.6 10a2 2 0 0 1 1.9-1.5h9a2 2 0 0 1 1.9 1.5L20 15.5" />
              <path d="M3 15.5h18v2.5a1 1 0 0 1-1 1h-1.5M3 15.5V18a1 1 0 0 0 1 1h1.5" />
              <circle cx="7.5" cy="19" r="1.6" />
              <circle cx="16.5" cy="19" r="1.6" />
            </svg>
          </span>
          <span className={cn("font-display text-xl font-bold tracking-[0.08em]", light ? "text-white" : "text-ink")}>
            CARS<span className="text-brand-dark">APPO</span>
          </span>
        </>
      )}
    </Link>
  );
}
