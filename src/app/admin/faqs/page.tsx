import type { Metadata } from "next";
import type { Faq, FaqScope } from "@prisma/client";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteFaq, saveFaq, setFaqActive } from "@/app/admin/_actions/faqs";
import { PageHeader, Panel, Toggle } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-button";
import { FormDialog } from "@/components/admin/dialog";
import { AdminForm, FormError, FormField, FormSubmit } from "@/components/admin/form";
import { ActiveBadge } from "@/components/admin/status-badge";

export const metadata: Metadata = { title: "FAQs" };

const SCOPES: { value: FaqScope; label: string; help: string }[] = [
  { value: "GENERAL", label: "General", help: "General store questions (help / contact pages)." },
  { value: "SERVICES", label: "Car cleaning services", help: "Shown on the Services page." },
  { value: "SHIPPING", label: "Shipping & returns", help: "Delivery, COD and returns questions." },
];

function FaqForm({ faq, scope = "GENERAL" }: { faq?: Faq; scope?: FaqScope }) {
  return (
    <AdminForm action={saveFaq} className="space-y-4">
      {faq && <input type="hidden" name="id" value={faq.id} />}
      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <FormField name="scope" label="Section">
          <select id="scope" name="scope" className="field" defaultValue={faq?.scope ?? scope}>
            {SCOPES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField name="sortOrder" label="Sort order">
          <input id="sortOrder" name="sortOrder" type="number" className="field" defaultValue={faq?.sortOrder ?? 0} required />
        </FormField>
      </div>
      <FormField name="question" label="Question">
        <input id="question" name="question" className="field" defaultValue={faq?.question ?? ""} required maxLength={300} />
      </FormField>
      <FormField name="answer" label="Answer">
        <textarea id="answer" name="answer" className="field min-h-32" defaultValue={faq?.answer ?? ""} required maxLength={3000} />
      </FormField>
      <Toggle name="isActive" label="Visible" defaultChecked={faq?.isActive ?? true} />
      <FormError />
      <div className="flex justify-end">
        <FormSubmit>{faq ? "Save FAQ" : "Add FAQ"}</FormSubmit>
      </div>
    </AdminForm>
  );
}

export default async function FaqsPage() {
  await requireAdmin();
  const faqs = await prisma.faq.findMany({ orderBy: [{ scope: "asc" }, { sortOrder: "asc" }] });
  return (
    <>
      <PageHeader
        title="FAQs"
        description="Questions and answers shown on the storefront. Services FAQs also appear as Google FAQ rich results."
        actions={
          <FormDialog trigger={<><Plus className="size-4" /> Add FAQ</>} triggerVariant="primary" title="New FAQ" size="lg">
            <FaqForm />
          </FormDialog>
        }
      />
      <div className="space-y-6">
        {SCOPES.map((scope) => {
          const list = faqs.filter((f) => f.scope === scope.value);
          return (
            <Panel
              key={scope.value}
              title={`${scope.label} (${list.length})`}
              description={scope.help}
              flush
              actions={
                <FormDialog trigger={<><Plus className="size-4" /> Add</>} title={`New ${scope.label.toLowerCase()} FAQ`} size="lg">
                  <FaqForm scope={scope.value} />
                </FormDialog>
              }
            >
              {list.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted">No questions yet.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {list.map((f) => (
                    <li key={f.id} className="flex items-start gap-4 px-5 py-3">
                      <span className="mt-0.5 w-6 shrink-0 text-right text-xs text-muted tabular-nums">{f.sortOrder}</span>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 font-medium">
                          {f.question} {!f.isActive && <ActiveBadge active={false} />}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-sm text-muted">{f.answer}</p>
                      </div>
                      <div className="flex shrink-0 gap-0.5">
                        <ActionButton action={setFaqActive.bind(null, f.id, !f.isActive)} variant="icon" label={f.isActive ? "Hide" : "Show"}>
                          {f.isActive ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </ActionButton>
                        <FormDialog trigger={<Pencil className="size-4" />} triggerVariant="icon" triggerLabel="Edit FAQ" title="Edit FAQ" size="lg">
                          <FaqForm faq={f} />
                        </FormDialog>
                        <ActionButton action={deleteFaq.bind(null, f.id)} variant="icon-danger" label="Delete FAQ" confirm="Delete this FAQ?">
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
