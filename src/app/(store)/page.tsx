import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
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

export default async function HomePage() {
  const [settings, categories, makes, bestSellers, latest, premium, trending, banners, testimonials, cheapestPlan, instagram, google, modelCount] =
    await Promise.all([
      getSettings(),
      getNavCategories(),
      getVehicleMakes(),
      getProductsForSection({ isBestSeller: true }, [{ salesCount: "desc" }], 12),
      getProductsForSection({}, [{ createdAt: "desc" }], 8),
      getProductsForSection({ isPremium: true }, [{ price: "desc" }], 8),
      getProductsForSection({ isTrending: true }, [{ salesCount: "desc" }], 8),
      prisma.banner.findMany({ where: { isActive: true, placement: { in: ["HOME_HERO", "HOME_PROMO"] } }, orderBy: { sortOrder: "asc" } }),
      prisma.testimonial.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
      prisma.servicePlan.findFirst({ where: { isActive: true, period: "MONTHLY" }, orderBy: { price: "asc" }, select: { price: true } }),
      getInstagramPosts(8),
      getGoogleReviews(),
      prisma.vehicleModel.count({ where: { type: "CAR" } }),
    ]);

  const heroBanner = banners.find((b) => b.placement === "HOME_HERO");
  const promo = banners.find((b) => b.placement === "HOME_PROMO");
  const instaFallback = [...bestSellers, ...trending].flatMap((p) => p.images.slice(0, 1).map((i) => i.url));

  return (
    <>
      {/* Hero Banner + Search Bar */}
      <Hero banner={heroBanner} modelCount={modelCount} />

      {/* Shop by Vehicle */}
      <section id="shop-by-vehicle" className="scroll-mt-24 bg-mist">
        <div className="container-x py-16 sm:py-20">
          <SectionHeader
            eyebrow="Shop by Vehicle"
            title="Accessories that fit your car. Exactly."
            subtitle="Select your brand, model, year and fuel type — we'll show only compatible products like 7D mats, seat covers, dashboard covers and organisers."
          />
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

      {/* Shop by Category */}
      <section className="container-x py-20 sm:py-24">
        <SectionHeader eyebrow="Shop by Category" title="Everything for your car, in one place." href="/shop" linkLabel="Shop all" />
        <CategoryGrid categories={categories} />
      </section>

      {/* Best Sellers — large slider */}
      {bestSellers.length > 0 && (
        <section className="bg-ink text-white">
          <div className="container-x py-20 sm:py-24">
            <SectionHeader dark eyebrow="Best Sellers" title="Most loved by Carsappo customers." href="/shop?collection=best-sellers" />
            <Rail dark itemClassName="sm:!w-[40%] lg:!w-[31.5%]">
              {bestSellers.map((p, i) => (
                <div key={p.id} className="rounded-[28px] bg-white p-3 text-ink sm:p-4">
                  <ProductCard product={p} priority={i < 3} />
                </div>
              ))}
            </Rail>
          </div>
        </section>
      )}

      {promo && (
        <section className="container-x pt-20 sm:pt-24">
          <PromoBanner banner={promo} />
        </section>
      )}

      {/* Featured Products */}
      <section className="container-x py-20 sm:py-24">
        <SectionHeader eyebrow="Featured Products" title="Fresh, premium and trending." href="/shop" />
        <Tabs
          tabs={[
            { id: "latest", label: "Latest Products", content: <ProductGrid products={latest} /> },
            { id: "premium", label: "Premium Collection", content: <ProductGrid products={premium} /> },
            { id: "trending", label: "Trending Products", content: <ProductGrid products={trending} /> },
          ]}
        />
      </section>

      {/* Why Carsappo */}
      <section className="bg-mist">
        <div className="container-x py-20 sm:py-24">
          <SectionHeader eyebrow="Why Carsappo" title="A car care brand you can trust." />
          <WhyCarsappo />
        </div>
      </section>

      {/* Customer Reviews */}
      {(testimonials.length > 0 || google) && (
        <section className="container-x py-20 sm:py-24">
          <SectionHeader eyebrow="Customer Reviews" title="Real cars. Real customers." />
          <CustomerReviews testimonials={testimonials} google={google} googleUrl={settings.social.googleReviewsUrl} />
        </section>
      )}

      {/* Daily Car Cleaning — secondary service */}
      <CleaningSection startingPrice={cheapestPlan?.price ?? null} />

      {/* Instagram Feed */}
      {settings.social.instagram && (
        <section className="container-x py-20 sm:py-24">
          <InstagramFeed posts={instagram} profileUrl={settings.social.instagram} fallbackImages={instaFallback} />
        </section>
      )}
    </>
  );
}
