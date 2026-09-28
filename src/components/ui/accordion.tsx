import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Accordion({ items, className }: { items: { q: string; a: React.ReactNode }[]; className?: string }) {
  return (
    <div className={cn("divide-y divide-line border-y border-line", className)}>
      {items.map((item, i) => (
        <details key={i} className="group py-1">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-[15px] font-medium">
            {item.q}
            <Plus className="size-4 shrink-0 transition-transform group-open:rotate-45" aria-hidden />
          </summary>
          <div className="pb-5 text-sm leading-relaxed text-muted">{item.a}</div>
        </details>
      ))}
    </div>
  );
}
