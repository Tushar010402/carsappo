"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useWishlist } from "@/store/wishlist";
import { ProductCard } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import type { ProductCardData } from "@/lib/catalog";

export function WishlistView() {
  const ids = useWishlist((s) => s.ids);
  const hydrated = useWishlist((s) => s.hydrated);
  const [result, setResult] = useState<{ key: string; products: ProductCardData[] } | null>(null);
  const key = ids.join(",");

  useEffect(() => {
    if (!hydrated || !key) return;
    let cancelled = false;
    fetch(`/api/products?ids=${key}`)
      .then((r) => r.json())
      .then((d) => !cancelled && setResult({ key, products: d.products }))
      .catch(() => !cancelled && setResult({ key, products: [] }));
    return () => {
      cancelled = true;
    };
  }, [key, hydrated]);

  // Keep showing the previous list while a refetch (e.g. after removing an item) is in flight.
  const products = !key ? [] : (result?.products ?? null);

  if (!hydrated || !products) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-3xl bg-mist" />
        ))}
      </div>
    );
  }
  const visible = products.filter((p) => ids.includes(p.id));
  if (!visible.length) {
    return (
      <EmptyState
        icon={<Heart className="size-6" />}
        title="Your wishlist is empty"
        description="Tap the heart on any product to save it for later."
        action={<ButtonLink href="/shop">Explore products</ButtonLink>}
      />
    );
  }
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
      {visible.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
