import type { Metadata } from "next";
import Link from "next/link";
import { ShieldOff } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { addAdmin } from "@/app/admin/_actions/team";
import { setUserRole } from "@/app/admin/_actions/customers";
import { Callout, PageHeader, Panel, TBody, THead, Table, Td, Th, Tr } from "@/components/admin/ui";
import { AdminForm, FormError, FormField, FormSubmit } from "@/components/admin/form";
import { ActionButton } from "@/components/admin/action-button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const me = await requireAdmin();
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, phone: true, createdAt: true },
  });
  const onlyOne = admins.length <= 1;

  return (
    <>
      <PageHeader title="Team" description="People who can sign in to this admin panel. Every admin has full access." />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Panel title={`Admins (${admins.length})`} flush>
          <Table minWidth={560}>
            <THead>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Since</Th>
              <Th align="right">
                <span className="sr-only">Actions</span>
              </Th>
            </THead>
            <TBody>
              {admins.map((a) => {
                const isSelf = a.id === me.id;
                return (
                  <Tr key={a.id}>
                    <Td>
                      <Link href={`/admin/customers/${a.id}`} className="font-semibold hover:underline">
                        {a.name}
                      </Link>{" "}
                      {isSelf && <Badge tone="soft">You</Badge>}
                      {a.phone && <span className="block text-xs text-muted">{a.phone}</span>}
                    </Td>
                    <Td>{a.email}</Td>
                    <Td className="text-muted">{formatDate(a.createdAt)}</Td>
                    <Td align="right">
                      {!isSelf && !onlyOne && (
                        <ActionButton
                          action={setUserRole.bind(null, a.id, "CUSTOMER")}
                          confirm={`Remove admin access for ${a.name}? They keep their customer account.`}
                          label={`Remove admin access for ${a.name}`}
                          className="text-red-600"
                        >
                          <ShieldOff className="size-4" /> Remove
                        </ActionButton>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        </Panel>

        <Panel title="Add an admin" description="Use the email they sign in with. If they don't have an account yet, set a starting password and share it with them privately.">
          <AdminForm action={addAdmin} resetOnSuccess className="space-y-4">
            <FormField name="email" label="Email">
              <input id="email" name="email" type="email" className="field" required autoComplete="off" />
            </FormField>
            <FormField name="name" label="Name" hint="Only needed for a new account.">
              <input id="name" name="name" className="field" maxLength={80} autoComplete="off" />
            </FormField>
            <FormField name="password" label="Starting password" hint="Only needed for a new account. At least 8 characters.">
              <input id="password" name="password" type="password" className="field" minLength={8} maxLength={100} autoComplete="new-password" />
            </FormField>
            <FormError />
            <div className="flex justify-end">
              <FormSubmit>Add admin</FormSubmit>
            </div>
          </AdminForm>
          <Callout tone="warning" className="mt-4">
            Admins can see orders and customer details, change prices and settings, and add or remove other admins. Removing access signs them out
            immediately.
          </Callout>
        </Panel>
      </div>
    </>
  );
}
