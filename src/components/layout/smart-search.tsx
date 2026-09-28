"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Loader2, Search, TrendingUp, X } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { formatINR } from "@/lib/format";
import { POPULAR_SEARCHES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

type Suggest = {
  products: { name: string; slug: string; price: number; mrp: number | null; category: string; image: string | null }[];
  categories: { name: string; slug: string }[];
  suggestions: string[];
};

export function SmartSearch({
  variant = "overlay",
  autoFocus,
  onNavigate,
  placeholder = "Search mats, seat covers, polish, perfume…",
}: {
  variant?: "overlay" | "hero";
  autoFocus?: boolean;
  onNavigate?: () => void;
  placeholder?: string;
}) {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Suggest | null>(null);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        setData(await res.json());
        setActive(-1);
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  };

  const submit = (term: string) => {
    const t = term.trim();
    if (!t) return;
    track("search", { searchTerm: t });
    go(`/shop?q=${encodeURIComponent(t)}`);
  };

  const products = data?.products ?? [];
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, products.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && products[active]) go(`/product/${products[active].slug}`);
      else submit(q);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const hero = variant === "hero";
  const showPanel = open && (q.trim().length >= 2 || !hero);

  return (
    <div ref={wrapRef} className="relative w-full">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit(q);
        }}
        className={cn(
          "flex items-center gap-3 rounded-full border transition",
          hero
            ? "h-14 border-white/15 bg-white pr-2 pl-5 shadow-lift focus-within:ring-4 focus-within:ring-brand/40"
            : "h-12 border-line bg-mist px-4 focus-within:border-ink focus-within:bg-white",
        )}
      >
        <Search className="size-5 shrink-0 text-muted" aria-hidden />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label="Search products"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-zinc-400"
        />
        {loading && <Loader2 className="size-4 animate-spin text-muted" aria-hidden />}
        {q && !loading && (
          <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="text-muted hover:text-ink">
            <X className="size-4" />
          </button>
        )}
        {hero && (
          <button type="submit" className="hidden h-10 rounded-full bg-ink px-5 font-display text-sm font-semibold text-white sm:block">
            Search
          </button>
        )}
      </form>

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-3xl border border-line bg-white p-3 text-left shadow-lift"
        >
          {q.trim().length < 2 ? (
            <div className="p-2">
              <p className="eyebrow mb-3 flex items-center gap-1.5">
                <TrendingUp className="size-3.5" /> Popular searches
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => submit(s)}
                    className="rounded-full border border-line px-3.5 py-1.5 text-sm hover:border-ink"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {(data?.suggestions.length || data?.categories.length) ? (
                <div className="flex flex-wrap gap-2 border-b border-line p-2 pb-3">
                  {data?.categories.map((c) => (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() => go(`/category/${c.slug}`)}
                      className="rounded-full bg-brand-soft px-3.5 py-1.5 text-sm font-medium"
                    >
                      in {c.name}
                    </button>
                  ))}
                  {data?.suggestions.map((s) => (
                    <button key={s} type="button" onClick={() => submit(s)} className="rounded-full border border-line px-3.5 py-1.5 text-sm hover:border-ink">
                      {s}
                    </button>
                  ))}
                </div>
              ) : null}
              {products.length > 0 ? (
                <ul className="py-1">
                  {products.map((p, i) => (
                    <li key={p.slug} role="option" aria-selected={i === active}>
                      <Link
                        href={`/product/${p.slug}`}
                        onClick={() => {
                          setOpen(false);
                          onNavigate?.();
                        }}
                        onMouseEnter={() => setActive(i)}
                        className={cn("flex items-center gap-3 rounded-2xl p-2", i === active && "bg-mist")}
                      >
                        <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-mist">
                          {p.image && <SmartImage src={p.image} alt="" fill sizes="48px" className="object-cover" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{p.name}</span>
                          <span className="block text-xs text-muted">{p.category}</span>
                        </span>
                        <span className="font-display text-sm font-semibold">{formatINR(p.price)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                !loading && <p className="p-4 text-sm text-muted">No products match “{q}”. Try “mats” or “polish”.</p>
              )}
              {products.length > 0 && (
                <button
                  type="button"
                  onClick={() => submit(q)}
                  className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-ink py-3 text-sm font-semibold text-white"
                >
                  See all results for “{q.trim()}” <ArrowUpRight className="size-4" />
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
