import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteAddress, setDefaultAddress } from "@/app/actions/account";
import { AddressEditor } from "@/components/account/address-form";
import { EmptyState } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const user = await requireUser("/account/addresses");
  const addresses = await prisma.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] });
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Addresses</h1>
        <AddressEditor />
      </div>
      {addresses.length === 0 ? (
        <EmptyState icon={<MapPin className="size-6" />} title="No saved addresses" description="Save an address for faster checkout." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <div key={a.id} className="flex flex-col rounded-2xl border border-line p-5 text-sm">
              <p className="flex items-center gap-2 font-semibold">
                {a.name} {a.isDefault && <Badge tone="brand">Default</Badge>}
              </p>
              <p className="mt-2 text-muted">
                {a.line1}
                {a.line2 && `, ${a.line2}`}
                {a.landmark && `, near ${a.landmark}`}
                <br />
                {a.city}, {a.state} {a.pincode}
                <br />
                {a.phone}
              </p>
              <div className="mt-4 flex items-center gap-4">
                <AddressEditor
                  address={{ id: a.id, isDefault: a.isDefault, name: a.name, phone: a.phone, line1: a.line1, line2: a.line2 ?? "", landmark: a.landmark ?? "", city: a.city, state: a.state, pincode: a.pincode }}
                />
                {!a.isDefault && (
                  <form action={setDefaultAddress}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="text-sm font-medium underline">Set as default</button>
                  </form>
                )}
                <form action={deleteAddress} className="ml-auto">
                  <input type="hidden" name="id" value={a.id} />
                  <button className="text-sm font-medium text-danger">Delete</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
