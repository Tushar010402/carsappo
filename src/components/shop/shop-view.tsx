import Link from "next/link";
import { CarFront, PackageSearch, X } from "lucide-react";
import { prisma } from "@/lib/db";
import { getShopFacets, getVehicleMakes, listProducts, type ShopFilters as Filters } from "@/lib/catalog";
import { fuelLabel } from "@/lib/constants";
import { ProductGrid } from "@/components/product/product-card";
import { ShopFilters } from "@/components/shop/filters";
import { SortSelect } from "@/components/shop/sort-select";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";

const COLLECTION_TITLES: Record<string, string> = {
  "best-sellers": "Best Sellers",
  new: "New Arrivals",
  premium: "Premium Collection",
  trending: "Trending Now",
  featured: "Featured Products",
};

function toParams(f: Filters, fixedCategory?: string) {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.category && !fixedCategory) sp.set("category", f.category);
  f.brands.forEach((b) => sp.append("brand", b));
  if (f.min !== undefined) sp.set("min", String(f.min));
  if (f.max !== undefined) sp.set("max", String(f.max));
  if (f.offers) sp.set("offers", "1");
  if (f.inStock) sp.set("inStock", "1");
  if (f.rating) sp.set("rating", String(f.rating));
  if (f.make) sp.set("make", f.make);
  if (f.model) sp.set("model", f.model);
  if (f.year) sp.set("year", String(f.year));
  if (f.fuel) sp.set("fuel", f.fuel);
  if (f.collection) sp.set("collection", f.collection);
  if (f.sort !== "popular") sp.set("sort", f.sort);
  return sp;
}

export async function ShopView({
  filters,
  basePath,
  category,
}: {
  filters: Filters;
  basePath: string;
  category?: { name: string; slug: string; description: string | null };
}) {
  const [result, facets, makes] = await Promise.all([listProducts(filters), getShopFacets(), getVehicleMakes()]);

  const vehicle =
    filters.make && filters.model
      ? await prisma.vehicleModel.findFirst({
          where: { slug: filters.model, make: { slug: filters.make } },
          select: { name: true, make: { select: { name: true } } },
        })
      : null;
  const vehicleText = vehicle ? [vehicle.make.name, vehicle.name, filters.year, filters.fuel ? fuelLabel(filters.fuel) : null].filter(Boolean).join(" ") : null;

  const title = filters.q
    ? `Results for “${filters.q}”`
    : category
      ? category.name
      : filters.collection
        ? COLLECTION_TITLES[filters.collection]
        : vehicleText
          ? `Accessories for ${vehicleText}`
          : "Shop all";

  const base = toParams(filters, category?.slug);
  const hrefWithout = (...keys: string[]) => {
    const sp = new URLSearchParams(base);
    keys.forEach((k) => sp.delete(k));
    sp.delete("page");
    return `${basePath}${sp.size ? `?${sp}` : ""}`;
  };
  const hrefWithoutBrand = (slug: string) => {
    const sp = new URLSearchParams(base);
    const brands = sp.getAll("brand").filter((b) => b !== slug);
    sp.delete("brand");
    brands.forEach((b) => sp.append("brand", b));
    return `${basePath}${sp.size ? `?${sp}` : ""}`;
  };

  const chips: { label: string; href: string }[] = [];
  if (filters.q) chips.push({ label: `“${filters.q}”`, href: hrefWithout("q") });
  if (filters.category && !category) {
    const c = facets.categories.find((x) => x.slug === filters.category);
    chips.push({ label: c?.name ?? filters.category, href: hrefWithout("category") });
  }
  filters.brands.forEach((b) => chips.push({ label: facets.brands.find((x) => x.slug === b)?.name ?? b, href: hrefWithoutBrand(b) }));
  if (filters.min !== undefined || filters.max !== undefined) {
    chips.push({ label: `₹${filters.min ?? 0} – ${filters.max ? `₹${filters.max}` : "any"}`, href: hrefWithout("min", "max") });
  }
  if (filters.offers) chips.push({ label: "On sale", href: hrefWithout("offers") });
  if (filters.inStock) chips.push({ label: "In stock", href: hrefWithout("inStock") });
  if (filters.rating) chips.push({ label: `${filters.rating}★ & up`, href: hrefWithout("rating") });
  if (filters.collection) chips.push({ label: COLLECTION_TITLES[filters.collection], href: hrefWithout("collection") });

  const pageHref = (p: number) => {
    const sp = new URLSearchParams(base);
    if (p > 1) sp.set("page", String(p));
    return `${basePath}${sp.size ? `?${sp}` : ""}`;
  };

  return (
    <div className="container-x py-8 sm:py-10">
      <Breadcrumbs items={category ? [{ name: "Shop", path: "/shop" }, { name: category.name, path: basePath }] : [{ name: "Shop", path: "/shop" }]} />
      <div className="mt-5 mb-6">
        <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
        {category?.description && !filters.q && <p className="mt-2 max-w-2xl text-muted">{category.description}</p>}
      </div>

      {vehicleText && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink px-5 py-4 text-white">
          <p className="flex items-center gap-3 text-sm">
            <CarFront className="size-5 text-brand" />
            Showing products compatible with <span className="font-semibold text-brand">{vehicleText}</span>
          </p>
          <Link href={hrefWithout("make", "model", "year", "fuel")} className="text-sm font-medium text-zinc-300 underline hover:text-white">
            Show all products
          </Link>
        </div>
      )}

      {!category && (
        <div className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {facets.categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}${vehicleText ? `?${new URLSearchParams({ make: filters.make!, model: filters.model!, ...(filters.year ? { year: String(filters.year) } : {}), ...(filters.fuel ? { fuel: filters.fuel } : {}) })}` : ""}`}
              className="shrink-0 rounded-full border border-line px-4 py-2 text-sm font-medium transition hover:border-ink"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[250px_1fr]">
        <ShopFilters
          basePath={basePath}
          fixedCategory={!!category}
          facets={facets}
          makes={makes}
          activeCount={chips.length}
          state={{
            q: filters.q,
            category: filters.category,
            brands: filters.brands,
            min: filters.min,
            max: filters.max,
            offers: filters.offers,
            inStock: filters.inStock,
            rating: filters.rating,
            make: filters.make,
            model: filters.model,
            year: filters.year,
            fuel: filters.fuel,
            collection: filters.collection,
            sort: filters.sort,
          }}
        />

        <div className="min-w-0">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {result.total} {result.total === 1 ? "product" : "products"}
            </p>
            <SortSelect value={filters.sort} />
          </div>

          {chips.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <Link key={c.label} href={c.href} className="inline-flex items-center gap-1.5 rounded-full bg-mist px-3 py-1.5 text-xs font-medium hover:bg-line">
                  {c.label} <X className="size-3" />
                </Link>
              ))}
              <Link href={basePath} className="text-xs font-semibold underline">
                Clear all
              </Link>
            </div>
          )}

          {result.items.length > 0 ? (
            <>
              <ProductGrid products={result.items} className="xl:grid-cols-3 2xl:grid-cols-4" />
              <Pagination page={result.page} pages={result.pages} hrefFor={pageHref} />
            </>
          ) : (
            <EmptyState
              icon={<PackageSearch className="size-6" />}
              title="No products found"
              description={
                vehicleText
                  ? `We couldn't find products matching these filters for your ${vehicleText}. Try removing a filter or message us on WhatsApp — we can source it for you.`
                  : "Try a different search term or remove some filters."
              }
              action={<ButtonLink href={basePath}>Clear filters</ButtonLink>}
            />
          )}
        </div>
      </div>
    </div>
  );
}
