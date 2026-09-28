import { cn } from "@/lib/utils";

/**
 * Minimal, dependency-free charts for the admin (server-rendered, CSS-only hover tooltips).
 * Single-series magnitude → one ink hue; the brand yellow marks the hovered bar.
 */

function niceMax(value: number) {
  if (value <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(value));
  const n = value / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * pow;
}

export function ColumnChart({
  data,
  format,
  height = 220,
  label,
}: {
  data: { key: string; label: string; value: number; detail?: string }[];
  format: (v: number) => string;
  height?: number;
  /** Accessible description of the series. */
  label: string;
}) {
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const ticks = [1, 0.5, 0];
  const every = Math.ceil(data.length / 10);
  return (
    <figure aria-label={label} className="w-full">
      <div className="flex gap-2">
        <div className="relative w-14 shrink-0 text-right text-[11px] text-muted tabular-nums" style={{ height }} aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${(1 - t) * 100}%` }}>
              {format(max * t)}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="absolute inset-0" aria-hidden>
            {ticks.map((t) => (
              <div key={t} className={cn("absolute inset-x-0 border-t", t === 0 ? "border-zinc-300" : "border-dashed border-line")} style={{ top: `${(1 - t) * 100}%` }} />
            ))}
          </div>
          <ol className="relative flex items-end gap-[2px]" style={{ height }}>
            {data.map((d) => {
              const pct = (d.value / max) * 100;
              return (
                <li key={d.key} className="group relative flex h-full min-w-0 flex-1 items-end" tabIndex={0} aria-label={`${d.label}: ${format(d.value)}${d.detail ? `, ${d.detail}` : ""}`}>
                  <span
                    className="block w-full rounded-t-[4px] bg-ink transition-colors group-hover:bg-brand group-focus:bg-brand"
                    style={{ height: d.value > 0 ? `max(${pct}%, 2px)` : 0 }}
                  />
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-lg bg-ink px-2.5 py-1.5 text-center text-[11px] whitespace-nowrap text-white shadow-lift group-hover:block group-focus:block">
                    <span className="block font-semibold">{format(d.value)}</span>
                    <span className="block text-zinc-400">
                      {d.label}
                      {d.detail ? ` · ${d.detail}` : ""}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
          <div className="mt-2 flex gap-[2px] text-[10px] text-muted" aria-hidden>
            {data.map((d, i) => (
              <span key={d.key} className="min-w-0 flex-1 overflow-visible text-center whitespace-nowrap">
                {i % every === 0 ? d.label : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    </figure>
  );
}

/** Ranked horizontal bars with direct value labels (category comparisons). */
export function BarList({
  items,
  format,
  empty = "No data for this period.",
}: {
  items: { key: string; label: React.ReactNode; value: number; secondary?: string }[];
  format: (v: number) => string;
  empty?: string;
}) {
  const max = Math.max(0, ...items.map((i) => i.value)) || 1;
  if (!items.length) return <p className="py-6 text-center text-sm text-muted">{empty}</p>;
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.key}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">{item.label}</span>
            <span className="shrink-0 font-medium tabular-nums">
              {format(item.value)}
              {item.secondary && <span className="ml-1.5 text-xs font-normal text-muted">{item.secondary}</span>}
            </span>
          </div>
          <div className="h-2 rounded-full bg-mist">
            <div className="h-2 rounded-full bg-ink" style={{ width: `${Math.max((item.value / max) * 100, item.value > 0 ? 1.5 : 0)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Two-part share bar (e.g. online vs COD) with a legend carrying labels and values. */
export function SplitBar({ parts, format }: { parts: { key: string; label: string; value: number; detail?: string }[]; format: (v: number) => string }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  const colors = ["bg-ink", "bg-brand", "bg-zinc-400"];
  if (!total) return <p className="py-6 text-center text-sm text-muted">No paid orders in this period.</p>;
  return (
    <div>
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-full">
        {parts.map((p, i) =>
          p.value > 0 ? <div key={p.key} className={cn("h-full first:rounded-l-full last:rounded-r-full", colors[i])} style={{ width: `${(p.value / total) * 100}%` }} title={`${p.label}: ${format(p.value)}`} /> : null,
        )}
      </div>
      <ul className="mt-4 space-y-2">
        {parts.map((p, i) => (
          <li key={p.key} className="flex items-center gap-2.5 text-sm">
            <span className={cn("size-2.5 shrink-0 rounded-full", colors[i])} aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block truncate">{p.label}</span>
              {p.detail && <span className="block text-xs text-muted">{p.detail}</span>}
            </span>
            <span className="text-right font-medium tabular-nums">{format(p.value)}</span>
            <span className="w-10 text-right text-xs text-muted tabular-nums">{Math.round((p.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
