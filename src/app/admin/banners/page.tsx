import type { Metadata } from "next";
import type { Banner, BannerPlacement } from "@prisma/client";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteBanner, saveBanner, setBannerActive } from "@/app/admin/_actions/banners";
import { PageHeader, Panel, Toggle } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-button";
import { FormDialog } from "@/components/admin/dialog";
import { AdminForm, FormError, FormField, FormSubmit } from "@/components/admin/form";
import { MediaInput } from "@/components/admin/media-input";
import { AdminImage } from "@/components/admin/admin-image";
import { isPreviewableUrl } from "@/components/admin/upload";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Banners" };

const PLACEMENTS: { value: BannerPlacement; label: string; help: string }[] = [
  { value: "HOME_HERO", label: "Homepage hero", help: "The first active hero banner replaces the default homepage hero (image as full-bleed background)." },
  { value: "HOME_PROMO", label: "Homepage promo strip", help: "The first active promo banner is shown as the offer strip on the homepage." },
  { value: "SHOP_TOP", label: "Shop page top", help: "Shown above the product grid on the shop page." },
];

function BannerForm({ banner, placement = "HOME_HERO" }: { banner?: Banner; placement?: BannerPlacement }) {
  return (
    <AdminForm action={saveBanner} className="space-y-4">
      {banner && <input type="hidden" name="id" value={banner.id} />}
      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <FormField name="placement" label="Placement">
          <select id="placement" name="placement" className="field" defaultValue={banner?.placement ?? placement}>
            {PLACEMENTS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField name="sortOrder" label="Sort order">
          <input id="sortOrder" name="sortOrder" type="number" className="field" defaultValue={banner?.sortOrder ?? 0} required />
        </FormField>
      </div>
      <FormField name="eyebrow" label="Eyebrow" hint="Small line above the title (optional).">
        <input id="eyebrow" name="eyebrow" className="field" defaultValue={banner?.eyebrow ?? ""} maxLength={80} placeholder="Festive sale · Limited time" />
      </FormField>
      <FormField name="title" label="Title">
        <input id="title" name="title" className="field" defaultValue={banner?.title ?? ""} required maxLength={160} placeholder="Everything Your Car Needs." />
      </FormField>
      <FormField name="subtitle" label="Subtitle">
        <textarea id="subtitle" name="subtitle" className="field min-h-20" defaultValue={banner?.subtitle ?? ""} maxLength={300} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField name="image" label="Image (desktop)" hint="Wide, at least 1920×900.">
          <MediaInput name="image" defaultValue={banner?.image} folder="banners" aspect="wide" />
        </FormField>
        <FormField name="mobileImage" label="Image (mobile)" hint="Optional portrait crop.">
          <MediaInput name="mobileImage" defaultValue={banner?.mobileImage} folder="banners" />
        </FormField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField name="ctaLabel" label="Button label">
          <input id="ctaLabel" name="ctaLabel" className="field" defaultValue={banner?.ctaLabel ?? ""} maxLength={40} placeholder="Shop Accessories" />
        </FormField>
        <FormField name="ctaHref" label="Button link">
          <input id="ctaHref" name="ctaHref" className="field" defaultValue={banner?.ctaHref ?? ""} placeholder="/shop" />
        </FormField>
        <FormField name="secondaryCtaLabel" label="Secondary label">
          <input id="secondaryCtaLabel" name="secondaryCtaLabel" className="field" defaultValue={banner?.secondaryCtaLabel ?? ""} maxLength={40} placeholder="Explore Services" />
        </FormField>
        <FormField name="secondaryCtaHref" label="Secondary link">
          <input id="secondaryCtaHref" name="secondaryCtaHref" className="field" defaultValue={banner?.secondaryCtaHref ?? ""} placeholder="/services" />
        </FormField>
      </div>
      <Toggle name="isActive" label="Active" defaultChecked={banner?.isActive ?? true} />
      <FormError />
      <div className="flex justify-end">
        <FormSubmit>{banner ? "Save banner" : "Create banner"}</FormSubmit>
      </div>
    </AdminForm>
  );
}

export default async function BannersPage() {
  await requireAdmin();
  const banners = await prisma.banner.findMany({ orderBy: [{ placement: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }] });

  return (
    <>
      <PageHeader
        title="Banners"
        description="Homepage hero, promo strip and shop banners."
        actions={
          <FormDialog trigger={<><Plus className="size-4" /> New banner</>} triggerVariant="primary" title="New banner" size="lg">
            <BannerForm />
          </FormDialog>
        }
      />
      <div className="space-y-6">
        {PLACEMENTS.map((p) => {
          const list = banners.filter((b) => b.placement === p.value);
          const liveId = list.find((b) => b.isActive)?.id;
          return (
            <Panel
              key={p.value}
              title={p.label}
              description={p.help}
              flush
              actions={
                <FormDialog trigger={<><Plus className="size-4" /> Add</>} title={`New ${p.label.toLowerCase()} banner`} size="lg">
                  <BannerForm placement={p.value} />
                </FormDialog>
              }
            >
              {list.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted">
                  {p.value === "SHOP_TOP" ? "No banner — nothing is shown above the shop grid." : "No banners — the storefront shows its built-in default here."}
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {list.map((b) => (
                    <li key={b.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center">
                      <div className="relative aspect-[16/7] w-full shrink-0 overflow-hidden rounded-xl bg-ink sm:w-56">
                        {b.image && isPreviewableUrl(b.image) && <AdminImage src={b.image} alt="" fill sizes="224px" className="object-cover opacity-80" />}
                        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-3 text-white">
                          {b.eyebrow && <span className="text-[9px] font-semibold tracking-widest text-brand uppercase">{b.eyebrow}</span>}
                          <span className="line-clamp-2 font-display text-sm font-semibold leading-tight">{b.title}</span>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{b.title}</span>
                          {b.id === liveId ? <Badge tone="success">Live</Badge> : b.isActive ? <Badge tone="soft">Active (queued)</Badge> : <Badge tone="soft">Inactive</Badge>}
                        </div>
                        {b.subtitle && <p className="mt-1 line-clamp-2 text-sm text-muted">{b.subtitle}</p>}
                        <p className="mt-1 text-xs text-muted">
                          {b.ctaLabel ? `${b.ctaLabel} → ${b.ctaHref ?? "—"}` : "No button"}
                          {b.secondaryCtaLabel ? ` · ${b.secondaryCtaLabel} → ${b.secondaryCtaHref ?? "—"}` : ""} · sort {b.sortOrder}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-0.5">
                        <ActionButton action={setBannerActive.bind(null, b.id, !b.isActive)} variant="icon" label={b.isActive ? "Deactivate" : "Activate"}>
                          {b.isActive ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </ActionButton>
                        <FormDialog trigger={<Pencil className="size-4" />} triggerVariant="icon" triggerLabel="Edit banner" title="Edit banner" size="lg">
                          <BannerForm banner={b} />
                        </FormDialog>
                        <ActionButton action={deleteBanner.bind(null, b.id)} variant="icon-danger" label="Delete banner" confirm="Delete this banner?">
                          <Trash2 className="size-4" />
                        </ActionButton>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          );
        })}
      </div>
    </>
  );
}
