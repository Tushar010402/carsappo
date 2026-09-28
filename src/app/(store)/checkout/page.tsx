import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { razorpayEnabled } from "@/lib/razorpay";
import { CheckoutView } from "@/components/checkout/checkout-view";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);
  const addresses = user
    ? await prisma.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] })
    : [];

  return (
    <div className="container-x py-10 sm:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-semibold sm:text-4xl">Checkout</h1>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <Lock className="size-4" /> Secure checkout ·{" "}
          <Link href="/cart" className="underline">
            Back to cart
          </Link>
        </p>
      </div>
      <CheckoutView
        user={user ? { name: user.name, email: user.email, phone: user.phone } : null}
        addresses={addresses.map((a) => ({
          id: a.id,
          name: a.name,
          phone: a.phone,
          line1: a.line1,
          line2: a.line2 ?? "",
          landmark: a.landmark ?? "",
          city: a.city,
          state: a.state,
          pincode: a.pincode,
          isDefault: a.isDefault,
        }))}
        razorpayAvailable={razorpayEnabled()}
        codFee={settings.shipping.codEnabled ? settings.shipping.codFee : 0}
      />
    </div>
  );
}
