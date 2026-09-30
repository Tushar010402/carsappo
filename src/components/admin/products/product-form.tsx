"use client";

import { useState, type ReactNode } from "react";
import { Save } from "lucide-react";
import { AdminForm, FormActions, FormError, FormField, FormSubmit } from "@/components/admin/form";
import { ListEditor, RowsEditor, TagsInput } from "@/components/admin/list-editor";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { SlugFields } from "@/components/admin/slug-fields";
import { MoneyInput, Toggle } from "@/components/admin/ui";
import { ImagesEditor, type ImageRow } from "@/components/admin/products/images-editor";
import { CompatEditor, type CompatRow, type VehicleMakeOption } from "@/components/admin/products/compat-editor";
import { ProductPicker, type PickedProduct } from "@/components/admin/products/product-picker";
import { saveProduct } from "@/app/admin/_actions/products";
import { discountPercent, formatINR, paiseToRupees, rupeesToPaise } from "@/lib/format";

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  price: number | null;
  mrp: number | null;
  gstRate: number;
  hsnCode: string;
  stock: number;
  lowStockAlert: number;
  weightGrams: number;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  categoryId: string;
  brandId: string;
  videoUrl: string;
  features: string[];
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isTrending: boolean;
  isPremium: boolean;
  isUniversal: boolean;
  metaTitle: string;
  metaDescription: string;
  images: ImageRow[];
  specs: { label: string; value: string }[];
  faqs: { question: string; answer: string }[];
  compat: CompatRow[];
  boughtTogether: PickedProduct[];
};

function Section({ title, description, children, aside }: { title: string; description?: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-paper">
      <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
        <div>
          <h2 className="font-display text-[15px] font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
        </div>
        {aside}
      </header>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}

function CharCount({ value, max }: { value: string; max: number }) {
  return (
    <span className={value.length > max ? "text-red-600" : ""}>
      {value.length}/{max}
    </span>
  );
}

export function ProductForm({
  initial,
  categories,
  brands,
  makes,
}: {
  initial: ProductFormValues;
  categories: { id: string; name: string; parentName: string | null }[];
  brands: { id: string; name: string }[];
  makes: VehicleMakeOption[];
}) {
  const [universal, setUniversal] = useState(initial.isUniversal);
  const [price, setPrice] = useState(initial.price !== null ? String(paiseToRupees(initial.price)) : "");
  const [mrp, setMrp] = useState(initial.mrp !== null ? String(paiseToRupees(initial.mrp)) : "");
  const [metaTitle, setMetaTitle] = useState(initial.metaTitle);
  const [metaDescription, setMetaDescription] = useState(initial.metaDescription);

  const pricePaise = price ? rupeesToPaise(price) : 0;
  const mrpPaise = mrp ? rupeesToPaise(mrp) : 0;
  const off = discountPercent(pricePaise, mrpPaise || null);

  return (
    <AdminForm action={saveProduct} className="space-y-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Main column */}
        <div className="min-w-0 space-y-6">
          <Section title="Basic information">
            <SlugFields defaultName={initial.name} defaultSlug={initial.slug} prefix="/product/" namePlaceholder="e.g. 7D Premium Car Mats" />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField name="sku" label="SKU" hint="Unique stock-keeping code, e.g. CS-MAT-7D-BLK">
                <input id="sku" name="sku" className="field font-mono text-[13px] uppercase" defaultValue={initial.sku} required maxLength={60} />
              </FormField>
              <FormField name="videoUrl" label="Product video URL" hint="YouTube link or uploaded MP4 URL (optional)">
                <input id="videoUrl" name="videoUrl" className="field" defaultValue={initial.videoUrl} placeholder="https://youtu.be/…" />
              </FormField>
            </div>
            <FormField name="shortDescription" label="Short description" hint="One or two lines shown near the price and in search results">
              <textarea id="shortDescription" name="shortDescription" className="field min-h-20" defaultValue={initial.shortDescription} maxLength={300} />
            </FormField>
            <FormField name="description" label="Description">
              <MarkdownEditor name="description" defaultValue={initial.description} />
            </FormField>
          </Section>

          <Section title="Images" description="Upload product photos or paste URLs. Drag order with the arrows; the first image is the cover.">
            <FormField name="images">
              <ImagesEditor name="images" defaultValue={initial.images} />
            </FormField>
          </Section>

          <Section title="Key features" description="Short bullet points shown on the product page.">
            <FormField name="features">
              <ListEditor name="features" defaultValue={initial.features} placeholder="e.g. Custom laser-measured fit" addLabel="Add feature" />
            </FormField>
          </Section>

          <Section title="Specifications">
            <FormField name="specs">
              <RowsEditor
                name="specs"
                defaultValue={initial.specs}
                addLabel="Add specification"
                fields={[
                  { key: "label", label: "Label", placeholder: "Material" },
                  { key: "value", label: "Value", placeholder: "Premium PU leather" },
                ]}
              />
            </FormField>
          </Section>

          <Section title="Product FAQs">
            <FormField name="faqs">
              <RowsEditor
                name="faqs"
                defaultValue={initial.faqs}
                addLabel="Add FAQ"
                fields={[
                  { key: "question", label: "Question", placeholder: "Will this fit my car?" },
                  { key: "answer", label: "Answer", placeholder: "Yes — select your vehicle to check fitment…", multiline: true },
                ]}
              />
            </FormField>
          </Section>

          <Section
            title="Vehicle compatibility"
            description={universal ? "This product is marked universal — it fits every vehicle, so no models are needed." : "Models this product fits. Powers Shop by Vehicle and the fit checker."}
          >
            {universal ? (
              <p className="rounded-xl bg-brand-soft px-4 py-3 text-sm">
                Universal fit is on. Turn it off under <b>Visibility</b> to choose specific makes and models. Existing rows are removed when saved as universal.
              </p>
            ) : (
              <FormField name="compat">
                <CompatEditor name="compat" makes={makes} defaultValue={initial.compat} />
              </FormField>
            )}
            {universal && <input type="hidden" name="compat" value="[]" />}
          </Section>

          <Section title="Frequently bought together">
            <FormField name="boughtTogether">
              <ProductPicker name="boughtTogether" defaultValue={initial.boughtTogether} excludeId={initial.id} />
            </FormField>
          </Section>

          <Section title="Search engine listing" description="Leave empty to use the product name and short description.">
            <FormField name="metaTitle" label="Meta title" hint={<CharCount value={metaTitle} max={60} />}>
              <input id="metaTitle" name="metaTitle" className="field" value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} maxLength={120} />
            </FormField>
            <FormField name="metaDescription" label="Meta description" hint={<CharCount value={metaDescription} max={160} />}>
              <textarea id="metaDescription" name="metaDescription" className="field min-h-20" value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} maxLength={320} />
            </FormField>
          </Section>
        </div>

        {/* Sidebar column */}
        <div className="space-y-6">
          <Section title="Visibility">
            <Toggle name="isActive" label="Active" description="Visible and purchasable in the store" defaultChecked={initial.isActive} />
            <Toggle name="isUniversal" label="Universal fit" description="Fits all vehicles (perfumes, cloths…)" checked={universal} onChange={(e) => setUniversal(e.target.checked)} />
            <div className="border-t border-line pt-4">
              <p className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">Collections</p>
              <div className="space-y-3">
                <Toggle name="isFeatured" label="Featured" defaultChecked={initial.isFeatured} />
                <Toggle name="isBestSeller" label="Best seller" defaultChecked={initial.isBestSeller} />
                <Toggle name="isTrending" label="Trending" defaultChecked={initial.isTrending} />
                <Toggle name="isPremium" label="Premium" defaultChecked={initial.isPremium} />
              </div>
            </div>
          </Section>

          <Section title="Pricing" description="Prices include GST.">
            <div className="grid grid-cols-2 gap-3">
              <FormField name="price" label="Selling price">
                <MoneyInput id="price" name="price" value={price} onChange={(e) => setPrice(e.target.value)} required min={1} />
              </FormField>
              <FormField name="mrp" label="MRP">
                <MoneyInput id="mrp" name="mrp" value={mrp} onChange={(e) => setMrp(e.target.value)} placeholder="Optional" />
              </FormField>
            </div>
            <p className="rounded-xl bg-mist px-3 py-2 text-xs text-muted">
              {off > 0 ? (
                <>
                  Customers save <b className="text-success">{formatINR(mrpPaise - pricePaise)}</b> ({off}% off MRP).
                </>
              ) : mrpPaise && mrpPaise < pricePaise ? (
                <span className="text-red-600">MRP is lower than the selling price.</span>
              ) : (
                "No discount shown (MRP empty or equal to price)."
              )}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <FormField name="gstRate" label="GST rate">
                <select id="gstRate" name="gstRate" className="field" defaultValue={String(initial.gstRate)}>
                  {[0, 5, 12, 18, 28].map((r) => (
                    <option key={r} value={r}>
                      {r}%
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField name="hsnCode" label="HSN code">
                <input id="hsnCode" name="hsnCode" className="field font-mono text-[13px]" defaultValue={initial.hsnCode} inputMode="numeric" placeholder="8708" />
              </FormField>
            </div>
          </Section>

          <Section title="Inventory & shipping">
            <div className="grid grid-cols-2 gap-3">
              <FormField name="stock" label="Stock">
                <input id="stock" name="stock" type="number" min={0} className="field tabular-nums" defaultValue={initial.stock} required />
              </FormField>
              <FormField name="lowStockAlert" label="Low-stock alert">
                <input id="lowStockAlert" name="lowStockAlert" type="number" min={0} className="field tabular-nums" defaultValue={initial.lowStockAlert} required />
              </FormField>
            </div>
            <FormField name="weightGrams" label="Package weight (grams)">
              <input id="weightGrams" name="weightGrams" type="number" min={1} className="field tabular-nums" defaultValue={initial.weightGrams} required />
            </FormField>
            <div>
              <p className="label">Package size (cm)</p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["lengthCm", "Length", initial.lengthCm],
                    ["breadthCm", "Breadth", initial.breadthCm],
                    ["heightCm", "Height", initial.heightCm],
                  ] as const
                ).map(([key, label, value]) => (
                  <FormField key={key} name={key}>
                    <input name={key} type="number" min={1} className="field tabular-nums" defaultValue={value} aria-label={label} placeholder={label} required />
                    <span className="mt-1 block text-center text-[11px] text-muted">{label}</span>
                  </FormField>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Organisation">
            <FormField name="categoryId" label="Category">
              <select id="categoryId" name="categoryId" className="field" defaultValue={initial.categoryId} required>
                <option value="">Select a category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.parentName ? `${c.parentName} › ` : ""}
                    {c.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField name="brandId" label="Brand">
              <select id="brandId" name="brandId" className="field" defaultValue={initial.brandId}>
                <option value="">No brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField name="tags" label="Tags" hint="Used by search. Press Enter after each tag.">
              <TagsInput name="tags" defaultValue={initial.tags} />
            </FormField>
          </Section>
        </div>
      </div>

      <FormError />
      <FormActions sticky>
        <p className="mr-auto hidden text-xs text-muted sm:block">{initial.id ? "Changes go live as soon as you save." : "New products are created with the visibility set above."}</p>
        <FormSubmit>
          <Save className="size-4" /> {initial.id ? "Save product" : "Create product"}
        </FormSubmit>
      </FormActions>
    </AdminForm>
  );
}
