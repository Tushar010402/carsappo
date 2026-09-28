import type { Metadata } from "next";
import { Package } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OrderList } from "@/components/account/order-list";
import { EmptyState } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "My orders" };

export default async function OrdersPage() {
  const user = await requireUser("/account/orders");
  const orders = await prisma.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { items: true } });
  return (
    <div>
      <h1 className="mb-6 text-3xl font-semibold">My orders</h1>
      {orders.length ? (
        <OrderList orders={orders} />
      ) : (
        <EmptyState icon={<Package className="size-6" />} title="No orders yet" description="When you place an order it will show up here." action={<ButtonLink href="/shop">Shop now</ButtonLink>} />
      )}
    </div>
  );
}
