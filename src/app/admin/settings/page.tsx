import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { INDIAN_STATES } from "@/lib/constants";
import { changePassword } from "@/app/actions/auth";
import { saveSocialSettings, saveStoreSettings } from "@/app/admin/_actions/settings";
import { PageHeader, Panel } from "@/components/admin/ui";
import { AdminForm, FormError, FormField, FormSubmit } from "@/components/admin/form";
import { MediaInput } from "@/components/admin/media-input";

export const metadata: Metadata = { title: "Settings" };

const SOCIAL: { key: "instagram" | "facebook" | "youtube" | "x" | "linkedin" | "googleReviewsUrl"; label: string; placeholder: string }[] = [
  { key: "instagram", label: "Instagram", placeholder: "https://www.instagram.com/carsappo" },
  { key: "facebook", label: "Facebook", placeholder: "https://www.facebook.com/carsappo" },
  { key: "youtube", label: "YouTube", placeholder: "https://www.youtube.com/@carsappo" },
  { key: "x", label: "X (Twitter)", placeholder: "https://x.com/carsappo" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://www.linkedin.com/company/carsappo" },
  { key: "googleReviewsUrl", label: "Google reviews link", placeholder: "https://g.page/r/…/review" },
];

export default async function SettingsPage() {
  const admin = await requireAdmin();
  const { store, social } = await getSettings();

  return (
    <>
      <PageHeader title="Settings" description="Store details used across the site, emails and GST invoices." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel title="Store details">
          <AdminForm action={saveStoreSettings} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField name="name" label="Store name">
                <input id="name" name="name" className="field" defaultValue={store.name} required maxLength={60} />
              </FormField>
              <FormField name="legalName" label="Legal / registered name" hint="Printed on GST invoices.">
                <input id="legalName" name="legalName" className="field" defaultValue={store.legalName} maxLength={120} />
              </FormField>
            </div>
            <FormField name="tagline" label="Tagline">
              <input id="tagline" name="tagline" className="field" defaultValue={store.tagline} maxLength={120} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField name="phone" label="Phone">
                <input id="phone" name="phone" type="tel" className="field" defaultValue={store.phone} maxLength={20} />
              </FormField>
              <FormField name="whatsapp" label="WhatsApp number" hint="With country code, e.g. 919876543210">
                <input id="whatsapp" name="whatsapp" type="tel" className="field" defaultValue={store.whatsapp} maxLength={20} />
              </FormField>
              <FormField name="email" label="Support email">
                <input id="email" name="email" type="email" className="field" defaultValue={store.email} maxLength={120} />
              </FormField>
            </div>
            <FormField name="address" label="Registered address">
              <textarea id="address" name="address" className="field min-h-20" defaultValue={store.address} maxLength={300} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField name="city" label="City">
                <input id="city" name="city" className="field" defaultValue={store.city} maxLength={80} />
              </FormField>
              <FormField name="state" label="State" hint="Decides CGST+SGST vs IGST on invoices.">
                <select id="state" name="state" className="field" defaultValue={store.state}>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField name="pincode" label="Pincode" hint="Also the Shiprocket pickup pincode.">
                <input id="pincode" name="pincode" className="field" inputMode="numeric" defaultValue={store.pincode} maxLength={6} />
              </FormField>
            </div>
            <FormField name="gstin" label="GSTIN" hint="Shown on tax invoices. Leave empty if not registered.">
              <input id="gstin" name="gstin" className="field font-mono uppercase" defaultValue={store.gstin} maxLength={15} placeholder="09ABCDE1234F1Z5" />
            </FormField>
            <FormField name="logoUrl" label="Logo" hint="Replaces the wordmark in the header. Transparent PNG/SVG, about 240×64.">
              <MediaInput name="logoUrl" defaultValue={store.logoUrl} folder="brand" aspect="wide" />
            </FormField>
            <FormField name="announcement" label="Announcement bar" hint="Short message at the very top of every page. Leave empty to hide.">
              <input id="announcement" name="announcement" className="field" defaultValue={store.announcement} maxLength={200} />
            </FormField>
            <FormError />
            <div className="flex justify-end">
              <FormSubmit>Save store details</FormSubmit>
            </div>
          </AdminForm>
        </Panel>

        <div className="space-y-6">
          <Panel title="Social links" description="Used in the footer and structured data.">
            <AdminForm action={saveSocialSettings} className="space-y-3">
              {SOCIAL.map((s) => (
                <FormField key={s.key} name={s.key} label={s.label}>
                  <input id={s.key} name={s.key} type="url" className="field" defaultValue={social[s.key]} placeholder={s.placeholder} maxLength={500} />
                </FormField>
              ))}
              <FormError />
              <FormSubmit size="sm">Save social links</FormSubmit>
            </AdminForm>
          </Panel>

          <Panel title="Change password" description={`Signed in as ${admin.email}. Other devices are signed out after a change.`}>
            <AdminForm action={changePassword} resetOnSuccess className="space-y-3">
              <FormField name="current" label="Current password">
                <input id="current" name="current" type="password" autoComplete="current-password" className="field" required />
              </FormField>
              <FormField name="password" label="New password" hint="At least 8 characters.">
                <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} className="field" required />
              </FormField>
              <FormError />
              <FormSubmit size="sm" variant="outline">
                Update password
              </FormSubmit>
            </AdminForm>
          </Panel>
        </div>
      </div>
    </>
  );
}
