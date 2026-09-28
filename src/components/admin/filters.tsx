"use client";

import Form from "next/form";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Search } from "lucide-react";
import { Select } from "@/components/ui/field";
import { cn } from "@/lib/utils";

/** GET filter bar: updates the URL search params with client-side navigation. */
export function FilterBar({ action, children, resetHref, className }: { action: string; children: ReactNode; resetHref?: string; className?: string }) {
  return (
    <Form action={action} replace className={cn("flex flex-wrap items-end gap-2 border-b border-line px-4 py-3", className)}>
      {children}
      <button type="submit" className="h-10 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition hover:bg-ink-soft">
        Apply
      </button>
      {resetHref && (
        <Link href={resetHref} className="h-10 rounded-xl px-3 text-sm leading-10 font-medium text-muted hover:text-ink">
          Reset
        </Link>
      )}
    </Form>
  );
}

export function SearchInput({ name = "q", defaultValue, placeholder = "Search…", className }: { name?: string; defaultValue?: string; placeholder?: string; className?: string }) {
  return (
    <label className={cn("relative block w-full min-w-52 sm:w-auto sm:flex-1", className)}>
      <span className="sr-only">{placeholder}</span>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input type="search" name={name} defaultValue={defaultValue} placeholder={placeholder} className="field h-10 py-0 pl-9" />
    </label>
  );
}

/** Select that re-submits its filter form immediately on change. */
export function FilterSelect({ label, className, children, ...props }: ComponentProps<"select"> & { label: string }) {
  return (
    <label className={cn("block min-w-[9rem] flex-1 sm:flex-none", className)}>
      <span className="mb-1 block text-[11px] font-semibold tracking-wide text-muted uppercase">{label}</span>
      <Select {...props} className="h-10 py-0 sm:min-w-36" onChange={(e) => e.currentTarget.form?.requestSubmit()}>
        {children}
      </Select>
    </label>
  );
}

export function FilterDate({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) {
  return (
    <label className="block min-w-[9rem] flex-1 sm:flex-none">
      <span className="mb-1 block text-[11px] font-semibold tracking-wide text-muted uppercase">{label}</span>
      <input type="date" name={name} defaultValue={defaultValue} className="field h-10 py-0" />
    </label>
  );
}
