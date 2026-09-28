"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/actions/account";
import { changePassword } from "@/app/actions/auth";
import { Field, FormMessage, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { FormState } from "@/lib/validators";

export function ProfileForm({ name, phone, email }: { name: string; phone: string | null; email: string }) {
  const [state, action] = useActionState<FormState, FormData>(updateProfile, {});
  return (
    <form action={action} className="space-y-4">
      <Field label="Email" htmlFor="pf-email">
        <Input id="pf-email" value={email} disabled />
      </Field>
      <Field label="Name" error={state.errors?.name} htmlFor="pf-name">
        <Input id="pf-name" name="name" defaultValue={name} required />
      </Field>
      <Field label="Mobile number" error={state.errors?.phone} htmlFor="pf-phone">
        <Input id="pf-phone" name="phone" defaultValue={phone ?? ""} type="tel" />
      </Field>
      <FormMessage state={state} />
      <SubmitButton variant="dark" pendingText="Saving…">
        Save profile
      </SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(changePassword, {});
  return (
    <form action={action} className="space-y-4">
      <Field label="Current password" error={state.errors?.current} htmlFor="pw-current">
        <Input id="pw-current" name="current" type="password" autoComplete="current-password" required />
      </Field>
      <Field label="New password" error={state.errors?.password} hint="At least 8 characters." htmlFor="pw-new">
        <Input id="pw-new" name="password" type="password" autoComplete="new-password" required />
      </Field>
      <FormMessage state={state} />
      <SubmitButton variant="outline" pendingText="Updating…">
        Change password
      </SubmitButton>
    </form>
  );
}
