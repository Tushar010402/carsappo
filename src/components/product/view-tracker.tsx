"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

export function ViewItemTracker({ id, name, price, category }: { id: string; name: string; price: number; category: string }) {
  useEffect(() => {
    track("view_item", { value: price, items: [{ item_id: id, item_name: name, price, item_category: category }] });
  }, [id, name, price, category]);
  return null;
}
