import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { orderWithDetails } from "@/lib/orders";
import { orderTokenCookie, orderTokenCookieOptions } from "@/lib/order-token";

function tokenMatches(expected: string, given?: string | null) {
  if (!given) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Loads an order if the requester may see it: the signed-in owner, an admin,
 * or anyone holding the order's secret access token (guest checkout links & emails) —
 * passed explicitly or remembered in the order's token cookie (see proxy.ts).
 */
export async function getAccessibleOrder(orderNumber: string, token?: string | null) {
  const order = await prisma.order.findUnique({ where: { orderNumber }, include: orderWithDetails });
  if (!order) return null;
  if (tokenMatches(order.accessToken, token)) return order;
  if (tokenMatches(order.accessToken, (await cookies()).get(orderTokenCookie(order.orderNumber))?.value)) return order;
  const user = await getCurrentUser();
  if (user && (user.role === "ADMIN" || order.userId === user.id)) return order;
  return null;
}

/** Lets this browser open the order (and its invoice) without the token in the URL. */
export async function rememberOrderAccess(order: { orderNumber: string; accessToken: string }) {
  (await cookies()).set(orderTokenCookie(order.orderNumber), order.accessToken, orderTokenCookieOptions);
}

export type AccessibleOrder = NonNullable<Awaited<ReturnType<typeof getAccessibleOrder>>>;
