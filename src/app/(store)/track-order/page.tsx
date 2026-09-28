import type { Metadata } from "next";
import Link from "next/link";
import { Truck } from "lucide-react";
import { pageMetadata } from "@/lib/seo";
import { TrackOrderForm } from "@/components/order/track-form";

export const metadata: Metadata = pageMetadata({ title: "Track Your Order", description: "Track your Carsappo order with your order number and email or phone.", path: "/track-order" });

export default function TrackOrderPage() {
  return (
    <div className="container-x max-w-lg py-14 sm:py-20">
      <span className="grid size-14 place-items-center rounded-2xl bg-brand">
        <Truck className="size-7" />
      </span>
      <h1 className="mt-6 text-4xl font-semibold">Track your order</h1>
      <p className="mt-2 text-muted">
        Enter your order number and the email or phone you used at checkout. Have an account?{" "}
        <Link href="/account/track" className="font-semibold text-ink underline">
          Track from your dashboard
        </Link>
        .
      </p>
      <div className="mt-8 rounded-[28px] border border-line p-6">
        <TrackOrderForm />
      </div>
    </div>
  );
}
