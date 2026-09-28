"use client";

import { useState } from "react";
import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/utils";

/** Markdown textarea with a live preview tab. */
export function MarkdownEditor({
  name,
  id,
  defaultValue = "",
  rows = 14,
  placeholder = "Write in Markdown: ## Heading, **bold**, - lists, [links](/shop)…",
}: {
  name: string;
  id?: string;
  defaultValue?: string;
  rows?: number;
  placeholder?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div className="overflow-hidden rounded-xl border border-line focus-within:border-ink focus-within:ring-2 focus-within:ring-brand/40">
      <div className="flex items-center justify-between border-b border-line bg-mist/60 px-2">
        <div role="tablist" className="flex">
          {(["write", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn("-mb-px border-b-2 px-3 py-2 text-xs font-semibold capitalize transition", tab === t ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink")}
            >
              {t}
            </button>
          ))}
        </div>
        <span className="px-2 text-[11px] text-muted tabular-nums">{words} words · Markdown</span>
      </div>
      <textarea
        id={id ?? name}
        name={name}
        value={value}
        rows={rows}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={cn("block w-full resize-y bg-paper px-3.5 py-3 font-mono text-[13px] leading-6 text-ink outline-none", tab !== "write" && "hidden")}
      />
      {tab === "preview" && (
        <div className="max-h-[32rem] min-h-40 overflow-y-auto bg-paper px-5 py-2">
          {value.trim() ? <Markdown>{value}</Markdown> : <p className="py-6 text-sm text-muted">Nothing to preview yet.</p>}
        </div>
      )}
    </div>
  );
}
