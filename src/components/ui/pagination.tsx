import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({ page, pages, hrefFor }: { page: number; pages: number; hrefFor: (p: number) => string }) {
  if (pages <= 1) return null;
  const nums = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  const sorted = [...nums].sort((a, b) => a - b);
  const cell = "grid h-10 min-w-10 place-items-center rounded-full px-3 text-sm font-medium";
  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-1.5">
      {page > 1 && (
        <Link href={hrefFor(page - 1)} className={cn(cell, "hover:bg-mist")} aria-label="Previous page" rel="prev">
          <ChevronLeft className="size-4" />
        </Link>
      )}
      {sorted.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && sorted[i - 1] !== n - 1 && <span className="px-1 text-muted">…</span>}
          <Link
            href={hrefFor(n)}
            aria-current={n === page ? "page" : undefined}
            className={cn(cell, n === page ? "bg-ink text-white" : "hover:bg-mist")}
          >
            {n}
          </Link>
        </span>
      ))}
      {page < pages && (
        <Link href={hrefFor(page + 1)} className={cn(cell, "hover:bg-mist")} aria-label="Next page" rel="next">
          <ChevronRight className="size-4" />
        </Link>
      )}
    </nav>
  );
}
