"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { saveAddress } from "@/app/actions/account";
import { AddressFields, emptyAddress, type AddressDraft } from "@/components/checkout/address-fields";
import { Button } from "@/components/ui/button";
import { Checkbox, FormMessage } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/validators";

export function AddressEditor({ address, triggerLabel }: { address?: AddressDraft & { id: string; isDefault: boolean }; triggerLabel?: string }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<AddressDraft>(address ?? emptyAddress);
  const [state, action] = useActionState<FormState, FormData>(async (prev, formData) => {
    const res = await saveAddress(prev, formData);
    if (res.ok) setOpen(false);
    return res;
  }, {});

  if (!open) {
    return address ? (
      <button onClick={() => setOpen(true)} className="text-sm font-medium underline">
        {triggerLabel ?? "Edit"}
      </button>
    ) : (
      <Button variant="dark" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Add address
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Address">
      <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
      <form action={action} className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl">
        <h2 className="mb-5 text-lg font-semibold">{address ? "Edit address" : "New address"}</h2>
        {address && <input type="hidden" name="id" value={address.id} />}
        {(["name", "phone", "line1", "line2", "landmark", "city", "state", "pincode"] as const).map((k) => (
          <input key={k} type="hidden" name={k} value={value[k] ?? ""} />
        ))}
        <AddressFields value={value} onChange={setValue} errors={state.errors} />
        <Checkbox className="mt-4" name="isDefault" label="Make this my default address" defaultChecked={address?.isDefault} />
        <div className="mt-5">
          <FormMessage state={state.ok ? undefined : state} />
        </div>
        <div className="mt-5 flex gap-2">
          <SubmitButton variant="dark" pendingText="Saving…">
            Save address
          </SubmitButton>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
