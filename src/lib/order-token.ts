/**
 * Guest order links carry a secret token (`/order/CS100123?t=…`). The proxy moves it into this
 * httpOnly cookie and redirects to the clean URL, so the token never sits in the address bar,
 * browser history or analytics page views (GA4 / Meta Pixel record the full URL).
 */
export const orderTokenCookie = (orderNumber: string) => `ot_${orderNumber.toUpperCase()}`;

export const orderTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 180,
} as const;
