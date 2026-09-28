import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CategoryIcon } from "@/components/icons/category-icon";
import { SmartImage } from "@/components/ui/smart-image";

export function CategoryGrid({
  categories,
}: {
  categories: { id: string; name: string; slug: string; icon: string | null; image: string | null; description: string | null }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      {categories.map((c, i) => (
        <Link
          key={c.id}
          href={`/category/${c.slug}`}
          className={`group relative flex aspect-square flex-col justify-between overflow-hidden rounded-[var(--radius-card)] p-5 transition hover:-translate-y-0.5 hover:shadow-lift md:aspect-[5/4] ${
            i === 0 ? "bg-brand" : i === 3 ? "bg-ink text-white" : "bg-mist"
          }`}
        >
          {c.image && !c.image.includes("/placeholders/") ? (
            <SmartImage src={c.image} alt="" fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover opacity-90 transition group-hover:scale-105" />
          ) : null}
          <CategoryIcon
            name={c.icon}
            className={`pointer-events-none absolute -right-6 -bottom-6 size-40 opacity-[0.07] transition duration-500 group-hover:scale-110 group-hover:opacity-[0.12] max-sm:hidden`}
          />
          <div className="relative flex items-start justify-between">
            <span className={`grid size-12 place-items-center rounded-2xl ${i === 3 ? "bg-white/10" : "bg-white"}`}>
              <CategoryIcon name={c.icon} className="size-6" />
            </span>
            <ArrowUpRight className="size-5 opacity-40 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
          </div>
          <div className="relative">
            <h3 className="font-display text-lg font-semibold sm:text-xl">{c.name}</h3>
            {c.description && <p className={`mt-1 line-clamp-2 text-xs ${i === 3 ? "text-zinc-400" : "text-ink/60"}`}>{c.description}</p>}
          </div>
        </Link>
      ))}
    </div>
  );
}
