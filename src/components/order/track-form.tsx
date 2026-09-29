"use client";

import { useActionState } from "react";
import { lookupOrder } from "@/app/actions/orders";
import { Field, FormMessage, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/validators";

export function TrackOrderForm() {
  const [state, action] = useActionState<FormState, FormData>(lookupOrder, {});
  return (
    <form action={action} className="space-y-4">
      <Field label="Order number" htmlFor="t-order">
        <Input id="t-order" name="orderNumber" defaultValue={state.values?.orderNumber} placeholder="e.g. CS100123" required className="uppercase" />
      </Field>
      <Field label="Email or mobile number used for the order" htmlFor="t-contact">
        <Input id="t-contact" name="contact" defaultValue={state.values?.contact} required />
      </Field>
      <FormMessage state={state} />
      <SubmitButton size="lg" className="w-full" pendingText="Finding your order…">
        Track order
      </SubmitButton>
    </form>
  );
}
