import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { firstParam, whatsappLink } from "@/lib/utils";
import { ContactForm } from "@/components/services/contact-form";
import { WhatsappIcon } from "@/components/icons/brand";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export const metadata: Metadata = pageMetadata({
  title: "Contact Us",
  description: "Get in touch with Carsappo for product help, order support, bulk enquiries or daily car cleaning in Greater Noida.",
  path: "/contact",
});

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const { store } = await getSettings();
  const subject = firstParam((await searchParams).subject);
  const cards = [
    store.whatsapp && { icon: WhatsappIcon, title: "WhatsApp", value: "Chat with us", href: whatsappLink(store.whatsapp, "Hi Carsappo!") },
    store.phone && { icon: Phone, title: "Call", value: store.phone, href: `tel:${store.phone}` },
    store.email && { icon: Mail, title: "Email", value: store.email, href: `mailto:${store.email}` },
    store.address && { icon: MapPin, title: "Visit", value: store.address, href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}` },
  ].filter(Boolean) as { icon: React.ComponentType<{ className?: string }>; title: string; value: string; href: string }[];

  return (
    <div className="container-x py-10 sm:py-14">
      <Breadcrumbs items={[{ name: "Contact", path: "/contact" }]} />
      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="eyebrow">Contact</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">We&apos;re here to help.</h1>
          <p className="mt-4 text-lg text-muted">Questions about fitment, orders, bulk purchases or our daily cleaning service? Reach out — real humans reply fast.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {cards.map(({ icon: Icon, title, value, href }) => (
              <a key={title} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="rounded-2xl border border-line p-5 transition hover:border-ink">
                <Icon className="size-5" />
                <p className="mt-3 text-sm font-semibold">{title}</p>
                <p className="mt-0.5 text-sm break-words text-muted">{value}</p>
              </a>
            ))}
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm text-muted">
            <Clock className="size-4" /> Support hours: Mon–Sat, 9:30 AM – 7:00 PM IST
          </p>
        </div>
        <div className="rounded-[28px] border border-line p-6 sm:p-8">
          <h2 className="mb-6 text-2xl font-semibold">Send us a message</h2>
          <ContactForm defaultSubject={subject} />
        </div>
      </div>
    </div>
  );
}
