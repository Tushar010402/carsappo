"use client";

import { useEffect, useRef, useState } from "react";
import Form from "next/form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, Star, X } from "lucide-react";
import { VehicleSelector } from "@/components/home/vehicle-selector";
import type { VehicleTree } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export type FilterState = {
  q?: string;
  category?: string;
  brands: string[];
  min?: number;
  max?: number;
  offers?: boolean;
  inStock?: boolean;
  rating?: number;
  make?: string;
  model?: string;
  year?: number;
  fuel?: string;
  collection?: string;
  sort: string;
};

type Facets = {
  categories: { name: string; slug: string; count: number }[];
  brands: { name: string; slug: string }[];
  priceMin: number;
  priceMax: number;
};

const PRICE_PRESETS: [number | undefined, number | undefined, string][] = [
  [undefined, 500, "Under ₹500"],
  [500, 1000, "₹500 – ₹1,000"],
  [1000, 3000, "₹1,000 – ₹3,000"],
  [3000, undefined, "Over ₹3,000"],
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b border-line py-5 first:pt-0">
      <legend className="mb-3 font-display text-sm font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

function FilterForm({ basePath, state, facets, makes, fixedCategory }: { basePath: string; state: FilterState; facets: Facets; makes: VehicleTree; fixedCategory?: boolean }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const submit = () => formRef.current?.requestSubmit();

  const hidden: [string, string | number | undefined][] = [
    ["q", state.q],
    ["sort", state.sort !== "popular" ? state.sort : undefined],
    ["make", state.make],
    ["model", state.model],
    ["year", state.year],
    ["fuel", state.fuel],
    ["collection", state.collection],
  ];

  const withParams = (patch: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    for (const [k, v] of hidden) if (v !== undefined && v !== "") sp.set(k, String(v));
    if (!fixedCategory && state.category) sp.set("category", state.category);
    state.brands.forEach((b) => sp.append("brand", b));
    if (state.min !== undefined) sp.set("min", String(state.min));
    if (state.max !== undefined) sp.set("max", String(state.max));
    if (state.offers) sp.set("offers", "1");
    if (state.inStock) sp.set("inStock", "1");
    if (state.rating) sp.set("rating", String(state.rating));
    for (const [k, v] of Object.entries(patch)) {
      sp.delete(k);
      if (v) sp.set(k, v);
    }
    const qs = sp.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };

  return (
    <Form ref={formRef} action={basePath} scroll={false} className="text-sm">
      {hidden.map(([k, v]) => (v !== undefined && v !== "" ? <input key={k} type="hidden" name={k} value={v} /> : null))}

      {!fixedCategory && (
        <Section title="Categories">
          <div className="space-y-1">
            <label className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 hover:bg-mist">
              <span className="flex items-center gap-2.5">
                <input type="radio" name="category" value="" defaultChecked={!state.category} onChange={submit} className="accent-ink" />
                All categories
              </span>
            </label>
            {facets.categories.map((c) => (
              <label key={c.slug} className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 hover:bg-mist">
                <span className="flex items-center gap-2.5">
                  <input type="radio" name="category" value={c.slug} defaultChecked={state.category === c.slug} onChange={submit} className="accent-ink" />
                  {c.name}
                </span>
                <span className="text-xs text-muted">{c.count}</span>
              </label>
            ))}
          </div>
        </Section>
      )}

      <Section title="Price">
        <div className="flex items-center gap-2">
          <input
            type="number"
            name="min"
            min={0}
            placeholder={`₹${facets.priceMin}`}
            defaultValue={state.min}
            aria-label="Minimum price"
            className="field h-10"
            onBlur={submit}
          />
          <span className="text-muted">–</span>
          <input
            type="number"
            name="max"
            min={0}
            placeholder={`₹${facets.priceMax}`}
            defaultValue={state.max}
            aria-label="Maximum price"
            className="field h-10"
            onBlur={submit}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {PRICE_PRESETS.map(([min, max, label]) => {
            const active = state.min === min && state.max === max;
            return (
              <Link
                key={label}
                scroll={false}
                href={withParams({ min: min?.toString(), max: max?.toString(), page: undefined })}
                className={cn("rounded-full border px-3 py-1 text-xs", active ? "border-ink bg-ink text-white" : "border-line hover:border-ink")}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </Section>

      {facets.brands.length > 0 && (
        <Section title="Brand">
          <div className="space-y-2">
            {facets.brands.map((b) => (
              <label key={b.slug} className="flex cursor-pointer items-center gap-2.5">
                <input type="checkbox" name="brand" value={b.slug} defaultChecked={state.brands.includes(b.slug)} onChange={submit} className="size-4 accent-ink" />
                {b.name}
              </label>
            ))}
          </div>
        </Section>
      )}

      <Section title="Compatibility">
        <VehicleSelector
          compact
          makes={makes}
          onSelect={(qs) => {
            const v = new URLSearchParams(qs);
            router.push(withParams({ make: v.get("make") ?? undefined, model: v.get("model") ?? undefined, year: v.get("year") ?? undefined, fuel: v.get("fuel") ?? undefined, page: undefined }), { scroll: false });
          }}
        />
        {state.model && (
          <Link scroll={false} href={withParams({ make: undefined, model: undefined, year: undefined, fuel: undefined })} className="mt-2 inline-block text-xs font-medium underline">
            Clear vehicle
          </Link>
        )}
      </Section>

      <Section title="Offers">
        <label className="flex cursor-pointer items-center gap-2.5">
          <input type="checkbox" name="offers" value="1" defaultChecked={state.offers} onChange={submit} className="size-4 accent-ink" />
          On sale / discounted
        </label>
      </Section>

      <Section title="Availability">
        <label className="flex cursor-pointer items-center gap-2.5">
          <input type="checkbox" name="inStock" value="1" defaultChecked={state.inStock} onChange={submit} className="size-4 accent-ink" />
          In stock only
        </label>
      </Section>

      <Section title="Customer rating">
        <div className="space-y-2">
          {[4, 3].map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2.5">
              <input type="radio" name="rating" value={r} defaultChecked={state.rating === r} onChange={submit} className="accent-ink" />
              <span className="flex items-center gap-1">
                {r}
                <Star className="size-3.5 fill-brand-dark text-brand-dark" /> & up
              </span>
            </label>
          ))}
        </div>
      </Section>

      <noscript>
        <button type="submit" className="mt-4 h-10 w-full rounded-full bg-ink text-white">
          Apply filters
        </button>
      </noscript>
    </Form>
  );
}

export function ShopFilters(props: { basePath: string; state: FilterState; facets: Facets; makes: VehicleTree; fixedCategory?: boolean; activeCount: number }) {
  const [open, setOpen] = useState(false);
  const key = JSON.stringify(props.state);

  useEffect(() => {
    setOpen(false);
  }, [key]);

  return (
    <>
      <aside className="hidden lg:block">
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
          <FilterForm key={key} {...props} />
        </div>
      </aside>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium lg:hidden"
      >
        <SlidersHorizontal className="size-4" /> Filters
        {props.activeCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-ink text-[11px] text-white">{props.activeCount}</span>}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-lg font-semibold">Filters</p>
              <button onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-full hover:bg-mist" aria-label="Close filters">
                <X className="size-5" />
              </button>
            </div>
            <FilterForm key={key} {...props} />
          </div>
        </div>
      )}
    </>
  );
}
