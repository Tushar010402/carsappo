import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { saveSeoSettings, saveTrackingSettings } from "@/app/admin/_actions/settings";
import { Callout, PageHeader, Panel } from "@/components/admin/ui";
import { AdminForm, FormError, FormField, FormSubmit } from "@/components/admin/form";
import { MediaInput } from "@/components/admin/media-input";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "SEO & tracking" };

function Status({ on }: { on: boolean }) {
  return on ? <Badge tone="success">Active</Badge> : <Badge tone="soft">Off</Badge>;
}

export default async function SeoPage() {
  await requireAdmin();
  const { seo, tracking } = await getSettings();

  return (
    <>
      <PageHeader title="SEO & tracking" description="Default search metadata and analytics / ads tags for the storefront." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Search engine defaults" description="Used when a page has no specific title or description.">
          <AdminForm action={saveSeoSettings} className="space-y-4">
            <FormField name="defaultTitle" label="Homepage / default title" hint="50–60 characters is ideal.">
              <input id="defaultTitle" name="defaultTitle" className="field" defaultValue={seo.defaultTitle} required maxLength={120} />
            </FormField>
            <FormField name="titleTemplate" label="Title template" hint="%s is replaced by the page title, e.g. “%s | Carsappo”.">
              <input id="titleTemplate" name="titleTemplate" className="field font-mono text-[13px]" defaultValue={seo.titleTemplate} required maxLength={80} />
            </FormField>
            <FormField name="defaultDescription" label="Default meta description" hint="Around 150–160 characters.">
              <textarea id="defaultDescription" name="defaultDescription" className="field min-h-24" defaultValue={seo.defaultDescription} required maxLength={320} />
            </FormField>
            <FormField name="keywords" label="Keywords" hint="Comma separated.">
              <textarea id="keywords" name="keywords" className="field min-h-20" defaultValue={seo.keywords} maxLength={500} />
            </FormField>
            <FormField name="ogImage" label="Default social share image" hint="1200×630 JPG/PNG shown when links are shared on WhatsApp, Facebook, X.">
              <MediaInput name="ogImage" defaultValue={seo.ogImage} folder="seo" aspect="wide" />
            </FormField>
            <FormField name="googleSiteVerification" label="Google Search Console verification" hint="Only the content=&quot;…&quot; value of the HTML tag method.">
              <input id="googleSiteVerification" name="googleSiteVerification" className="field font-mono text-[13px]" defaultValue={seo.googleSiteVerification} maxLength={100} />
            </FormField>
            <FormError />
            <div className="flex justify-end">
              <FormSubmit>Save SEO settings</FormSubmit>
            </div>
          </AdminForm>
        </Panel>

        <div className="space-y-6">
          <Panel title="Analytics & ads" description="Tags load on every storefront page. Leave a field empty to disable it.">
            <AdminForm action={saveTrackingSettings} className="space-y-4">
              <FormField name="ga4Id" label={<span className="flex items-center gap-2">Google Analytics 4 · Measurement ID <Status on={!!tracking.ga4Id} /></span>}>
                <input id="ga4Id" name="ga4Id" className="field font-mono text-[13px] uppercase" defaultValue={tracking.ga4Id} placeholder="G-XXXXXXXXXX" maxLength={30} />
              </FormField>
              <FormField name="gtmId" label={<span className="flex items-center gap-2">Google Tag Manager · Container ID <Status on={!!tracking.gtmId} /></span>}>
                <input id="gtmId" name="gtmId" className="field font-mono text-[13px] uppercase" defaultValue={tracking.gtmId} placeholder="GTM-XXXXXXX" maxLength={30} />
              </FormField>
              <FormField name="metaPixelId" label={<span className="flex items-center gap-2">Meta (Facebook) Pixel ID <Status on={!!tracking.metaPixelId} /></span>}>
                <input id="metaPixelId" name="metaPixelId" className="field font-mono text-[13px]" inputMode="numeric" defaultValue={tracking.metaPixelId} placeholder="123456789012345" maxLength={20} />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField name="googleAdsId" label={<span className="flex items-center gap-2">Google Ads ID <Status on={!!tracking.googleAdsId} /></span>}>
                  <input id="googleAdsId" name="googleAdsId" className="field font-mono text-[13px] uppercase" defaultValue={tracking.googleAdsId} placeholder="AW-123456789" maxLength={30} />
                </FormField>
                <FormField name="googleAdsPurchaseLabel" label="Purchase conversion label">
                  <input id="googleAdsPurchaseLabel" name="googleAdsPurchaseLabel" className="field font-mono text-[13px]" defaultValue={tracking.googleAdsPurchaseLabel} placeholder="AbC-D_efG123" maxLength={60} />
                </FormField>
              </div>
              <p className="text-xs text-muted">
                Purchase events (value, currency INR, items) are sent to GA4, Meta Pixel and Google Ads on the order confirmation page. If you use GTM, avoid adding the same GA4 tag inside GTM
                as well, or page views will be counted twice.
              </p>
              <FormError />
              <div className="flex justify-end">
                <FormSubmit>Save tracking IDs</FormSubmit>
              </div>
            </AdminForm>
          </Panel>

          <Panel title="Crawling & indexing">
            <div className="space-y-3 text-sm">
              <p className="text-muted">Generated automatically from your products, categories and blog posts.</p>
              <div className="flex flex-wrap gap-2">
                {["/sitemap.xml", "/robots.txt"].map((path) => (
                  <a key={path} href={path} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 font-mono text-[13px] hover:border-ink">
                    {path} <ExternalLink className="size-3.5" />
                  </a>
                ))}
              </div>
              <Callout tone="info">After verifying the site in Google Search Console, submit /sitemap.xml there so new products and posts are discovered quickly.</Callout>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
