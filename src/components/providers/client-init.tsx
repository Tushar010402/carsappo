"use client";

import { useEffect } from "react";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useGarage } from "@/store/garage";
import { syncWishlist } from "@/app/actions/wishlist";

/**
 * Rehydrates persisted client stores after mount (avoids SSR hydration mismatches) and,
 * for signed-in shoppers, merges the local wishlist with the saved one.
 */
export function ClientInit({ userId, serverWishlist }: { userId: string | null; serverWishlist: string[] | null }) {
  useEffect(() => {
    useWishlist.setState({ loggedIn: !!userId });
    void useCart.persist.rehydrate();
    void useGarage.persist.rehydrate();
    Promise.resolve(useWishlist.persist.rehydrate()).then(() => {
      if (!userId || !serverWishlist) return;
      const local = useWishlist.getState().ids;
      const missingOnServer = local.filter((id) => !serverWishlist.includes(id));
      useWishlist.getState().set([...serverWishlist, ...missingOnServer]);
      if (missingOnServer.length) void syncWishlist(missingOnServer);
    });
  }, [userId, serverWishlist]);
  return null;
}
