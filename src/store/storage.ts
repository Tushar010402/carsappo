"use client";

import { createJSONStorage } from "zustand/middleware";

/**
 * localStorage for persisted stores that hydrate after mount (`skipHydration`).
 * Writes are ignored until the store has loaded its saved state, so an early `set()`
 * (e.g. from an effect that runs before hydration) can't overwrite the saved cart or wishlist.
 */
export function hydrationSafeStorage(hasHydrated: () => boolean) {
  return createJSONStorage(() => ({
    getItem: (key: string) => localStorage.getItem(key),
    setItem: (key: string, value: string) => {
      if (hasHydrated()) localStorage.setItem(key, value);
    },
    removeItem: (key: string) => localStorage.removeItem(key),
  }));
}
