import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { saveNavigation } from "@/app/admin/_actions/content";
import { Callout, PageHeader, Panel } from "@/components/admin/ui";
import { AdminForm, FormError, FormField, FormSubmit } from "@/components/admin/form";
import { ListEditor, RowsEditor } from "@/components/admin/list-editor";
import { TextField } from "@/components/admin/fields";
import { TokenHelp } from "@/components/admin/token-help";

export const metadata: Metadata = { title: "Navigation & footer" };

const linkFields = [
  { key: "label", label: "Label" },
  { key: "href", label: "Link", placeholder: "/shop or https://…" },
];

export default async function NavigationEditor() {
  await requireAdmin();
  const { navigation: nav } = await getSettings();
  return (
    <>
      <PageHeader title="Navigation & footer" description="Main menu, footer links and footer text. Categories, services, policies and contact details fill in automatically." />
      <div className="space-y-6">
        <TokenHelp />
        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Main menu" description="Shown in the header on desktop and in the phone menu.">
            <AdminForm action={saveNavigation.bind(null, "header")} className="space-y-4">
              <FormField name="header" hint="The item linking to /shop opens the categories menu.">
                <RowsEditor name="header" defaultValue={nav.header} fields={linkFields} addLabel="Add menu item" max={10} />
              </FormField>
              <Callout tone="info" title="Categories menu promo">
                The dark card inside the Shop menu.
              </Callout>
              <div className="grid gap-4 sm:grid-cols-3">
                <TextField name="megaPromoTitle" label="Title" defaultValue={nav.megaPromoTitle} max={60} />
                <TextField name="megaPromoText" label="Text" defaultValue={nav.megaPromoText} max={120} />
                <TextField name="megaPromoLink" label="Link text" defaultValue={nav.megaPromoLink} max={40} />
              </div>
              <FormError />
              <div className="flex justify-end">
                <FormSubmit>Save menu</FormSubmit>
              </div>
            </AdminForm>
          </Panel>

          <Panel title="Footer" description="Custom pages marked “show in footer” are added to the quick links automatically.">
            <AdminForm action={saveNavigation.bind(null, "footer")} className="space-y-4">
              <TextField name="footerBlurb" label="Text under the logo" defaultValue={nav.footerBlurb} max={300} multiline hint="Shown after your tagline (Settings)." />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField name="newsletterTitle" label="Newsletter heading" defaultValue={nav.newsletterTitle} max={60} />
                <TextField name="newsletterText" label="Newsletter text" defaultValue={nav.newsletterText} max={160} />
              </div>
              <FormField name="quickLinks" label="Quick links">
                <RowsEditor name="quickLinks" defaultValue={nav.quickLinks} fields={linkFields} addLabel="Add link" max={15} />
              </FormField>
              <FormField name="paymentBadges" label="Payment badges" hint="Small labels next to “Secure payments”.">
                <ListEditor name="paymentBadges" defaultValue={nav.paymentBadges} placeholder="Badge" addLabel="Add badge" max={10} />
              </FormField>
              <FormError />
              <div className="flex justify-end">
                <FormSubmit>Save footer</FormSubmit>
              </div>
            </AdminForm>
          </Panel>
        </div>
      </div>
    </>
  );
}
