import Link from "next/link";
import { Heart, MapPin, Package, Ticket } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OrderList } from "@/components/account/order-list";
import { PasswordForm, ProfileForm } from "@/components/account/profile-forms";
import { EmptyState } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";

export default async function AccountOverview() {
  const user = await requireUser("/account");
  const [orders, orderCount, wishlistCount, addressCount] = await Promise.all([
    prisma.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 3, include: { items: true } }),
    prisma.order.count({ where: { userId: user.id } }),
    prisma.wishlistItem.count({ where: { userId: user.id } }),
    prisma.address.count({ where: { userId: user.id } }),
  ]);

  const stats = [
    { label: "Orders", value: orderCount, href: "/account/orders", icon: Package },
    { label: "Wishlist", value: wishlistCount, href: "/account/wishlist", icon: Heart },
    { label: "Addresses", value: addressCount, href: "/account/addresses", icon: MapPin },
    { label: "Coupons", value: "View", href: "/account/coupons", icon: Ticket },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold">Hi, {user.name.split(" ")[0]} 👋</h1>
        <p className="mt-1 text-muted">Manage your orders, addresses and account details.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(({ label, value, href, icon: Icon }) => (
          <Link key={label} href={href} className="rounded-2xl border border-line p-5 transition hover:border-ink">
            <Icon className="size-5 text-muted" />
            <p className="mt-3 font-display text-2xl font-semibold">{value}</p>
            <p className="text-sm text-muted">{label}</p>
          </Link>
        ))}
      </div>
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent orders</h2>
          {orderCount > 3 && (
            <Link href="/account/orders" className="text-sm font-semibold underline">
              View all
            </Link>
          )}
        </div>
        {orders.length ? (
          <OrderList orders={orders} />
        ) : (
          <EmptyState icon={<Package className="size-6" />} title="No orders yet" action={<ButtonLink href="/shop">Start shopping</ButtonLink>} />
        )}
      </section>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-[28px] border border-line p-6">
          <h2 className="mb-5 text-lg font-semibold">Profile</h2>
          <ProfileForm name={user.name} phone={user.phone} email={user.email} />
        </section>
        <section className="rounded-[28px] border border-line p-6">
          <h2 className="mb-5 text-lg font-semibold">Password</h2>
          <PasswordForm />
        </section>
      </div>
    </div>
  );
}
