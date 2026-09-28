"use client";

import { useActionState } from "react";
import { submitContact } from "@/app/actions/forms";
import { Field, FormMessage, Input, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/validators";

export function ContactForm({ defaultSubject }: { defaultSubject?: string }) {
  const [state, action] = useActionState<FormState, FormData>(submitContact, {});
  if (state.ok) return <FormMessage state={state} />;
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={e.name} htmlFor="ct-name">
          <Input id="ct-name" name="name" autoComplete="name" required invalid={!!e.name} />
        </Field>
        <Field label="Email" error={e.email} htmlFor="ct-email">
          <Input id="ct-email" name="email" type="email" autoComplete="email" required invalid={!!e.email} />
        </Field>
        <Field label="Phone (optional)" error={e.phone} htmlFor="ct-phone">
          <Input id="ct-phone" name="phone" type="tel" autoComplete="tel" invalid={!!e.phone} />
        </Field>
        <Field label="Subject (optional)" htmlFor="ct-subject">
          <Input id="ct-subject" name="subject" defaultValue={defaultSubject} />
        </Field>
      </div>
      <Field label="Message" error={e.message} htmlFor="ct-message">
        <Textarea id="ct-message" name="message" required invalid={!!e.message} placeholder="How can we help?" />
      </Field>
      <FormMessage state={state} />
      <SubmitButton variant="dark" pendingText="Sending…">
        Send message
      </SubmitButton>
    </form>
  );
}
