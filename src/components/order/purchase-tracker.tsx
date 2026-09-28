"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";
import { useCart } from "@/store/cart";

/** Fires the purchase conversion once per order and clears the cart after a successful checkout. */
export function PurchaseTracker({
  orderNumber,
  total,
  items,
}: {
  orderNumber: string;
  total: number;
  items: { id: string; name: string; price: number; quantity: number }[];
}) {
  useEffect(() => {
    useCart.getState().clear();
    const key = `cs-purchase-${orderNumber}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {
      /* storage unavailable */
    }
    track("purchase", {
      value: total,
      transactionId: orderNumber,
      items: items.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })),
    });
  }, [orderNumber, total, items]);
  return null;
}
