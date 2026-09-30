import type { Page, PageKind } from "@prisma/client";
import { Save, Trash2 } from "lucide-react";
import { deletePage, savePage } from "@/app/admin/_actions/pages";
import { ActionButton } from "@/components/admin/action-button";
import { AdminForm, FormActions, FormError, FormField, FormSubmit } from "@/components/admin/form";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { SlugFields } from "@/components/admin/slug-fields";
import { TokenHelp } from "@/components/admin/token-help";
import { Panel, Toggle } from "@/components/admin/ui";

/** Editor for policies and custom pages (Markdown body with {tokens}). */
export function PageForm({ page, kind, builtIn }: { page?: Page | null; kind: PageKind; builtIn?: boolean }) {
  const prefix = kind === "POLICY" ? "/policies/" : "/pages/";
  return (
    <div className="space-y-6">
      <AdminForm action={savePage} className="space-y-6">
        {page && <input type="hidden" name="id" value={page.id} />}
        <input type="hidden" name="kind" value={kind} />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-6">
            <Panel title={kind === "POLICY" ? "Policy" : "Page"} bodyClassName="space-y-4">
              {builtIn ? (
                <>
                  <FormField name="title" label="Title">
                    <input id="title" name="title" className="field" defaultValue={page?.title ?? ""} required maxLength={120} />
                  </FormField>
                  <input type="hidden" name="slug" value={page?.slug ?? ""} />
                  <p className="text-xs text-muted">
                    Address: <span className="font-mono">{prefix + (page?.slug ?? "")}</span> (fixed — checkout, invoices and emails link here)
                  </p>
                </>
              ) : (
                <SlugFields nameField="title" nameLabel="Title" defaultName={page?.title} defaultSlug={page?.slug} prefix={prefix} namePlaceholder="Warranty" />
              )}
              <FormField name="body" label="Content" hint="Markdown: ## for headings, - for bullets, **bold**, [link](/shop). Placeholders are filled in automatically.">
                <MarkdownEditor name="body" defaultValue={page?.body ?? ""} rows={24} />
              </FormField>
              <TokenHelp />
            </Panel>
            <Panel title="Search engine listing" bodyClassName="space-y-4">
              <FormField name="metaTitle" label="Meta title" hint="Defaults to the title.">
                <input id="metaTitle" name="metaTitle" className="field" defaultValue={page?.metaTitle ?? ""} maxLength={120} />
              </FormField>
              <FormField name="metaDescription" label="Meta description" hint="Defaults to the start of the content.">
                <textarea id="metaDescription" name="metaDescription" className="field min-h-20" defaultValue={page?.metaDescription ?? ""} maxLength={320} />
              </FormField>
            </Panel>
          </div>
          <div className="space-y-6">
            <Panel title="Visibility" bodyClassName="space-y-4">
              <Toggle name="isPublished" label="Published" description="Visible on the website" defaultChecked={page?.isPublished ?? true} />
              <Toggle
                name="showInFooter"
                label="Show in footer"
                description={kind === "POLICY" ? "Listed under Policies" : "Listed under Quick links"}
                defaultChecked={page?.showInFooter ?? true}
              />
              <FormField name="sortOrder" label="Sort order" hint="Lower numbers come first.">
                <input id="sortOrder" name="sortOrder" type="number" className="field" defaultValue={page?.sortOrder ?? 0} required />
              </FormField>
            </Panel>
          </div>
        </div>
        <FormError />
        <FormActions sticky>
          <FormSubmit>
            <Save className="size-4" /> {page ? "Save page" : "Create page"}
          </FormSubmit>
        </FormActions>
      </AdminForm>
      {page && (
        <div className="flex justify-end">
          <ActionButton
            action={deletePage.bind(null, page.id)}
            variant="outline"
            className="text-red-600"
            confirm={builtIn ? "Reset this policy to the default text? Your edits will be lost." : "Delete this page permanently?"}
          >
            <Trash2 className="size-4" /> {builtIn ? "Reset to default text" : "Delete page"}
          </ActionButton>
        </div>
      )}
    </div>
  );
}
