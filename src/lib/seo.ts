import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/utils";

type Crumb = { name: string; path: string };

const DEFAULT_OG_IMAGE = "/images/og-default.png";

export function pageMetadata(args: {
  title: string;
  description?: string | null;
  path: string;
  image?: string | null;
  type?: "website" | "article";
  noIndex?: boolean;
}): Metadata {
  const url = absoluteUrl(args.path);
  // A page's openGraph replaces the site-wide one entirely, so fall back to the default share image.
  const images = args.image
    ? [{ url: args.image.startsWith("http") ? args.image : absoluteUrl(args.image) }]
    : [{ url: absoluteUrl(DEFAULT_OG_IMAGE), width: 1200, height: 630 }];
  return {
    title: args.title,
    description: args.description ?? undefined,
    alternates: { canonical: url },
    openGraph: {
      title: args.title,
      description: args.description ?? undefined,
      url,
      type: args.type ?? "website",
      images,
      siteName: "Carsappo",
      locale: "en_IN",
    },
    twitter: { card: "summary_large_image", title: args.title, description: args.description ?? undefined },
    robots: args.noIndex ? { index: false, follow: false } : undefined,
  };
}

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: absoluteUrl(c.path) })),
  };
}

export function organizationJsonLd(args: { name: string; logo?: string; phone?: string; email?: string; sameAs: string[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: args.name,
    url: absoluteUrl("/"),
    logo: absoluteUrl(args.logo || "/icon.svg"),
    email: args.email || undefined,
    contactPoint: args.phone
      ? [{ "@type": "ContactPoint", telephone: args.phone, contactType: "customer service", areaServed: "IN", availableLanguage: ["en", "hi"] }]
      : undefined,
    sameAs: args.sameAs.filter(Boolean),
  };
}

export function websiteJsonLd(name: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url: absoluteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl("/shop")}?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function productJsonLd(p: {
  name: string;
  slug: string;
  sku: string;
  description: string;
  images: string[];
  price: number;
  mrp: number | null;
  stock: number;
  brand?: string | null;
  ratingAvg: number;
  ratingCount: number;
  reviews: { name: string; rating: number; body: string; createdAt: Date }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: p.sku,
    description: p.description,
    image: p.images.map((i) => (i.startsWith("http") ? i : absoluteUrl(i))),
    brand: { "@type": "Brand", name: p.brand || "Carsappo" },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/product/${p.slug}`),
      priceCurrency: "INR",
      price: (p.price / 100).toFixed(2),
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "Carsappo" },
    },
    aggregateRating:
      p.ratingCount > 0
        ? { "@type": "AggregateRating", ratingValue: p.ratingAvg.toFixed(1), reviewCount: p.ratingCount }
        : undefined,
    review: p.reviews.slice(0, 5).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.name },
      datePublished: r.createdAt.toISOString().slice(0, 10),
      reviewBody: r.body,
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
    })),
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  if (!faqs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };
}

export function articleJsonLd(post: {
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  author: string;
  publishedAt: Date | null;
  updatedAt: Date;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage ? (post.coverImage.startsWith("http") ? post.coverImage : absoluteUrl(post.coverImage)) : undefined,
    author: { "@type": "Organization", name: post.author },
    publisher: { "@type": "Organization", name: "Carsappo", logo: { "@type": "ImageObject", url: absoluteUrl("/icon.svg") } },
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
  };
}

export function localBusinessJsonLd(args: { name: string; phone?: string; areaServed: string; priceRange: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "AutoWash",
    name: args.name,
    url: absoluteUrl("/services"),
    telephone: args.phone || undefined,
    areaServed: { "@type": "City", name: args.areaServed },
    address: { "@type": "PostalAddress", addressLocality: "Greater Noida", addressRegion: "Uttar Pradesh", addressCountry: "IN" },
    priceRange: args.priceRange,
  };
}
