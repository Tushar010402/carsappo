"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/** Client-side tabs over server-rendered panels. */
export function Tabs({ tabs, dark }: { tabs: { id: string; label: string; content: React.ReactNode }[]; dark?: boolean }) {
  const [active, setActive] = useState(tabs[0]?.id);
  return (
    <div>
      <div role="tablist" className={cn("no-scrollbar mb-8 flex gap-2 overflow-x-auto", dark && "text-white")}>
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={active === t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              "h-10 shrink-0 rounded-full px-5 font-display text-sm font-medium transition",
              active === t.id
                ? dark
                  ? "bg-brand text-ink"
                  : "bg-ink text-white"
                : dark
                  ? "border border-white/15 text-zinc-300 hover:border-white/40"
                  : "border border-line text-zinc-600 hover:border-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" hidden={active !== t.id}>
          {t.content}
        </div>
      ))}
    </div>
  );
}
