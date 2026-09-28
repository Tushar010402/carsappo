import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Copy, ExternalLink, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { productFormOptions, productFormValues } from "@/lib/admin/products";
import { deleteProduct, duplicateProduct } from "@/app/admin/_actions/products";
import { PageHeader } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-button";
import { ActiveBadge } from "@/components/admin/status-badge";
import { ProductForm } from "@/components/admin/products/product-form";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const [product, options] = await Promise.all([productFormValues(id), productFormOptions()]);
  if (!product) notFound();

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <span className="truncate">{product.name}</span> <ActiveBadge active={product.isActive} />
          </span>
        }
        description={
          <>
            SKU {product.sku} · {product.orderCount} order line{product.orderCount === 1 ? "" : "s"}
          </>
        }
        back={{ href: "/admin/products", label: "Products" }}
        actions={
          <>
            <a href={`/product/${product.slug}`} target="_blank" rel="noopener noreferrer" className={buttonClasses("outline", "sm")}>
              <ExternalLink className="size-4" /> View
            </a>
            <ActionButton action={duplicateProduct.bind(null, product.id)} variant="outline">
              <Copy className="size-4" /> Duplicate
            </ActionButton>
            <ActionButton
              action={deleteProduct.bind(null, product.id)}
              variant="outline"
              className="text-red-600"
              confirm={
                product.orderCount > 0
                  ? "This product has orders, so it will be hidden (not deleted) to keep order history. Continue?"
                  : "Delete this product permanently? This cannot be undone."
              }
            >
              <Trash2 className="size-4" /> {product.orderCount > 0 ? "Hide" : "Delete"}
            </ActionButton>
          </>
        }
      />
      <ProductForm key={product.id} initial={product} {...options} />
    </>
  );
}
