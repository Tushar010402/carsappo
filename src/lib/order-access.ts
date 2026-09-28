import "server-only";
import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { orderWithDetails } from "@/lib/orders";

function tokenMatches(expected: string, given?: string | null) {
  if (!given) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Loads an order if the requester may see it: the signed-in owner, an admin,
 * or anyone holding the order's secret access token (guest checkout links & emails).
 */
export async function getAccessibleOrder(orderNumber: string, token?: string | null) {
  const order = await prisma.order.findUnique({ where: { orderNumber }, include: orderWithDetails });
  if (!order) return null;
  if (tokenMatches(order.accessToken, token)) return order;
  const user = await getCurrentUser();
  if (user && (user.role === "ADMIN" || order.userId === user.id)) return order;
  return null;
}

export type AccessibleOrder = NonNullable<Awaited<ReturnType<typeof getAccessibleOrder>>>;
