import type { Metadata } from "next";
import { getSettings, textRenderer } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { ButtonLink } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { FeatureIcon } from "@/components/icons/feature-icon";

// Content from Admin → Pages → About.
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const t = textRenderer(settings);
  return pageMetadata({ title: t(settings.about.metaTitle), description: t(settings.about.metaDescription), path: "/about" });
}

export default async function AboutPage() {
  const settings = await getSettings();
  const t = textRenderer(settings);
  const a = settings.about;
  const paragraphs = t(a.missionText)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <>
      <section className="container-x py-10 sm:py-14">
        <Breadcrumbs items={[{ name: "About", path: "/about" }]} />
        <p className="eyebrow mt-10">{t(a.eyebrow)}</p>
        <h1 className="mt-4 max-w-4xl text-5xl leading-[1.05] font-semibold sm:text-6xl">
          {t(a.heading)} {a.headingHighlight && <span className="mt-3 inline-block rounded-lg bg-brand px-3 pb-1">{t(a.headingHighlight)}</span>}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted">{t(a.intro)}</p>
      </section>

      {(a.missionTitle || paragraphs.length > 0) && (
        <section className="bg-ink text-white">
          <div className="container-x grid gap-12 py-20 lg:grid-cols-2">
            <div>
              <p className="eyebrow text-brand">{t(a.missionEyebrow)}</p>
              <h2 className="mt-4 text-3xl leading-tight font-semibold sm:text-4xl">{t(a.missionTitle)}</h2>
            </div>
            <div className="space-y-5 text-zinc-300">
              {paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
        </section>
      )}

      {a.values.length > 0 && (
        <section className="container-x py-20">
          <h2 className="text-3xl font-semibold sm:text-4xl">{t(a.valuesTitle)}</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {a.values.map((v) => (
              <div key={v.title} className="rounded-[28px] border border-line p-7">
                <FeatureIcon name={v.icon} className="size-7" strokeWidth={1.6} />
                <h3 className="mt-5 text-lg font-semibold">{t(v.title)}</h3>
                <p className="mt-1 text-sm text-muted">{t(v.text)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="container-x pb-24">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[28px] bg-brand p-8 sm:p-10">
            <p className="eyebrow text-ink/60">{t(a.primaryEyebrow)}</p>
            <h3 className="mt-3 text-2xl font-semibold">{t(a.primaryTitle)}</h3>
            <p className="mt-2 text-ink/70">{t(a.primaryText)}</p>
            {a.primaryButton && (
              <ButtonLink href={a.primaryHref || "/shop"} variant="dark" className="mt-6">
                {t(a.primaryButton)}
              </ButtonLink>
            )}
          </div>
          <div className="rounded-[28px] bg-mist p-8 sm:p-10">
            <p className="eyebrow">{t(a.secondaryEyebrow)}</p>
            <h3 className="mt-3 text-2xl font-semibold">{t(a.secondaryTitle)}</h3>
            <p className="mt-2 text-muted">{t(a.secondaryText)}</p>
            {a.secondaryButton && (
              <ButtonLink href={a.secondaryHref || "/services"} variant="outline" className="mt-6">
                {t(a.secondaryButton)}
              </ButtonLink>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
