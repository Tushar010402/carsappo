"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  price: number; // paise, display only — server re-prices at checkout
  mrp: number | null;
  sku: string;
  stock: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  couponCode: string | null;
  pincode: string | null;
  drawerOpen: boolean;
  hydrated: boolean;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  setCoupon: (code: string | null) => void;
  setPincode: (pincode: string | null) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  /** Sync display data (price/stock/qty) from a server quote. */
  syncFromQuote: (lines: { productId: string; price: number; mrp: number | null; stock: number; quantity: number }[], removed: string[]) => void;
};

const MAX_QTY = 20;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      couponCode: null,
      pincode: null,
      drawerOpen: false,
      hydrated: false,
      add: (item, quantity = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.productId === item.productId);
          const limit = Math.min(item.stock, MAX_QTY);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.productId === item.productId ? { ...i, ...item, quantity: Math.min(i.quantity + quantity, limit) } : i,
              ),
            };
          }
          return { items: [...s.items, { ...item, quantity: Math.min(quantity, limit) }] };
        }),
      setQuantity: (productId, quantity) =>
        set((s) => ({
          items: s.items
            .map((i) => (i.productId === productId ? { ...i, quantity: Math.min(Math.max(quantity, 0), Math.min(i.stock, MAX_QTY)) } : i))
            .filter((i) => i.quantity > 0),
        })),
      remove: (productId) => set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [], couponCode: null }),
      setCoupon: (couponCode) => set({ couponCode }),
      setPincode: (pincode) => set({ pincode }),
      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),
      syncFromQuote: (lines, removed) =>
        set((s) => ({
          items: s.items
            .filter((i) => !removed.includes(i.productId))
            .map((i) => {
              const line = lines.find((l) => l.productId === i.productId);
              return line ? { ...i, price: line.price, mrp: line.mrp, stock: line.stock, quantity: line.quantity } : i;
            }),
        })),
    }),
    {
      name: "carsappo-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items, couponCode: s.couponCode, pincode: s.pincode }),
      skipHydration: true,
      onRehydrateStorage: () => () => {
        useCart.setState({ hydrated: true });
      },
    },
  ),
);

export function cartCount(items: CartItem[]) {
  return items.reduce((a, i) => a + i.quantity, 0);
}

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((a, i) => a + i.price * i.quantity, 0);
}
