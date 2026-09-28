import type { Metadata } from "next";
import { parseShopFilters } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";
import { ShopView } from "@/components/shop/shop-view";

export async function generateMetadata({ searchParams }: PageProps<"/shop">): Promise<Metadata> {
  const sp = await searchParams;
  const f = parseShopFilters(sp);
  const filtered = Object.keys(sp).length > 0;
  return pageMetadata({
    title: f.q ? `Search: ${f.q}` : "Shop Car Accessories & Car Care Products Online",
    description: "Shop premium car accessories online in India — 7D mats, seat covers, car care, perfumes, vacuum cleaners and more. Free shipping over ₹999.",
    path: "/shop",
    // Filtered and search result pages are not indexed to avoid duplicate content.
    noIndex: filtered,
  });
}

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const filters = parseShopFilters(await searchParams);
  return <ShopView filters={filters} basePath="/shop" />;
}
