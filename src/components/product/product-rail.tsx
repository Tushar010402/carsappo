"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Horizontal scroll-snap slider with arrow controls. Children are rendered as slides. */
export function Rail({ children, className, itemClassName, dark }: { children: React.ReactNode[]; className?: string; itemClassName?: string; dark?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };
  const btn = cn(
    "grid size-11 place-items-center rounded-full border transition",
    dark ? "border-white/20 text-white hover:bg-white hover:text-ink" : "border-line bg-white hover:border-ink",
  );
  return (
    <div className={cn("relative", className)}>
      <div ref={ref} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
        {children.map((child, i) => (
          <div key={i} className={cn("w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23.5%]", itemClassName)}>
            {child}
          </div>
        ))}
      </div>
      <div className="mt-6 hidden justify-end gap-2 lg:flex">
        <button className={btn} onClick={() => scroll(-1)} aria-label="Scroll left">
          <ChevronLeft className="size-5" />
        </button>
        <button className={btn} onClick={() => scroll(1)} aria-label="Scroll right">
          <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  );
}
