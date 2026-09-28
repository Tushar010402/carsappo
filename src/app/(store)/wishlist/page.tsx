import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { WishlistView } from "@/components/account/wishlist-view";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default async function WishlistPage() {
  const user = await getCurrentUser();
  return (
    <div className="container-x py-10 sm:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-semibold sm:text-4xl">Your wishlist</h1>
        {!user && (
          <p className="text-sm text-muted">
            <Link href="/login?next=/wishlist" className="font-semibold text-ink underline">
              Log in
            </Link>{" "}
            to save your wishlist across devices.
          </p>
        )}
      </div>
      <WishlistView />
    </div>
  );
}
