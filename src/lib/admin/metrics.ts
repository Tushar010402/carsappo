import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Orders that count towards revenue: paid online/COD orders, plus COD orders that are
 * still live (not cancelled/returned). Refunded orders are excluded.
 */
export const revenueWhere: Prisma.OrderWhereInput = {
  OR: [
    { paymentStatus: "PAID" },
    { paymentMethod: "COD", paymentStatus: "PENDING", status: { notIn: ["CANCELLED", "RETURNED", "PENDING"] } },
  ],
};

/** Same rule as `revenueWhere`, for raw SQL against the "Order" table aliased as o. */
export const REVENUE_SQL = Prisma.sql`(o."paymentStatus" = 'PAID' OR (o."paymentMethod" = 'COD' AND o."paymentStatus" = 'PENDING' AND o."status" NOT IN ('CANCELLED', 'RETURNED', 'PENDING')))`;

/** Orders that are confirmed but not yet handed to the courier. */
export const toShipWhere: Prisma.OrderWhereInput = { status: { in: ["CONFIRMED", "PROCESSING"] } };

export async function lowStockProducts(take?: number) {
  // Compare two columns: Prisma can't express stock <= lowStockAlert without a raw query.
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Product" WHERE "isActive" = true AND stock <= "lowStockAlert" ORDER BY stock ASC, name ASC ${
      take ? Prisma.sql`LIMIT ${take}` : Prisma.empty
    }`;
  return rows.map((r) => r.id);
}

export async function lowStockCount() {
  const [row] = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count FROM "Product" WHERE "isActive" = true AND stock <= "lowStockAlert"`;
  return Number(row?.count ?? 0);
}

/** Counts shown as badges in the admin sidebar. */
export async function sidebarCounts() {
  const [toShip, pendingReviews, newBookings, unreadMessages, openReturns] = await Promise.all([
    prisma.order.count({ where: toShipWhere }),
    prisma.review.count({ where: { isApproved: false } }),
    prisma.serviceBooking.count({ where: { status: "NEW" } }),
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.returnRequest.count({ where: { status: { in: ["REQUESTED", "APPROVED", "PICKED_UP"] } } }),
  ]);
  return { toShip, pendingReviews, newBookings, unreadMessages, openReturns };
}

export type SidebarCounts = Awaited<ReturnType<typeof sidebarCounts>>;
