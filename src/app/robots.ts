import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  // Staging / client-preview deployments stay out of search engines entirely.
  if (process.env.SITE_ENV === "staging") return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/account", "/api/", "/cart", "/checkout", "/order/", "/invoice/", "/login", "/register", "/wishlist", "/*?*sort=", "/*?*page="],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
