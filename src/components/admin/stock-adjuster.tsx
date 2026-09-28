"use client";

import { useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { AdminForm, useAdminFormState } from "@/components/admin/form";
import { adjustStock } from "@/app/admin/_actions/inventory";
import { cn } from "@/lib/utils";

function SaveButton({ dirty }: { dirty: boolean }) {
  const { pending } = useAdminFormState();
  return (
    <button
      type="submit"
      disabled={pending || !dirty}
      className="grid size-8 place-items-center rounded-lg bg-ink text-white transition disabled:bg-zinc-200 disabled:text-zinc-400"
      aria-label="Save stock"
    >
      <Check className="size-4" />
    </button>
  );
}

/** Inline stock editor: type an absolute value or nudge with −/+, then save. */
export function StockAdjuster({ productId, stock, name }: { productId: string; stock: number; name: string }) {
  const [value, setValue] = useState(String(stock));
  const n = Number(value);
  const valid = value !== "" && Number.isInteger(n) && n >= 0;
  const dirty = valid && n !== stock;
  const nudge = (d: number) => setValue(String(Math.max(0, (valid ? n : stock) + d)));

  return (
    <AdminForm action={adjustStock} className="flex items-center justify-end gap-1">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="mode" value="set" />
      <button type="button" onClick={() => nudge(-1)} className="grid size-8 place-items-center rounded-lg border border-line text-muted hover:border-ink hover:text-ink" aria-label={`Decrease stock of ${name}`}>
        <Minus className="size-3.5" />
      </button>
      <input
        name="quantity"
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label={`Stock for ${name}`}
        className={cn("h-8 w-20 rounded-lg border px-2 text-center text-sm tabular-nums outline-none focus:ring-2 focus:ring-brand/40", dirty ? "border-ink bg-brand-soft" : "border-line")}
      />
      <button type="button" onClick={() => nudge(1)} className="grid size-8 place-items-center rounded-lg border border-line text-muted hover:border-ink hover:text-ink" aria-label={`Increase stock of ${name}`}>
        <Plus className="size-3.5" />
      </button>
      <SaveButton dirty={dirty} />
    </AdminForm>
  );
}
