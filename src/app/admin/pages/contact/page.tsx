import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { saveContactPage } from "@/app/admin/_actions/content";
import { Callout, PageHeader, Panel } from "@/components/admin/ui";
import { AdminForm, FormError, FormSubmit } from "@/components/admin/form";
import { TextField } from "@/components/admin/fields";
import { TokenHelp } from "@/components/admin/token-help";

export const metadata: Metadata = { title: "Contact page" };

export default async function ContactEditor() {
  await requireAdmin();
  const { contact } = await getSettings();
  return (
    <>
      <PageHeader
        title="Contact page"
        description="Heading, support hours and the message customers see after writing to you."
        back={{ href: "/admin/pages", label: "Pages" }}
        actions={
          <Link href="/contact" target="_blank" className="text-sm font-semibold underline">
            View page
          </Link>
        }
      />
      <div className="max-w-3xl space-y-6">
        <Callout tone="info" title="Email, phone, WhatsApp and address">
          These come from{" "}
          <Link href="/admin/settings" className="font-semibold underline">
            Settings → Store details
          </Link>{" "}
          and update everywhere at once.
        </Callout>
        <TokenHelp />
        <Panel title="Contact page">
          <AdminForm action={saveContactPage} className="space-y-4">
            <TextField name="heading" label="Heading" defaultValue={contact.heading} max={100} required />
            <TextField name="intro" label="Introduction" defaultValue={contact.intro} max={400} multiline rows={3} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField name="supportHours" label="Support hours" defaultValue={contact.supportHours} max={80} />
              <TextField name="formTitle" label="Form heading" defaultValue={contact.formTitle} max={60} required />
            </div>
            <TextField name="successMessage" label="Thank-you message" defaultValue={contact.successMessage} max={200} required hint="Shown after the contact form is sent." />
            <TextField name="whatsappGreeting" label="WhatsApp greeting" defaultValue={contact.whatsappGreeting} max={100} hint="Pre-filled text when customers tap the WhatsApp button." />
            <FormError />
            <div className="flex justify-end">
              <FormSubmit>Save Contact page</FormSubmit>
            </div>
          </AdminForm>
        </Panel>
      </div>
    </>
  );
}
