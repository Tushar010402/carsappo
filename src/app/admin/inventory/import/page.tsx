import type { Metadata } from "next";
import { Download } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { IMPORT_LIMIT_ROWS } from "@/lib/admin/inventory-import";
import { importInventory } from "@/app/admin/_actions/inventory";
import { Callout, PageHeader, Panel } from "@/components/admin/ui";
import { AdminForm, FormError, FormField, FormSubmit } from "@/components/admin/form";
import { ActionDetails } from "@/components/admin/action-details";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = { title: "Bulk update prices & stock" };

export default async function InventoryImportPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader
        title="Bulk update prices & stock"
        description="Change prices, MRPs, stock and GST for many products at once from a spreadsheet."
        back={{ href: "/admin/inventory", label: "Inventory" }}
        actions={
          <a href="/admin/inventory/export" className={buttonClasses("outline", "sm")}>
            <Download className="size-4" /> Download current inventory
          </a>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel title="Upload CSV">
          <AdminForm action={importInventory} className="space-y-4">
            <FormField name="file" label="CSV file" hint={`Up to ${IMPORT_LIMIT_ROWS.toLocaleString("en-IN")} rows, under 1 MB.`}>
              <input
                id="file"
                name="file"
                type="file"
                accept=".csv,text/csv"
                required
                className="field py-2 file:mr-3 file:rounded-lg file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
              />
            </FormField>
            <FormError />
            <div className="flex flex-wrap justify-end gap-2">
              <FormSubmit name="intent" value="preview" variant="outline">
                Check file
              </FormSubmit>
              <FormSubmit name="intent" value="apply">
                Apply changes
              </FormSubmit>
            </div>
            <ActionDetails />
          </AdminForm>
        </Panel>
        <Panel title="How it works">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted">
            <li>Download the current inventory (or use Inventory → Export CSV with filters).</li>
            <li>
              Edit the <b className="text-ink">Price (INR)</b>, <b className="text-ink">MRP (INR)</b>, <b className="text-ink">Stock</b>,{" "}
              <b className="text-ink">Low stock alert</b> or <b className="text-ink">GST %</b> columns in Excel or Google Sheets. Keep the{" "}
              <b className="text-ink">SKU</b> column as it is.
            </li>
            <li>Save as CSV, then “Check file” to preview every change.</li>
            <li>“Apply changes” updates the store immediately.</li>
          </ol>
          <Callout tone="info" className="mt-4">
            Other columns are ignored. Leave a cell empty to keep the current value; put 0 in MRP to remove it. If any row has a problem, nothing is saved.
          </Callout>
        </Panel>
      </div>
    </>
  );
}
