import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { BlogIndex } from "@/components/blog/blog-index";

export const metadata: Metadata = pageMetadata({
  title: "Car Care Tips, Buying Guides & Maintenance Advice",
  description: "Car care tips, accessory buying guides, product comparisons and maintenance advice from the Carsappo team.",
  path: "/blog",
});

export default function BlogPage() {
  return <BlogIndex title="Car care, made simple." description="Tips, buying guides, comparisons and maintenance advice from the Carsappo garage." />;
}
