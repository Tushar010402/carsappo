"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const iconBtn = "grid size-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-mist hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent";

function move<T>(list: T[], from: number, to: number) {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function useRows<T>(initial: T[]) {
  const seq = useRef(initial.length);
  const [rows, setRows] = useState(() => initial.map((value, i) => ({ key: i, value })));
  return {
    rows,
    setRows,
    add: (value: T) => setRows((r) => [...r, { key: seq.current++, value }]),
    update: (key: number, value: T) => setRows((r) => r.map((row) => (row.key === key ? { ...row, value } : row))),
    remove: (key: number) => setRows((r) => r.filter((row) => row.key !== key)),
    moveBy: (index: number, delta: number) => setRows((r) => move(r, index, index + delta)),
  };
}

/** Ordered list of short strings (e.g. product features). Submits a JSON array under `name`. */
export function ListEditor({
  name,
  defaultValue = [],
  placeholder = "Add an item",
  addLabel = "Add item",
  max = 30,
}: {
  name: string;
  defaultValue?: string[];
  placeholder?: string;
  addLabel?: string;
  max?: number;
}) {
  const { rows, add, update, remove, moveBy } = useRows<string>(defaultValue);
  const values = rows.map((r) => r.value.trim()).filter(Boolean);
  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={JSON.stringify(values)} />
      {rows.map((row, i) => (
        <div key={row.key} className="flex items-center gap-1.5">
          <span className="w-5 shrink-0 text-right text-xs text-muted tabular-nums">{i + 1}.</span>
          <input
            className="field py-2"
            value={row.value}
            placeholder={placeholder}
            aria-label={`${placeholder} ${i + 1}`}
            onChange={(e) => update(row.key, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (rows.length < max) add("");
              }
            }}
          />
          <button type="button" className={iconBtn} onClick={() => moveBy(i, -1)} disabled={i === 0} aria-label="Move up">
            <ArrowUp className="size-3.5" />
          </button>
          <button type="button" className={iconBtn} onClick={() => moveBy(i, 1)} disabled={i === rows.length - 1} aria-label="Move down">
            <ArrowDown className="size-3.5" />
          </button>
          <button type="button" className={cn(iconBtn, "hover:bg-red-50 hover:text-red-600")} onClick={() => remove(row.key)} aria-label="Remove">
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ))}
      {rows.length < max && (
        <button type="button" onClick={() => add("")} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-ink hover:bg-mist">
          <Plus className="size-4" /> {addLabel}
        </button>
      )}
    </div>
  );
}

/** Free-form tags as chips. Enter or comma adds a tag. Submits a JSON array under `name`. */
export function TagsInput({ name, defaultValue = [], placeholder = "Type and press Enter", max = 30 }: { name: string; defaultValue?: string[]; placeholder?: string; max?: number }) {
  const [tags, setTags] = useState<string[]>(defaultValue);
  const [draft, setDraft] = useState("");

  const commit = (raw: string) => {
    const parts = raw
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    if (!parts.length) return;
    setTags((current) => [...new Set([...current, ...parts])].slice(0, max));
    setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && !draft && tags.length) {
      setTags((t) => t.slice(0, -1));
    }
  };

  return (
    <div className="field flex min-h-11 flex-wrap items-center gap-1.5 py-1.5">
      <input type="hidden" name={name} value={JSON.stringify(tags)} />
      {tags.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-mist py-0.5 pr-1 pl-2.5 text-xs font-medium">
          {tag}
          <button type="button" onClick={() => setTags((t) => t.filter((x) => x !== tag))} className="grid size-4 place-items-center rounded-full hover:bg-zinc-200" aria-label={`Remove ${tag}`}>
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => commit(draft)}
        placeholder={tags.length ? "" : placeholder}
        aria-label="Add tag"
        className="min-w-24 flex-1 bg-transparent py-1 text-sm outline-none"
      />
    </div>
  );
}

type RowField = { key: string; label: string; placeholder?: string; multiline?: boolean; width?: string };

/** Repeating rows of several text fields (specifications, FAQs). Submits a JSON array of objects. */
export function RowsEditor({
  name,
  fields,
  defaultValue = [],
  addLabel = "Add row",
  max = 50,
}: {
  name: string;
  fields: RowField[];
  defaultValue?: Record<string, string>[];
  addLabel?: string;
  max?: number;
}) {
  const empty = Object.fromEntries(fields.map((f) => [f.key, ""]));
  const { rows, add, update, remove, moveBy } = useRows<Record<string, string>>(defaultValue);
  const values = rows.map((r) => r.value).filter((v) => fields.some((f) => (v[f.key] ?? "").trim()));
  const stacked = fields.some((f) => f.multiline);

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={JSON.stringify(values)} />
      {rows.map((row, i) => (
        <div key={row.key} className={cn("flex gap-1.5", stacked ? "items-start rounded-xl border border-line p-3" : "items-center")}>
          <div className={cn("min-w-0 flex-1 gap-2", stacked ? "grid" : "grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]")}>
            {fields.map((f) =>
              f.multiline ? (
                <textarea
                  key={f.key}
                  className="field min-h-20 py-2"
                  value={row.value[f.key] ?? ""}
                  placeholder={f.placeholder ?? f.label}
                  aria-label={`${f.label} ${i + 1}`}
                  onChange={(e) => update(row.key, { ...row.value, [f.key]: e.target.value })}
                />
              ) : (
                <input
                  key={f.key}
                  className="field py-2"
                  value={row.value[f.key] ?? ""}
                  placeholder={f.placeholder ?? f.label}
                  aria-label={`${f.label} ${i + 1}`}
                  onChange={(e) => update(row.key, { ...row.value, [f.key]: e.target.value })}
                />
              ),
            )}
          </div>
          <div className={cn("flex", stacked ? "flex-col" : "items-center")}>
            <button type="button" className={iconBtn} onClick={() => moveBy(i, -1)} disabled={i === 0} aria-label="Move up">
              <ArrowUp className="size-3.5" />
            </button>
            <button type="button" className={iconBtn} onClick={() => moveBy(i, 1)} disabled={i === rows.length - 1} aria-label="Move down">
              <ArrowDown className="size-3.5" />
            </button>
            <button type="button" className={cn(iconBtn, "hover:bg-red-50 hover:text-red-600")} onClick={() => remove(row.key)} aria-label="Remove row">
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      ))}
      {rows.length < max && (
        <button type="button" onClick={() => add({ ...empty })} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-ink hover:bg-mist">
          <Plus className="size-4" /> {addLabel}
        </button>
      )}
    </div>
  );
}
