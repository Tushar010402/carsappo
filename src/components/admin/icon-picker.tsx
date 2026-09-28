"use client";

import { useState } from "react";
import { CATEGORY_ICONS } from "@/components/icons/category-icon";
import { cn } from "@/lib/utils";

/** Grid picker for the lucide icons available to category tiles. */
export function IconPicker({ name, defaultValue }: { name: string; defaultValue?: string | null }) {
  const [value, setValue] = useState(defaultValue ?? "");
  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8" role="radiogroup" aria-label="Category icon">
        {Object.entries(CATEGORY_ICONS).map(([key, Icon]) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={value === key}
            aria-label={key}
            title={key}
            onClick={() => setValue(value === key ? "" : key)}
            className={cn(
              "grid aspect-square place-items-center rounded-xl border transition",
              value === key ? "border-ink bg-ink text-brand" : "border-line text-ink hover:border-ink/40",
            )}
          >
            <Icon className="size-5" strokeWidth={1.6} />
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-muted">{value ? `Selected: ${value}` : "No icon selected (a grid icon is used)."}</p>
    </div>
  );
}
