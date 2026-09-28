import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/ui/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";
import { cn } from "@/lib/utils";

export function Breadcrumbs({ items, light }: { items: { name: string; path: string }[]; light?: boolean }) {
  const all = [{ name: "Home", path: "/" }, ...items];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(all)} />
      <nav aria-label="Breadcrumb" className="no-scrollbar overflow-x-auto">
        <ol className={cn("flex items-center gap-1.5 text-xs whitespace-nowrap", light ? "text-zinc-400" : "text-muted")}>
          {all.map((c, i) => (
            <li key={c.path} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="size-3" aria-hidden />}
              {i === all.length - 1 ? (
                <span className={cn("font-medium", light ? "text-white" : "text-ink")} aria-current="page">
                  {c.name}
                </span>
              ) : (
                <Link href={c.path} className={light ? "hover:text-white" : "hover:text-ink"}>
                  {c.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
