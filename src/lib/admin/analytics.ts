import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { REVENUE_SQL, revenueWhere } from "@/lib/admin/metrics";
import { istDayStart, istToday } from "@/lib/admin/query";

const DAY = 24 * 60 * 60 * 1000;

export const RANGES = [7, 30, 90] as const;
export type RangeDays = (typeof RANGES)[number];

/** [start, end) of the last `days` IST calendar days including today, plus the previous period of equal length. */
export function periodFor(days: number) {
  const today = istToday();
  const end = new Date(istDayStart(today).getTime() + DAY);
  const start = new Date(end.getTime() - days * DAY);
  const prevStart = new Date(start.getTime() - days * DAY);
  return { start, end, prevStart };
}

const istDay = Prisma.sql`to_char((o."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD')`;

export async function revenueByDay(start: Date, end: Date) {
  const rows = await prisma.$queryRaw<{ day: string; revenue: bigint; orders: number }[]>`
    SELECT ${istDay} AS day, COALESCE(SUM(o.total), 0)::bigint AS revenue, COUNT(*)::int AS orders
    FROM "Order" o
    WHERE o."createdAt" >= ${start} AND o."createdAt" < ${end} AND ${REVENUE_SQL}
    GROUP BY 1 ORDER BY 1`;
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const out: { day: string; revenue: number; orders: number }[] = [];
  for (let t = start.getTime(); t < end.getTime(); t += DAY) {
    const day = istToday(new Date(t));
    const r = byDay.get(day);
    out.push({ day, revenue: Number(r?.revenue ?? 0), orders: r?.orders ?? 0 });
  }
  return out;
}

export async function revenueSummary(start: Date, end: Date) {
  const agg = await prisma.order.aggregate({
    where: { ...revenueWhere, createdAt: { gte: start, lt: end } },
    _sum: { total: true, discount: true },
    _count: { _all: true },
  });
  const revenue = agg._sum.total ?? 0;
  const orders = agg._count._all;
  return { revenue, orders, aov: orders ? Math.round(revenue / orders) : 0, discount: agg._sum.discount ?? 0 };
}

export async function analytics(days: RangeDays) {
  const { start, end, prevStart } = periodFor(days);
  const created = { gte: start, lt: end };

  const [daily, current, previous, byStatus, byMethod, topProducts, byCategory, newCustomers, prevCustomers, coupons, allOrders] = await Promise.all([
    revenueByDay(start, end),
    revenueSummary(start, end),
    revenueSummary(prevStart, start),
    prisma.order.groupBy({ by: ["status"], where: { createdAt: created }, _count: { _all: true }, _sum: { total: true } }),
    prisma.order.groupBy({ by: ["paymentMethod"], where: { ...revenueWhere, createdAt: created }, _count: { _all: true }, _sum: { total: true } }),
    prisma.$queryRaw<{ productId: string | null; name: string; revenue: bigint; units: bigint }[]>`
      SELECT oi."productId", MAX(oi.name) AS name, SUM(oi.price * oi.quantity)::bigint AS revenue, SUM(oi.quantity)::bigint AS units
      FROM "OrderItem" oi JOIN "Order" o ON o.id = oi."orderId"
      WHERE o."createdAt" >= ${start} AND o."createdAt" < ${end} AND ${REVENUE_SQL}
      GROUP BY oi."productId", CASE WHEN oi."productId" IS NULL THEN oi.name END
      ORDER BY revenue DESC LIMIT 10`,
    prisma.$queryRaw<{ name: string; revenue: bigint; units: bigint }[]>`
      SELECT COALESCE(c.name, 'Deleted products') AS name, SUM(oi.price * oi.quantity)::bigint AS revenue, SUM(oi.quantity)::bigint AS units
      FROM "OrderItem" oi
      JOIN "Order" o ON o.id = oi."orderId"
      LEFT JOIN "Product" p ON p.id = oi."productId"
      LEFT JOIN "Category" c ON c.id = p."categoryId"
      WHERE o."createdAt" >= ${start} AND o."createdAt" < ${end} AND ${REVENUE_SQL}
      GROUP BY 1 ORDER BY revenue DESC`,
    prisma.user.count({ where: { role: "CUSTOMER", createdAt: created } }),
    prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: prevStart, lt: start } } }),
    prisma.$queryRaw<{ code: string; uses: number; discount: bigint; revenue: bigint }[]>`
      SELECT c.code, COUNT(*)::int AS uses, COALESCE(SUM(o.discount), 0)::bigint AS discount, COALESCE(SUM(o.total), 0)::bigint AS revenue
      FROM "CouponUsage" cu JOIN "Coupon" c ON c.id = cu."couponId" JOIN "Order" o ON o.id = cu."orderId"
      WHERE cu."createdAt" >= ${start} AND cu."createdAt" < ${end}
      GROUP BY c.code ORDER BY uses DESC LIMIT 10`,
    prisma.order.count({ where: { createdAt: created } }),
  ]);

  return {
    days,
    start,
    end,
    daily,
    current,
    previous,
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count._all, total: s._sum.total ?? 0 })).sort((a, b) => b.count - a.count),
    byMethod: byMethod.map((m) => ({ method: m.paymentMethod, count: m._count._all, total: m._sum.total ?? 0 })),
    topProducts: topProducts.map((p) => ({ productId: p.productId, name: p.name, revenue: Number(p.revenue), units: Number(p.units) })),
    byCategory: byCategory.map((c) => ({ name: c.name, revenue: Number(c.revenue), units: Number(c.units) })),
    newCustomers,
    prevCustomers,
    coupons: coupons.map((c) => ({ code: c.code, uses: c.uses, discount: Number(c.discount), revenue: Number(c.revenue) })),
    allOrders,
  };
}
