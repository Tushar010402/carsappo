import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getSettings, homeSections } from "@/lib/settings";
import { HOME_SECTIONS } from "@/lib/content";
import { saveHomeContent } from "@/app/admin/_actions/content";
import { FEATURE_ICON_NAMES } from "@/components/icons/feature-icon";
import { PageHeader, Panel } from "@/components/admin/ui";
import { AdminForm, FormError, FormField, FormSubmit } from "@/components/admin/form";
import { ListEditor, RowsEditor } from "@/components/admin/list-editor";
import { SectionsEditor } from "@/components/admin/sections-editor";
import { TextField } from "@/components/admin/fields";
import { TokenHelp } from "@/components/admin/token-help";

export const metadata: Metadata = { title: "Homepage" };

function Save({ label = "Save" }: { label?: string }) {
  return (
    <>
      <FormError />
      <div className="flex justify-end">
        <FormSubmit>{label}</FormSubmit>
      </div>
    </>
  );
}

export default async function HomepageEditor() {
  await requireAdmin();
  const settings = await getSettings();
  const home = settings.home;
  const labels = Object.fromEntries(HOME_SECTIONS.map((s) => [s.id, s.label]));
  const iconOptions = FEATURE_ICON_NAMES.map((n) => ({ value: n, label: n.replace(/([a-z])([A-Z])/g, "$1 $2") }));

  return (
    <>
      <PageHeader
        title="Homepage"
        description="Everything on the homepage: section order, headings and text. Changes go live as soon as you save."
        actions={
          <Link href="/" target="_blank" className="text-sm font-semibold underline">
            View homepage
          </Link>
        }
      />
      <div className="space-y-6">
        <TokenHelp />

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Sections" description="Reorder with the arrows; hidden sections disappear from the homepage.">
            <AdminForm action={saveHomeContent.bind(null, "layout")} className="space-y-4">
              <SectionsEditor name="sections" defaultValue={homeSections(settings).map((s) => ({ ...s, label: labels[s.id] ?? s.id }))} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField name="bestSellers.count" label="Best sellers to show" defaultValue={home.bestSellers.count} max={2} />
                <TextField name="featured.count" label="Products per featured tab" defaultValue={home.featured.count} max={2} />
              </div>
              <Save label="Save layout" />
            </AdminForm>
          </Panel>

          <Panel title="Hero" description="The big banner at the top. A Homepage hero banner (Banners) replaces it when active.">
            <AdminForm action={saveHomeContent.bind(null, "hero")} className="space-y-4">
              <TextField name="hero.eyebrow" label="Small label" defaultValue={home.hero.eyebrow} max={80} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField name="hero.title" label="Headline" defaultValue={home.hero.title} max={60} required />
                <TextField name="hero.titleHighlight" label="Highlighted words (yellow)" defaultValue={home.hero.titleHighlight} max={40} />
              </div>
              <FormField name="hero.bullets" label="Bullet points">
                <ListEditor name="hero.bullets" defaultValue={home.hero.bullets} placeholder="Bullet" addLabel="Add bullet" max={4} />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField name="hero.primaryLabel" label="Main button" defaultValue={home.hero.primaryLabel} max={30} />
                <TextField name="hero.primaryHref" label="Main button link" defaultValue={home.hero.primaryHref} placeholder="/shop" />
                <TextField name="hero.secondaryLabel" label="Second button" defaultValue={home.hero.secondaryLabel} max={30} />
                <TextField name="hero.secondaryHref" label="Second button link" defaultValue={home.hero.secondaryHref} placeholder="/services" />
              </div>
              <TextField name="hero.trustLine" label="Trust line under the search bar" defaultValue={home.hero.trustLine} max={160} />
              <Save label="Save hero" />
            </AdminForm>
          </Panel>
        </div>

        <Panel title="Section headings" description="Small label (eyebrow) and heading for each section.">
          <AdminForm action={saveHomeContent.bind(null, "headings")} className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-3">
              <TextField name="vehicle.eyebrow" label="Shop by vehicle · label" defaultValue={home.vehicle.eyebrow} max={60} />
              <TextField name="vehicle.title" label="Shop by vehicle · heading" defaultValue={home.vehicle.title} max={120} required />
              <TextField name="vehicle.subtitle" label="Shop by vehicle · text" defaultValue={home.vehicle.subtitle} max={300} />
              <TextField name="categories.eyebrow" label="Categories · label" defaultValue={home.categories.eyebrow} max={60} />
              <TextField name="categories.title" label="Categories · heading" defaultValue={home.categories.title} max={120} required />
              <TextField name="categories.linkLabel" label="Categories · link text" defaultValue={home.categories.linkLabel} max={30} />
              <TextField name="bestSellers.eyebrow" label="Best sellers · label" defaultValue={home.bestSellers.eyebrow} max={60} />
              <TextField name="bestSellers.title" label="Best sellers · heading" defaultValue={home.bestSellers.title} max={120} required className="lg:col-span-2" />
              <TextField name="featured.eyebrow" label="Featured · label" defaultValue={home.featured.eyebrow} max={60} />
              <TextField name="featured.title" label="Featured · heading" defaultValue={home.featured.title} max={120} required className="lg:col-span-2" />
              <TextField name="featured.latestLabel" label="Tab 1 (newest products)" defaultValue={home.featured.latestLabel} max={40} hint="Empty hides the tab." />
              <TextField name="featured.premiumLabel" label="Tab 2 (premium products)" defaultValue={home.featured.premiumLabel} max={40} />
              <TextField name="featured.trendingLabel" label="Tab 3 (trending products)" defaultValue={home.featured.trendingLabel} max={40} />
              <TextField name="why.eyebrow" label="Why us · label" defaultValue={home.why.eyebrow} max={60} />
              <TextField name="why.title" label="Why us · heading" defaultValue={home.why.title} max={120} required className="lg:col-span-2" />
              <TextField name="reviews.eyebrow" label="Reviews · label" defaultValue={home.reviews.eyebrow} max={60} />
              <TextField name="reviews.title" label="Reviews · heading" defaultValue={home.reviews.title} max={120} required className="lg:col-span-2" />
              <TextField name="instagram.title" label="Instagram · heading" defaultValue={home.instagram.title} max={120} required />
              <TextField name="instagram.subtitle" label="Instagram · text" defaultValue={home.instagram.subtitle} max={200} className="lg:col-span-2" />
            </div>
            <Save label="Save headings" />
          </AdminForm>
        </Panel>

        <div className="grid gap-6 xl:grid-cols-2">
          <Panel title="Why us — points" description="Up to 12 cards with an icon, title and short text.">
            <AdminForm action={saveHomeContent.bind(null, "why")} className="space-y-4">
              <FormField name="why.points">
                <RowsEditor
                  name="why.points"
                  defaultValue={home.why.points}
                  addLabel="Add point"
                  max={12}
                  columns="sm:grid-cols-[10rem_minmax(0,1fr)_minmax(0,2fr)]"
                  fields={[
                    { key: "icon", label: "Icon", type: "select", options: iconOptions },
                    { key: "title", label: "Title" },
                    { key: "text", label: "Text" },
                  ]}
                />
              </FormField>
              <Save label="Save points" />
            </AdminForm>
          </Panel>

          <Panel title="Daily car cleaning block" description="The yellow services section. Service cards come from Services → Service content.">
            <AdminForm action={saveHomeContent.bind(null, "cleaning")} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField name="cleaning.badge" label="Badge" defaultValue={home.cleaning.badge} max={80} />
                <TextField name="cleaning.buttonLabel" label="Button" defaultValue={home.cleaning.buttonLabel} max={30} required />
              </div>
              <TextField name="cleaning.title" label="Heading" defaultValue={home.cleaning.title} max={120} required />
              <TextField name="cleaning.text" label="Text" defaultValue={home.cleaning.text} max={400} multiline />
              <FormField name="cleaning.bullets" label="Bullet points">
                <ListEditor name="cleaning.bullets" defaultValue={home.cleaning.bullets} placeholder="Bullet" addLabel="Add bullet" max={8} />
              </FormField>
              <Save label="Save cleaning block" />
            </AdminForm>
          </Panel>
        </div>
      </div>
    </>
  );
}
