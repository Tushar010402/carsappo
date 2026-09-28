import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Compact pagination footer for admin tables. */
export function AdminPagination({
  page,
  pageSize,
  total,
  hrefFor,
}: {
  page: number;
  pageSize: number;
  total: number;
  hrefFor: (page: number) => string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const nums = [...new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages))].sort((a, b) => a - b);
  const cell = "grid h-8 min-w-8 place-items-center rounded-lg px-2 text-xs font-medium tabular-nums";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-xs text-muted">
      <p>
        Showing <b className="text-ink tabular-nums">{from}</b>–<b className="text-ink tabular-nums">{to}</b> of{" "}
        <b className="text-ink tabular-nums">{total}</b>
      </p>
      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-1">
          {page > 1 ? (
            <Link href={hrefFor(page - 1)} className={cn(cell, "hover:bg-mist")} aria-label="Previous page">
              <ChevronLeft className="size-4" />
            </Link>
          ) : (
            <span className={cn(cell, "opacity-40")} aria-hidden>
              <ChevronLeft className="size-4" />
            </span>
          )}
          {nums.map((n, i) => (
            <span key={n} className="flex items-center gap-1">
              {i > 0 && nums[i - 1] !== n - 1 && <span className="px-0.5">…</span>}
              <Link
                href={hrefFor(n)}
                aria-current={n === page ? "page" : undefined}
                className={cn(cell, n === page ? "bg-ink text-white" : "text-ink hover:bg-mist")}
              >
                {n}
              </Link>
            </span>
          ))}
          {page < pages ? (
            <Link href={hrefFor(page + 1)} className={cn(cell, "hover:bg-mist")} aria-label="Next page">
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <span className={cn(cell, "opacity-40")} aria-hidden>
              <ChevronRight className="size-4" />
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
