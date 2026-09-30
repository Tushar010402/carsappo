import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSettings, renderText } from "@/lib/settings";
import { faqJsonLd, pageMetadata } from "@/lib/seo";
import { Accordion } from "@/components/ui/accordion";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { JsonLd } from "@/components/ui/json-ld";
import { EmptyState } from "@/components/ui/container";

export const metadata: Metadata = pageMetadata({
  title: "FAQs — Orders, Shipping, Returns & Car Cleaning",
  description: "Answers to common questions about orders, payments, shipping, returns, product fitment and our daily car cleaning service.",
  path: "/faq",
});

const GROUPS = [
  { scope: "GENERAL", title: "Orders & products" },
  { scope: "SHIPPING", title: "Shipping, returns & payments" },
  { scope: "SERVICES", title: "Daily car cleaning" },
] as const;

/** Every active FAQ from Admin → FAQs, grouped by topic. */
export default async function FaqPage() {
  const [faqs, settings] = await Promise.all([
    prisma.faq.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }] }),
    getSettings(),
  ]);
  const text = (s: string) => renderText(settings, s);
  const groups = GROUPS.map((g) => ({ ...g, items: faqs.filter((f) => f.scope === g.scope) })).filter((g) => g.items.length);
  return (
    <div className="container-x max-w-3xl py-10 sm:py-14">
      <JsonLd data={faqJsonLd(faqs.map((f) => ({ question: text(f.question), answer: text(f.answer) })))} />
      <Breadcrumbs items={[{ name: "FAQs", path: "/faq" }]} />
      <p className="eyebrow mt-8">Help centre</p>
      <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Frequently asked questions</h1>
      <p className="mt-3 text-lg text-muted">
        Can&apos;t find an answer?{" "}
        <Link href="/contact" className="font-semibold text-ink underline">
          Contact us
        </Link>
        .
      </p>
      {groups.length === 0 ? (
        <div className="mt-12">
          <EmptyState title="No FAQs yet" description="Questions and answers added in the admin panel will appear here." />
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.scope} className="mt-12">
            <h2 className="mb-4 text-2xl font-semibold">{g.title}</h2>
            <Accordion items={g.items.map((f) => ({ q: text(f.question), a: text(f.answer) }))} />
          </section>
        ))
      )}
    </div>
  );
}
