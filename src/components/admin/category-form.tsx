import type { Category } from "@prisma/client";
import { Save } from "lucide-react";
import { saveCategory } from "@/app/admin/_actions/categories";
import { AdminForm, FormActions, FormError, FormField, FormSubmit } from "@/components/admin/form";
import { IconPicker } from "@/components/admin/icon-picker";
import { MediaInput } from "@/components/admin/media-input";
import { SlugFields } from "@/components/admin/slug-fields";
import { Panel, Toggle } from "@/components/admin/ui";

export function CategoryForm({ category, parents }: { category?: Category | null; parents: { id: string; name: string }[] }) {
  return (
    <AdminForm action={saveCategory} className="space-y-6">
      {category && <input type="hidden" name="id" value={category.id} />}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Panel title="Details" bodyClassName="space-y-4">
            <SlugFields defaultName={category?.name} defaultSlug={category?.slug} prefix="/category/" namePlaceholder="e.g. Seat Covers" />
            <FormField name="description" label="Description" hint="Shown at the top of the category page.">
              <textarea id="description" name="description" className="field min-h-24" defaultValue={category?.description ?? ""} maxLength={500} />
            </FormField>
            <FormField name="image" label="Tile image" hint="Optional photo for the category tile (square works best).">
              <MediaInput name="image" defaultValue={category?.image} folder="categories" />
            </FormField>
          </Panel>
          <Panel title="Icon" description="Shown on category tiles and menus when there's no image.">
            <FormField name="icon">
              <IconPicker name="icon" defaultValue={category?.icon} />
            </FormField>
          </Panel>
          <Panel title="Search engine listing" bodyClassName="space-y-4">
            <FormField name="metaTitle" label="Meta title">
              <input id="metaTitle" name="metaTitle" className="field" defaultValue={category?.metaTitle ?? ""} maxLength={120} />
            </FormField>
            <FormField name="metaDescription" label="Meta description">
              <textarea id="metaDescription" name="metaDescription" className="field min-h-20" defaultValue={category?.metaDescription ?? ""} maxLength={320} />
            </FormField>
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Visibility" bodyClassName="space-y-4">
            <Toggle name="isActive" label="Active" description="Show in menus and the shop" defaultChecked={category?.isActive ?? true} />
            <FormField name="sortOrder" label="Sort order" hint="Lower numbers appear first.">
              <input id="sortOrder" name="sortOrder" type="number" className="field" defaultValue={category?.sortOrder ?? 0} required />
            </FormField>
            <FormField name="parentId" label="Parent category" hint="Leave empty for a top-level category.">
              <select id="parentId" name="parentId" className="field" defaultValue={category?.parentId ?? ""}>
                <option value="">None (top level)</option>
                {parents
                  .filter((p) => p.id !== category?.id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </FormField>
          </Panel>
        </div>
      </div>
      <FormError />
      <FormActions sticky>
        <FormSubmit>
          <Save className="size-4" /> {category ? "Save category" : "Create category"}
        </FormSubmit>
      </FormActions>
    </AdminForm>
  );
}
