"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { SmartImage } from "@/components/ui/smart-image";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/cart";
import { formatINR } from "@/lib/format";
import { toast } from "@/components/providers/toast";
import { track } from "@/lib/analytics";
import type { CartProduct } from "@/components/product/add-to-cart";

export function FrequentlyBoughtTogether({ items }: { items: CartProduct[] }) {
  const add = useCart((s) => s.add);
  const openDrawer = useCart((s) => s.openDrawer);
  const [selected, setSelected] = useState<string[]>(items.filter((i) => i.stock > 0).map((i) => i.productId));
  const chosen = items.filter((i) => selected.includes(i.productId));
  const total = chosen.reduce((a, i) => a + i.price, 0);
  const mrp = chosen.reduce((a, i) => a + Math.max(i.mrp ?? i.price, i.price), 0);

  return (
    <div className="rounded-[28px] border border-line p-5 sm:p-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {items.map((item, idx) => (
            <div key={item.productId} className="flex items-center gap-3">
              {idx > 0 && <Plus className="size-5 shrink-0 text-muted" />}
              <label className="relative block w-28 cursor-pointer sm:w-36">
                <input
                  type="checkbox"
                  className="absolute top-2 left-2 z-10 size-4 accent-ink"
                  checked={selected.includes(item.productId)}
                  disabled={idx === 0 || item.stock <= 0}
                  onChange={(e) =>
                    setSelected((s) => (e.target.checked ? [...s, item.productId] : s.filter((x) => x !== item.productId)))
                  }
                  aria-label={`Include ${item.name}`}
                />
                <span className="relative block aspect-square overflow-hidden rounded-2xl bg-mist">
                  {item.image && <SmartImage src={item.image} alt={item.name} fill sizes="144px" className="object-cover" />}
                </span>
                <span className="mt-2 line-clamp-2 block text-xs font-medium">
                  {idx === 0 ? (
                    `This item: ${item.name}`
                  ) : (
                    <Link href={`/product/${item.slug}`} className="hover:underline">
                      {item.name}
                    </Link>
                  )}
                </span>
                <span className="mt-0.5 block font-display text-sm font-semibold">{formatINR(item.price)}</span>
              </label>
            </div>
          ))}
        </div>
        <div className="shrink-0 rounded-2xl bg-mist p-5 lg:w-64">
          <p className="text-sm text-muted">Total for {chosen.length} item(s)</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-2xl font-semibold">{formatINR(total)}</span>
            {mrp > total && <span className="text-sm text-muted line-through">{formatINR(mrp)}</span>}
          </p>
          <Button
            className="mt-4 w-full"
            variant="dark"
            disabled={!chosen.length}
            onClick={() => {
              chosen.forEach((i) => add(i, 1));
              track("add_to_cart", { value: total, items: chosen.map((i) => ({ item_id: i.productId, item_name: i.name, price: i.price, quantity: 1 })) });
              toast(`${chosen.length} items added to cart`);
              openDrawer();
            }}
          >
            Add selected to cart
          </Button>
        </div>
      </div>
    </div>
  );
}
