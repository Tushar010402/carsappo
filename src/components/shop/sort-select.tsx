"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/field";
import { SORT_OPTIONS } from "@/lib/constants";

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden text-muted sm:inline">Sort by</span>
      <Select
        value={value}
        onChange={(e) => {
          const sp = new URLSearchParams(params.toString());
          sp.delete("page");
          if (e.target.value === "popular") sp.delete("sort");
          else sp.set("sort", e.target.value);
          router.push(`${pathname}${sp.size ? `?${sp}` : ""}`, { scroll: false });
        }}
        className="h-10 w-auto rounded-full"
        aria-label="Sort products"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </label>
  );
}
