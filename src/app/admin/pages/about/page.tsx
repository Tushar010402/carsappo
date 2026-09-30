import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { saveAboutPage } from "@/app/admin/_actions/content";
import { FEATURE_ICON_NAMES } from "@/components/icons/feature-icon";
import { PageHeader, Panel } from "@/components/admin/ui";
import { AdminForm, FormActions, FormError, FormField, FormSubmit } from "@/components/admin/form";
import { RowsEditor } from "@/components/admin/list-editor";
import { TextField } from "@/components/admin/fields";
import { TokenHelp } from "@/components/admin/token-help";

export const metadata: Metadata = { title: "About page" };

export default async function AboutEditor() {
  await requireAdmin();
  const { about } = await getSettings();
  const iconOptions = FEATURE_ICON_NAMES.map((n) => ({ value: n, label: n.replace(/([a-z])([A-Z])/g, "$1 $2") }));

  return (
    <>
      <PageHeader
        title="About page"
        description="Your story, mission and values. Changes go live as soon as you save."
        back={{ href: "/admin/pages", label: "Pages" }}
        actions={
          <Link href="/about" target="_blank" className="text-sm font-semibold underline">
            View page
          </Link>
        }
      />
      <AdminForm action={saveAboutPage} className="space-y-6">
        <TokenHelp />
        <Panel title="Top of the page">
          <div className="grid gap-4 lg:grid-cols-3">
            <TextField name="eyebrow" label="Small label" defaultValue={about.eyebrow} max={60} />
            <TextField name="heading" label="Heading" defaultValue={about.heading} max={100} required />
            <TextField name="headingHighlight" label="Second line (yellow)" defaultValue={about.headingHighlight} max={60} />
          </div>
          <TextField name="intro" label="Introduction" defaultValue={about.intro} max={800} multiline rows={4} className="mt-4" />
        </Panel>

        <Panel title="Mission">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <TextField name="missionEyebrow" label="Small label" defaultValue={about.missionEyebrow} max={60} />
            <TextField name="missionTitle" label="Heading" defaultValue={about.missionTitle} max={160} />
          </div>
          <TextField name="missionText" label="Text" defaultValue={about.missionText} max={3000} multiline rows={6} hint="Leave a blank line between paragraphs." className="mt-4" />
        </Panel>

        <Panel title="Values" description="Cards with an icon, title and short text (up to 12).">
          <TextField name="valuesTitle" label="Section heading" defaultValue={about.valuesTitle} max={80} className="mb-4" />
          <FormField name="values">
            <RowsEditor
              name="values"
              defaultValue={about.values}
              addLabel="Add value"
              max={12}
              columns="sm:grid-cols-[10rem_minmax(0,1fr)_minmax(0,2fr)]"
              fields={[
                { key: "icon", label: "Icon", type: "select", options: iconOptions },
                { key: "title", label: "Title" },
                { key: "text", label: "Text" },
              ]}
            />
          </FormField>
        </Panel>

        <div className="grid gap-6 xl:grid-cols-2">
          {(["primary", "secondary"] as const).map((k) => (
            <Panel key={k} title={k === "primary" ? "Business card 1" : "Business card 2"} description={k === "primary" ? "Yellow card." : "Grey card."}>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField name={`${k}Eyebrow`} label="Small label" defaultValue={about[`${k}Eyebrow`]} max={60} />
                <TextField name={`${k}Title`} label="Heading" defaultValue={about[`${k}Title`]} max={100} />
                <TextField name={`${k}Text`} label="Text" defaultValue={about[`${k}Text`]} max={300} multiline rows={2} className="sm:col-span-2" />
                <TextField name={`${k}Button`} label="Button" defaultValue={about[`${k}Button`]} max={30} hint="Empty hides the button." />
                <TextField name={`${k}Href`} label="Button link" defaultValue={about[`${k}Href`]} placeholder="/shop" />
              </div>
            </Panel>
          ))}
        </div>

        <Panel title="Search engines">
          <div className="grid gap-4 lg:grid-cols-2">
            <TextField name="metaTitle" label="Page title" defaultValue={about.metaTitle} max={80} />
            <TextField name="metaDescription" label="Description" defaultValue={about.metaDescription} max={200} multiline rows={2} />
          </div>
        </Panel>

        <FormError />
        <FormActions sticky>
          <FormSubmit>Save About page</FormSubmit>
        </FormActions>
      </AdminForm>
    </>
  );
}
