import type { Metadata } from "next";
import { WishlistView } from "@/components/account/wishlist-view";

export const metadata: Metadata = { title: "Wishlist" };

export default function AccountWishlistPage() {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-semibold">Wishlist</h1>
      <WishlistView />
    </div>
  );
}
