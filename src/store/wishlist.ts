"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { hydrationSafeStorage } from "@/store/storage";

type WishlistState = {
  ids: string[];
  hydrated: boolean;
  loggedIn: boolean;
  has: (id: string) => boolean;
  set: (ids: string[]) => void;
  toggleLocal: (id: string) => boolean;
};

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      hydrated: false,
      loggedIn: false,
      has: (id) => get().ids.includes(id),
      set: (ids) => set({ ids: [...new Set(ids)] }),
      toggleLocal: (id) => {
        const exists = get().ids.includes(id);
        set({ ids: exists ? get().ids.filter((x) => x !== id) : [id, ...get().ids] });
        return !exists;
      },
    }),
    {
      name: "carsappo-wishlist",
      storage: hydrationSafeStorage((): boolean => useWishlist.persist.hasHydrated()),
      partialize: (s) => ({ ids: s.ids }),
      skipHydration: true,
      onRehydrateStorage: () => () => {
        useWishlist.setState({ hydrated: true });
      },
    },
  ),
);
