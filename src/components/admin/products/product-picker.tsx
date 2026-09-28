"use client";

import { useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { AdminImage } from "@/components/admin/admin-image";
import { isPreviewableUrl } from "@/components/admin/upload";
import { formatINR } from "@/lib/format";

export type PickedProduct = { id: string; name: string; sku: string; image: string | null; price?: number };

/** Search-and-pick products (e.g. frequently bought together). Submits a JSON array of ids. */
export function ProductPicker({ name, defaultValue, excludeId, max = 3 }: { name: string; defaultValue: PickedProduct[]; excludeId?: string; max?: number }) {
  const [picked, setPicked] = useState<PickedProduct[]>(defaultValue);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestId = useRef(0);

  function search(q: string) {
    setQuery(q);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const id = ++requestId.current;
      setLoading(true);
      try {
        const qs = new URLSearchParams({ q, ...(excludeId ? { exclude: excludeId } : {}) });
        const res = await fetch(`/api/admin/products/search?${qs}`);
        const data = (await res.json()) as { products?: PickedProduct[] };
        if (id === requestId.current) setResults(data.products ?? []);
      } catch {
        if (id === requestId.current) setResults([]);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 250);
  }

  const full = picked.length >= max;

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(picked.map((p) => p.id))} />
      {picked.length > 0 && (
        <ul className="mb-3 space-y-2">
          {picked.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-xl border border-line p-2 pr-3">
              <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-mist">
                {p.image && isPreviewableUrl(p.image) && <AdminImage src={p.image} alt="" fill sizes="80px" className="object-cover" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{p.name}</span>
                <span className="block text-xs text-muted">{p.sku}</span>
              </span>
              <button type="button" onClick={() => setPicked((l) => l.filter((x) => x.id !== p.id))} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${p.name}`}>
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          value={query}
          disabled={full}
          onChange={(e) => search(e.target.value)}
          onFocus={() => {
            setOpen(true);
            if (!results.length) search(query);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={full ? `Maximum ${max} products selected` : "Search products by name or SKU…"}
          aria-label="Search products"
          className="field pl-9"
        />
        {loading && <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted" />}
        {open && !full && results.length > 0 && (
          <ul className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-xl border border-line bg-paper p-1 shadow-lift">
            {results
              .filter((r) => !picked.some((p) => p.id === r.id))
              .map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setPicked((l) => (l.length >= max ? l : [...l, r]));
                      setQuery("");
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-mist"
                  >
                    <span className="relative size-8 shrink-0 overflow-hidden rounded-md bg-mist">
                      {r.image && isPreviewableUrl(r.image) && <AdminImage src={r.image} alt="" fill sizes="64px" className="object-cover" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{r.name}</span>
                      <span className="block text-[11px] text-muted">
                        {r.sku}
                        {r.price !== undefined ? ` · ${formatINR(r.price)}` : ""}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
      <p className="mt-2 text-xs text-muted">Up to {max} products shown as &ldquo;Frequently bought together&rdquo;. Empty = picked automatically from order history.</p>
    </div>
  );
}
