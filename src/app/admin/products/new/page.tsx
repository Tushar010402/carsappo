import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { EMPTY_PRODUCT, productFormOptions } from "@/lib/admin/products";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/products/product-form";

export const metadata: Metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireAdmin();
  const options = await productFormOptions();
  return (
    <>
      <PageHeader title="New product" description="Add a product to the catalogue." back={{ href: "/admin/products", label: "Products" }} />
      <ProductForm initial={EMPTY_PRODUCT} {...options} />
    </>
  );
}
