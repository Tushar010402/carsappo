import type { Metadata } from "next";
import { CartView } from "@/components/checkout/cart-view";

export const metadata: Metadata = { title: "Your Cart", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container-x py-10 sm:py-14">
      <h1 className="mb-8 text-3xl font-semibold sm:text-4xl">Your cart</h1>
      <CartView />
    </div>
  );
}
