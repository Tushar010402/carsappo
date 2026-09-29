import type { NextConfig } from "next";

const s3Host = process.env.NEXT_PUBLIC_S3_PUBLIC_HOST;

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=(self \"https://checkout.razorpay.com\")" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Staging / client-preview deployments must never be indexed (see also robots.ts).
  ...(process.env.SITE_ENV === "staging" ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] : []),
];

const nextConfig: NextConfig = {
  // Separate build folder for end-to-end test runs (see tests/e2e/prepare.ts).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  // Always render <title>/<meta> in <head> (no metadata streaming) so every crawler and
  // link-preview bot sees product SEO tags without executing JavaScript.
  htmlLimitedBots: /.*/,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "**.cdninstagram.com" },
      ...(s3Host ? [{ protocol: "https" as const, hostname: s3Host }] : []),
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      { source: "/products/:slug", destination: "/product/:slug", permanent: true },
      { source: "/categories/:slug", destination: "/category/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
