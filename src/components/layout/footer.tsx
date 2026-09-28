import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { NewsletterForm } from "@/components/layout/newsletter-form";
import { FacebookIcon, InstagramIcon, LinkedinIcon, XIcon, YoutubeIcon } from "@/components/icons/brand";
import { POLICY_PAGES, SERVICE_TYPES } from "@/lib/constants";
import type { Settings } from "@/lib/settings";

export function Footer({
  settings,
  categories,
}: {
  settings: Pick<Settings, "store" | "social">;
  categories: { name: string; slug: string }[];
}) {
  const { store, social } = settings;
  const socials = [
    { href: social.instagram, label: "Instagram", Icon: InstagramIcon },
    { href: social.facebook, label: "Facebook", Icon: FacebookIcon },
    { href: social.youtube, label: "YouTube", Icon: YoutubeIcon },
    { href: social.x, label: "X", Icon: XIcon },
    { href: social.linkedin, label: "LinkedIn", Icon: LinkedinIcon },
  ].filter((s) => s.href);

  const col = "space-y-3 text-sm text-zinc-400";
  const heading = "mb-5 font-display text-sm font-semibold text-white";
  const link = "transition hover:text-brand";

  return (
    <footer className="mt-auto bg-ink text-white">
      <div className="container-x grid gap-12 py-16 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="max-w-sm">
          <Logo light logoUrl={store.logoUrl} />
          <p className="mt-4 text-sm leading-relaxed text-zinc-400">
            {store.tagline} Premium car accessories and car care products delivered across India, and daily car cleaning in Greater Noida.
          </p>
          <p className="mt-8 font-display text-sm font-semibold">Join the Carsappo club</p>
          <p className="mt-1 text-xs text-zinc-500">Car care tips, new launches and member-only offers. No spam.</p>
          <NewsletterForm />
          {socials.length > 0 && (
            <div className="mt-6 flex gap-2">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid size-10 place-items-center rounded-full border border-white/10 text-zinc-300 transition hover:border-brand hover:text-brand"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className={heading}>Quick links</p>
          <ul className={col}>
            <li><Link className={link} href="/shop">Shop all</Link></li>
            <li><Link className={link} href="/shop?collection=best-sellers">Best sellers</Link></li>
            <li><Link className={link} href="/shop?collection=new">New arrivals</Link></li>
            <li><Link className={link} href="/track-order">Track order</Link></li>
            <li><Link className={link} href="/blog">Blog</Link></li>
            <li><Link className={link} href="/about">About us</Link></li>
          </ul>
        </div>

        <div>
          <p className={heading}>Categories</p>
          <ul className={col}>
            {categories.slice(0, 8).map((c) => (
              <li key={c.slug}>
                <Link className={link} href={`/category/${c.slug}`}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className={heading}>Services</p>
          <ul className={col}>
            {SERVICE_TYPES.map((s) => (
              <li key={s.value}>
                <Link className={link} href={`/services#${s.value.toLowerCase().replace(/_/g, "-")}`}>
                  {s.label}
                </Link>
              </li>
            ))}
            <li><Link className={link} href="/services/book">Book a service</Link></li>
          </ul>
          <p className={`${heading} mt-8`}>Policies</p>
          <ul className={col}>
            {POLICY_PAGES.map((p) => (
              <li key={p.slug}>
                <Link className={link} href={`/policies/${p.slug}`}>
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className={heading}>Contact</p>
          <ul className={col}>
            {store.phone && (
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 size-4 shrink-0" />
                <a className={link} href={`tel:${store.phone}`}>{store.phone}</a>
              </li>
            )}
            {store.email && (
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 size-4 shrink-0" />
                <a className={link} href={`mailto:${store.email}`}>{store.email}</a>
              </li>
            )}
            {store.address && (
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <span>{store.address}</span>
              </li>
            )}
            <li><Link className={link} href="/contact">Contact form →</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-3 py-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {store.legalName || store.name}. All rights reserved.{store.gstin ? ` · GSTIN ${store.gstin}` : ""}
          </p>
          <p className="flex flex-wrap items-center gap-2">
            <span>Secure payments</span>
            {["UPI", "Visa", "Mastercard", "RuPay", "Net Banking"].map((m) => (
              <span key={m} className="rounded-md border border-white/10 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                {m}
              </span>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}
