import Link from "next/link";
import { SmartImage } from "@/components/ui/smart-image";
import { Price } from "@/components/ui/price";
import { Stars } from "@/components/ui/stars";
import { WishlistButton } from "@/components/product/wishlist-button";
import { QuickAddButton } from "@/components/product/add-to-cart";
import type { ProductCardData } from "@/lib/catalog";
import { cn, isRecent } from "@/lib/utils";

export function ProductCard({ product, className, priority }: { product: ProductCardData; className?: string; priority?: boolean }) {
  const [img1, img2] = product.images;
  const isNew = isRecent(product.createdAt);
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden rounded-[var(--radius-card)] bg-mist">
        {img1 && (
          <SmartImage
            src={img1.url}
            alt={img1.alt || product.name}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 50vw"
            className={cn("object-cover transition duration-500", img2 && "group-hover:opacity-0")}
          />
        )}
        {img2 && (
          <SmartImage
            src={img2.url}
            alt=""
            fill
            sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 50vw"
            className="scale-105 object-cover opacity-0 transition duration-500 group-hover:scale-100 group-hover:opacity-100"
          />
        )}
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          {product.discountPercent > 0 && (
            <span className="rounded-full bg-brand px-2.5 py-1 text-[11px] font-bold text-ink">-{product.discountPercent}%</span>
          )}
          {product.isBestSeller && <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-white">Best seller</span>}
          {!product.isBestSeller && isNew && <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-ink">New</span>}
        </div>
        {product.stock <= 0 && (
          <span className="absolute inset-x-3 bottom-3 rounded-full bg-white/90 py-1.5 text-center text-xs font-semibold backdrop-blur">Out of stock</span>
        )}
      </Link>
      <WishlistButton productId={product.id} name={product.name} price={product.price} className="absolute top-3 right-3" />

      <div className="flex flex-1 flex-col pt-3.5">
        <p className="text-[11px] font-semibold tracking-wider text-muted uppercase">{product.brand?.name ?? product.category.name}</p>
        <Link href={`/product/${product.slug}`} className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 font-medium hover:underline">
          {product.name}
        </Link>
        <div className="mt-1.5 flex h-4 items-center gap-1.5">
          {product.ratingCount > 0 && (
            <>
              <Stars rating={product.ratingAvg} size={12} />
              <span className="text-[11px] text-muted">({product.ratingCount})</span>
            </>
          )}
        </div>
        <Price price={product.price} mrp={product.mrp} size="md" className="mt-2" />
        {lowStock && <p className="mt-1 text-[11px] font-medium text-amber-700">Only {product.stock} left</p>}
        <div className="mt-auto pt-3">
          <QuickAddButton
            product={{
              productId: product.id,
              slug: product.slug,
              name: product.name,
              image: img1?.url ?? null,
              price: product.price,
              mrp: product.mrp,
              sku: product.sku,
              stock: product.stock,
            }}
          />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, className }: { products: ProductCardData[]; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4", className)}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} />
      ))}
    </div>
  );
}
