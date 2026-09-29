import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { orderTokenCookie, orderTokenCookieOptions } from "@/lib/order-token";

const ORDER_LINK = /^\/(?:order|invoice)\/([A-Za-z0-9-]{1,20})$/;

/**
 * - Order/invoice links: swap the `?t=` access token for a cookie and redirect to the clean URL.
 * - Optimistic auth redirects for private areas. Real authorisation happens in the
 *   /account and /admin layouts and inside every server action.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const orderLink = ORDER_LINK.exec(pathname);
  if (orderLink) {
    const token = request.nextUrl.searchParams.get("t");
    if (!token) return NextResponse.next();
    const clean = request.nextUrl.clone();
    clean.searchParams.delete("t");
    const res = NextResponse.redirect(clean);
    res.cookies.set(orderTokenCookie(orderLink[1]), token.slice(0, 64), orderTokenCookieOptions);
    return res;
  }

  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/admin") && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/order/:path*", "/invoice/:path*"],
};
