import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { BadgeCheck, Check, PackageCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getFrequentlyBoughtTogether, getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { faqJsonLd, pageMetadata, productJsonLd } from "@/lib/seo";
import { formatDate, formatINR } from "@/lib/format";
import { fuelLabel } from "@/lib/constants";
import { absoluteUrl, whatsappLink } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { JsonLd } from "@/components/ui/json-ld";
import { Price } from "@/components/ui/price";
import { Stars } from "@/components/ui/stars";
import { Markdown } from "@/components/ui/markdown";
import { Accordion } from "@/components/ui/accordion";
import { SectionHeader } from "@/components/ui/container";
import { WhatsappIcon } from "@/components/icons/brand";
import { ProductGallery } from "@/components/product/gallery";
import { AddToCartPanel, type CartProduct } from "@/components/product/add-to-cart";
import { WishlistButton } from "@/components/product/wishlist-button";
import { PincodeChecker } from "@/components/product/pincode-checker";
import { FitCheck } from "@/components/product/fit-check";
import { FrequentlyBoughtTogether } from "@/components/product/frequently-bought";
import { ReviewForm } from "@/components/product/review-form";
import { ViewItemTracker } from "@/components/product/view-tracker";
import { MobileBuyBar } from "@/components/product/mobile-buy-bar";
import { ProductCard } from "@/components/product/product-card";
import { Rail } from "@/components/product/product-rail";

const getProduct = cache(getProductBySlug);

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  // Resolving 404s here (before the page streams) returns a real 404 status instead of a soft 404.
  if (!product) notFound();
  return pageMetadata({
    title: product.metaTitle || product.name,
    description: product.metaDescription || product.shortDescription,
    path: `/product/${product.slug}`,
    image: product.images[0]?.url,
  });
}

function toCartProduct(p: { id: string; slug: string; name: string; sku: string; price: number; mrp: number | null; stock: number; images: { url: string }[] }): CartProduct {
  return { productId: p.id, slug: p.slug, name: p.name, sku: p.sku, price: p.price, mrp: p.mrp, stock: p.stock, image: p.images[0]?.url ?? null };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [settings, related, fbt, reviews, distribution, user] = await Promise.all([
    getSettings(),
    getRelatedProducts(product),
    getFrequentlyBoughtTogether(product),
    prisma.review.findMany({ where: { productId: product.id, isApproved: true }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.review.groupBy({ by: ["rating"], where: { productId: product.id, isApproved: true }, _count: { _all: true } }),
    getCurrentUser(),
  ]);

  const cartProduct = toCartProduct(product);
  const { shipping, store } = settings;
  const inStock = product.stock > 0;
  const lowStock = inStock && product.stock <= Math.max(product.lowStockAlert, 0);
  const d = settings.delivery;
  const days = (min: number, max: number) => (min === max ? `${min} day${min === 1 ? "" : "s"}` : `${min}–${max} days`);
  const deliveryTimes = [...d.zones.map((z) => `${z.name} ${days(z.minDays, z.maxDays)}`), `${d.restName} ${days(d.restMinDays, d.restMaxDays)}`].join(" · ");

  // Group compatible vehicles by brand for display.
  const compatByMake = new Map<string, { name: string; detail: string }[]>();
  for (const c of product.compatibilities) {
    const list = compatByMake.get(c.vehicleModel.make.name) ?? [];
    const years = c.yearFrom || c.yearTo ? ` (${c.yearFrom ?? c.vehicleModel.yearFrom}–${c.yearTo ?? "present"})` : "";
    list.push({ name: c.vehicleModel.name, detail: `${years}${c.fuelType ? ` · ${fuelLabel(c.fuelType)}` : ""}` });
    compatByMake.set(c.vehicleModel.make.name, list);
  }

  const waText = `Hi ${store.name}! I'm interested in "${product.name}" (${formatINR(product.price)}). ${absoluteUrl(`/product/${product.slug}`)}`;
  const faqs = product.faqs.map((f) => ({ q: f.question, a: f.answer }));
  const totalReviews = distribution.reduce((a, d) => a + d._count._all, 0);

  return (
    <>
      <JsonLd
        data={productJsonLd({
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          description: product.shortDescription || product.description.slice(0, 300),
          images: product.images.map((i) => i.url),
          price: product.price,
          mrp: product.mrp,
          stock: product.stock,
          brand: product.brand?.name,
          ratingAvg: product.ratingAvg,
          ratingCount: product.ratingCount,
          reviews,
        })}
      />
      <JsonLd data={faqJsonLd(product.faqs)} />
      <ViewItemTracker id={product.id} name={product.name} price={product.price} category={product.category.name} />

      <div className="container-x py-6 sm:py-8">
        <Breadcrumbs
          items={[
            { name: "Shop", path: "/shop" },
            { name: product.category.name, path: `/category/${product.category.slug}` },
            { name: product.name, path: `/product/${product.slug}` },
          ]}
        />

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProductGallery images={product.images} name={product.name} videoUrl={product.videoUrl} />
          </div>

          <div>
            <p className="eyebrow">{product.brand?.name ?? product.category.name}</p>
            <h1 className="mt-2 text-3xl leading-tight font-semibold sm:text-4xl">{product.name}</h1>
            {product.ratingCount > 0 && (
              <a href="#reviews" className="mt-3 inline-flex items-center gap-2 text-sm">
                <Stars rating={product.ratingAvg} size={16} />
                <span className="font-medium">{product.ratingAvg.toFixed(1)}</span>
                <span className="text-muted underline">({product.ratingCount} reviews)</span>
              </a>
            )}

            <div className="mt-6">
              <Price price={product.price} mrp={product.mrp} size="lg" />
              <p className="mt-1 text-xs text-muted">Inclusive of all taxes (GST {product.gstRate}%)</p>
            </div>

            {product.shortDescription && <p className="mt-5 leading-relaxed text-zinc-700">{product.shortDescription}</p>}

            <div className="mt-6">
              <FitCheck
                universal={product.isUniversal}
                compat={product.compatibilities.map((c) => ({
                  make: c.vehicleModel.make.slug,
                  model: c.vehicleModel.slug,
                  yearFrom: c.yearFrom,
                  yearTo: c.yearTo,
                  fuelType: c.fuelType,
                }))}
              />
            </div>

            <p className={`mt-5 text-sm font-semibold ${inStock ? (lowStock ? "text-amber-700" : "text-success") : "text-danger"}`}>
              {inStock ? (lowStock ? `Hurry — only ${product.stock} left in stock` : "In stock · ready to ship") : "Currently out of stock"}
            </p>

            <div id="buy-box" className="mt-4 space-y-3">
              <AddToCartPanel product={cartProduct} />
              <div className="grid grid-cols-2 gap-3">
                <WishlistButton variant="full" productId={product.id} name={product.name} price={product.price} />
                {store.whatsapp ? (
                  <a
                    href={whatsappLink(store.whatsapp, waText)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-[#25D366] font-display text-sm font-semibold text-ink hover:bg-[#1ebe5a]"
                  >
                    <WhatsappIcon className="size-4" /> WhatsApp Enquiry
                  </a>
                ) : (
                  <Link href={`/contact?subject=${encodeURIComponent(product.name)}`} className="inline-flex h-13 items-center justify-center gap-2 rounded-full border border-ink/15 font-display text-sm font-semibold hover:border-ink">
                    Ask a question
                  </Link>
                )}
              </div>
            </div>

            <div className="mt-6">
              <PincodeChecker weightGrams={product.weightGrams} />
            </div>

            <ul className="mt-6 grid grid-cols-2 gap-3 text-xs">
              {[
                { icon: BadgeCheck, text: "100% genuine product" },
                { icon: Truck, text: `Free shipping over ${formatINR(shipping.freeShippingThreshold)}` },
                { icon: RotateCcw, text: `Easy ${shipping.returnWindowDays}-day returns` },
                { icon: ShieldCheck, text: "Secure payments" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2 rounded-xl bg-mist px-3 py-2.5 font-medium">
                  <Icon className="size-4 shrink-0" /> {text}
                </li>
              ))}
            </ul>

            {product.features.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold">Key features</h2>
                <ul className="mt-3 space-y-2">
                  {product.features.map((f) => (
                    <li key={f} className="flex gap-2.5 text-sm text-zinc-700">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Frequently bought together */}
        {fbt.length > 0 && inStock && (
          <section className="mt-20">
            <h2 className="mb-6 text-2xl font-semibold">Frequently bought together</h2>
            <FrequentlyBoughtTogether items={[cartProduct, ...fbt.map(toCartProduct)]} />
          </section>
        )}

        {/* Details */}
        <section className="mt-20 grid gap-12 lg:grid-cols-[1fr_380px]">
          <div className="space-y-14">
            <div id="description">
              <h2 className="mb-4 text-2xl font-semibold">Description</h2>
              <Markdown>{product.description || product.shortDescription || ""}</Markdown>
            </div>

            {product.specs.length > 0 && (
              <div id="specifications">
                <h2 className="mb-4 text-2xl font-semibold">Specifications</h2>
                <dl className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
                  {product.specs.map((s) => (
                    <div key={s.id} className="grid grid-cols-[40%_1fr] text-sm">
                      <dt className="bg-mist px-4 py-3 font-medium">{s.label}</dt>
                      <dd className="px-4 py-3 text-zinc-700">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div id="compatibility">
              <h2 className="mb-4 text-2xl font-semibold">Vehicle compatibility</h2>
              {product.isUniversal ? (
                <p className="text-sm text-zinc-700">Universal fit — compatible with all cars.</p>
              ) : compatByMake.size ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {[...compatByMake.entries()].map(([make, models]) => (
                    <div key={make} className="rounded-2xl border border-line p-4">
                      <p className="font-display text-sm font-semibold">{make}</p>
                      <p className="mt-1 text-sm text-muted">{models.map((m) => `${m.name}${m.detail}`).join(", ")}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-700">Contact us on WhatsApp to confirm fitment for your vehicle.</p>
              )}
            </div>

            {faqs.length > 0 && (
              <div id="faqs">
                <h2 className="mb-2 text-2xl font-semibold">FAQs</h2>
                <Accordion items={faqs} />
              </div>
            )}

            <div id="reviews" className="scroll-mt-24">
              <h2 className="mb-6 text-2xl font-semibold">Customer reviews</h2>
              <div className="grid gap-8 sm:grid-cols-[220px_1fr]">
                <div>
                  <p className="font-display text-5xl font-semibold">{product.ratingCount ? product.ratingAvg.toFixed(1) : "–"}</p>
                  <Stars rating={product.ratingAvg} size={18} className="mt-2" />
                  <p className="mt-1 text-sm text-muted">{product.ratingCount} reviews</p>
                  <div className="mt-4 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((r) => {
                      const n = distribution.find((d) => d.rating === r)?._count._all ?? 0;
                      return (
                        <div key={r} className="flex items-center gap-2 text-xs">
                          <span className="w-3">{r}</span>
                          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-mist">
                            <span className="block h-full rounded-full bg-brand-dark" style={{ width: `${totalReviews ? (n / totalReviews) * 100 : 0}%` }} />
                          </span>
                          <span className="w-5 text-right text-muted">{n}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-6">
                  {reviews.length === 0 && <p className="text-sm text-muted">No reviews yet. Be the first to review this product.</p>}
                  {reviews.map((r) => (
                    <article key={r.id} className="border-b border-line pb-6 last:border-0">
                      <div className="flex items-center gap-2">
                        <Stars rating={r.rating} />
                        {r.title && <p className="text-sm font-semibold">{r.title}</p>}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-700">{r.body}</p>
                      <p className="mt-2 flex items-center gap-2 text-xs text-muted">
                        {r.name} · {formatDate(r.createdAt)}
                        {r.isVerified && (
                          <span className="inline-flex items-center gap-1 font-medium text-success">
                            <PackageCheck className="size-3.5" /> Verified purchase
                          </span>
                        )}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
              <details className="group mt-8 rounded-2xl border border-line p-5">
                <summary className="cursor-pointer list-none font-display font-semibold">Write a review</summary>
                <div className="mt-5">
                  <ReviewForm productId={product.id} defaultName={user?.name} />
                </div>
              </details>
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-line p-5">
              <h3 className="flex items-center gap-2 font-semibold">
                <Truck className="size-4" /> Shipping information
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-zinc-700">
                <li>Dispatched within {shipping.dispatchDays === 1 ? "24 hours" : `${shipping.dispatchDays} days`} on business days.</li>
                <li>Free shipping on orders above {formatINR(shipping.freeShippingThreshold)}; otherwise {formatINR(shipping.flatShippingFee)}.</li>
                <li>{deliveryTimes}.</li>
                {shipping.codEnabled && <li>Cash on delivery available (+{formatINR(shipping.codFee)}).</li>}
              </ul>
              <Link href="/policies/shipping-policy" className="mt-3 inline-block text-sm font-medium underline">
                Shipping policy
              </Link>
            </div>
            <div className="rounded-2xl border border-line p-5">
              <h3 className="flex items-center gap-2 font-semibold">
                <RotateCcw className="size-4" /> Return policy
              </h3>
              <p className="mt-3 text-sm text-zinc-700">
                Easy {shipping.returnWindowDays}-day returns for damaged, defective or wrong items, and for custom-fit products that don&apos;t fit the vehicle
                selected at purchase. Request a return from your account in a few clicks.
              </p>
              <Link href="/policies/return-policy" className="mt-3 inline-block text-sm font-medium underline">
                Return & refund policy
              </Link>
            </div>
          </aside>
        </section>

        {related.length > 0 && (
          <section className="mt-24">
            <SectionHeader eyebrow="You may also like" title="Related products" href={`/category/${product.category.slug}`} />
            <Rail label="Related products">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </Rail>
          </section>
        )}
      </div>
      <MobileBuyBar product={cartProduct} anchorId="buy-box" />
    </>
  );
}
