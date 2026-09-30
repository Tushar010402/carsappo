"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type Section = { id: string; label: string; visible: boolean };

/** Reorder and show/hide homepage sections. Submits a JSON array of { id, visible } under `name`. */
export function SectionsEditor({ name, defaultValue }: { name: string; defaultValue: Section[] }) {
  const [sections, setSections] = useState(defaultValue);
  const move = (from: number, to: number) =>
    setSections((list) => {
      if (to < 0 || to >= list.length) return list;
      const next = [...list];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  const btn = "grid size-8 place-items-center rounded-lg text-muted transition hover:bg-mist hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(sections.map(({ id, visible }) => ({ id, visible })))} />
      <ol className="divide-y divide-line rounded-xl border border-line">
        <li className="flex items-center gap-3 bg-mist/60 px-3 py-2.5 text-sm text-muted">
          <span className="w-6 text-right text-xs tabular-nums">—</span>
          <span className="flex-1">Hero (always first)</span>
        </li>
        {sections.map((s, i) => (
          <li key={s.id} className={cn("flex items-center gap-3 px-3 py-2", !s.visible && "bg-mist/40")}>
            <span className="w-6 text-right text-xs text-muted tabular-nums">{i + 1}.</span>
            <span className={cn("flex-1 text-sm font-medium", !s.visible && "text-muted line-through")}>{s.label}</span>
            <button
              type="button"
              className={cn("inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold", s.visible ? "text-success hover:bg-mist" : "text-muted hover:bg-mist")}
              onClick={() => setSections((list) => list.map((x) => (x.id === s.id ? { ...x, visible: !x.visible } : x)))}
              aria-pressed={s.visible}
              aria-label={`${s.visible ? "Hide" : "Show"} ${s.label}`}
            >
              {s.visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />} {s.visible ? "Shown" : "Hidden"}
            </button>
            <button type="button" className={btn} onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={`Move ${s.label} up`}>
              <ArrowUp className="size-3.5" />
            </button>
            <button type="button" className={btn} onClick={() => move(i, i + 1)} disabled={i === sections.length - 1} aria-label={`Move ${s.label} down`}>
              <ArrowDown className="size-3.5" />
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
