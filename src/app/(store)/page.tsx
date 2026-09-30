import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSettings, homeSections, serviceTypes, textRenderer } from "@/lib/settings";
import { formatINR } from "@/lib/format";
import { getNavCategories, getProductsForSection, getVehicleMakes } from "@/lib/catalog";
import { getGoogleReviews, getInstagramPosts } from "@/lib/social";
import { Hero } from "@/components/home/hero";
import { VehicleSelector } from "@/components/home/vehicle-selector";
import { CategoryGrid } from "@/components/home/category-grid";
import { Tabs } from "@/components/home/tabs";
import { WhyCarsappo } from "@/components/home/why-carsappo";
import { CustomerReviews } from "@/components/home/customer-reviews";
import { CleaningSection } from "@/components/home/cleaning-section";
import { InstagramFeed } from "@/components/home/instagram-feed";
import { PromoBanner } from "@/components/home/promo-banner";
import { ProductCard, ProductGrid } from "@/components/product/product-card";
import { Rail } from "@/components/product/product-rail";
import { SectionHeader } from "@/components/ui/container";

// Title and description come from Admin → SEO (root layout); the canonical keeps ?utm_… variants from being indexed separately.
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function HomePage() {
  const settings = await getSettings();
  const home = settings.home;
  const [categories, makes, bestSellers, latest, premium, trending, banners, testimonials, cheapestPlan, instagram, google, modelCount] = await Promise.all([
    getNavCategories(),
    getVehicleMakes(),
    getProductsForSection({ isBestSeller: true }, [{ salesCount: "desc" }], home.bestSellers.count),
    getProductsForSection({}, [{ createdAt: "desc" }], home.featured.count),
    getProductsForSection({ isPremium: true }, [{ price: "desc" }], home.featured.count),
    getProductsForSection({ isTrending: true }, [{ salesCount: "desc" }], home.featured.count),
    prisma.banner.findMany({ where: { isActive: true, placement: { in: ["HOME_HERO", "HOME_PROMO"] } }, orderBy: { sortOrder: "asc" } }),
    prisma.testimonial.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.servicePlan.findFirst({ where: { isActive: true, period: "MONTHLY" }, orderBy: { price: "asc" }, select: { price: true } }),
    getInstagramPosts(8),
    getGoogleReviews(),
    prisma.vehicleModel.count({ where: { type: "CAR" } }),
  ]);

  const t = textRenderer(settings);
  const heroBanner = banners.find((b) => b.placement === "HOME_HERO");
  const promo = banners.find((b) => b.placement === "HOME_PROMO");
  const instaFallback = [...bestSellers, ...trending].flatMap((p) => p.images.slice(0, 1).map((i) => i.url));
  const hero = home.hero;
  const threshold = settings.shipping.freeShippingThreshold;

  // Each homepage section; order and visibility come from Admin → Storefront → Homepage.
  const sections: Record<string, React.ReactNode> = {
    vehicle: (
      <section id="shop-by-vehicle" className="scroll-mt-24 bg-mist">
        <div className="container-x py-16 sm:py-20">
          <SectionHeader eyebrow={t(home.vehicle.eyebrow)} title={t(home.vehicle.title)} subtitle={t(home.vehicle.subtitle)} />
          <VehicleSelector makes={makes} />
          <div className="mt-6 flex flex-wrap gap-2">
            {makes.slice(0, 10).map((m) => (
              <Link
                key={m.slug}
                href={`/shop?make=${m.slug}&model=${m.models[0]?.slug ?? ""}`}
                className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium transition hover:border-ink"
              >
                {m.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    ),
    categories: (
      <section className="container-x py-20 sm:py-24">
        <SectionHeader eyebrow={t(home.categories.eyebrow)} title={t(home.categories.title)} href="/shop" linkLabel={t(home.categories.linkLabel)} />
        <CategoryGrid categories={categories} />
      </section>
    ),
    bestSellers: bestSellers.length > 0 && (
      <section className="bg-ink text-white">
        <div className="container-x py-20 sm:py-24">
          <SectionHeader dark eyebrow={t(home.bestSellers.eyebrow)} title={t(home.bestSellers.title)} href="/shop?collection=best-sellers" />
          <Rail dark label={t(home.bestSellers.eyebrow)} itemClassName="sm:!w-[40%] lg:!w-[31.5%]">
            {bestSellers.map((p, i) => (
              <div key={p.id} className="rounded-[28px] bg-white p-3 text-ink sm:p-4">
                <ProductCard product={p} priority={i < 3} />
              </div>
            ))}
          </Rail>
        </div>
      </section>
    ),
    promo: promo && (
      <section className="container-x pt-20 sm:pt-24">
        <PromoBanner banner={promo} />
      </section>
    ),
    featured: (
      <section className="container-x py-20 sm:py-24">
        <SectionHeader eyebrow={t(home.featured.eyebrow)} title={t(home.featured.title)} href="/shop" />
        <Tabs
          tabs={[
            { id: "latest", label: t(home.featured.latestLabel), content: <ProductGrid products={latest} /> },
            { id: "premium", label: t(home.featured.premiumLabel), content: <ProductGrid products={premium} /> },
            { id: "trending", label: t(home.featured.trendingLabel), content: <ProductGrid products={trending} /> },
          ].filter((tab) => tab.label)}
        />
      </section>
    ),
    why: home.why.points.length > 0 && (
      <section className="bg-mist">
        <div className="container-x py-20 sm:py-24">
          <SectionHeader eyebrow={t(home.why.eyebrow)} title={t(home.why.title)} />
          <WhyCarsappo points={home.why.points.map((p) => ({ icon: p.icon, title: t(p.title), text: t(p.text) }))} />
        </div>
      </section>
    ),
    reviews: (testimonials.length > 0 || google) && (
      <section className="container-x py-20 sm:py-24">
        <SectionHeader eyebrow={t(home.reviews.eyebrow)} title={t(home.reviews.title)} />
        <CustomerReviews testimonials={testimonials} google={google} googleUrl={settings.social.googleReviewsUrl} />
      </section>
    ),
    cleaning: (
      <CleaningSection
        startingPrice={cheapestPlan?.price ?? null}
        content={{ ...home.cleaning, badge: t(home.cleaning.badge), title: t(home.cleaning.title), text: t(home.cleaning.text), bullets: home.cleaning.bullets.map(t) }}
        services={serviceTypes(settings)}
      />
    ),
    instagram: settings.social.instagram && (
      <section className="container-x py-20 sm:py-24">
        <InstagramFeed
          posts={instagram}
          profileUrl={settings.social.instagram}
          fallbackImages={instaFallback}
          title={t(home.instagram.title)}
          subtitle={t(home.instagram.subtitle)}
        />
      </section>
    ),
  };

  return (
    <>
      {/* Hero Banner + Search Bar */}
      <Hero
        banner={heroBanner}
        modelCount={modelCount}
        content={{ ...hero, eyebrow: t(hero.eyebrow), title: t(hero.title), titleHighlight: t(hero.titleHighlight), bullets: hero.bullets.map(t), trustLine: t(hero.trustLine) }}
        freeShippingLabel={threshold > 0 ? `On orders above ${formatINR(threshold)}` : "On every order"}
      />
      {homeSections(settings)
        .filter((s) => s.visible && sections[s.id])
        .map((s) => (
          <Fragment key={s.id}>{sections[s.id]}</Fragment>
        ))}
    </>
  );
}
