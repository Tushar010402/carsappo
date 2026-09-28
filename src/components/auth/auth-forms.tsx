"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { login, register, requestPasswordReset, resetPassword } from "@/app/actions/auth";
import { Field, FormMessage, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { useWishlist } from "@/store/wishlist";
import type { FormState } from "@/lib/validators";

function PasswordInput({ id, name, invalid, autoComplete }: { id: string; name: string; invalid?: boolean; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input id={id} name={name} type={show ? "text" : "password"} required autoComplete={autoComplete} invalid={invalid} className="pr-11" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted hover:text-ink"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

/** Carries the guest wishlist so it's merged into the account on sign-in. */
function WishlistField() {
  const ids = useWishlist((s) => s.ids);
  return <input type="hidden" name="wishlist" value={JSON.stringify(ids)} />;
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(login, {});
  return (
    <form action={action} className="space-y-5">
      {next && <input type="hidden" name="next" value={next} />}
      <WishlistField />
      <Field label="Email" error={state.errors?.email} htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required invalid={!!state.errors?.email} />
      </Field>
      <Field
        label={
          <span className="flex items-center justify-between">
            Password
            <Link href="/forgot-password" className="text-xs font-medium text-muted underline hover:text-ink">
              Forgot password?
            </Link>
          </span>
        }
        error={state.errors?.password}
        htmlFor="password"
      >
        <PasswordInput id="password" name="password" autoComplete="current-password" invalid={!!state.errors?.password} />
      </Field>
      <FormMessage state={state} />
      <SubmitButton size="lg" className="w-full" pendingText="Signing in…">
        Log in
      </SubmitButton>
    </form>
  );
}

export function RegisterForm({ next, email }: { next?: string; email?: string }) {
  const [state, action] = useActionState<FormState, FormData>(register, {});
  return (
    <form action={action} className="space-y-5">
      {next && <input type="hidden" name="next" value={next} />}
      <WishlistField />
      <Field label="Full name" error={state.errors?.name} htmlFor="name">
        <Input id="name" name="name" autoComplete="name" required invalid={!!state.errors?.name} />
      </Field>
      <Field label="Email" error={state.errors?.email} htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue={email} required invalid={!!state.errors?.email} />
      </Field>
      <Field label="Mobile number (optional)" error={state.errors?.phone} htmlFor="phone">
        <Input id="phone" name="phone" type="tel" autoComplete="tel" invalid={!!state.errors?.phone} />
      </Field>
      <Field label="Password" error={state.errors?.password} hint="At least 8 characters." htmlFor="password">
        <PasswordInput id="password" name="password" autoComplete="new-password" invalid={!!state.errors?.password} />
      </Field>
      <FormMessage state={state} />
      <SubmitButton size="lg" className="w-full" pendingText="Creating account…">
        Create account
      </SubmitButton>
      <p className="text-center text-xs text-muted">
        By creating an account you agree to our{" "}
        <Link href="/policies/terms-and-conditions" className="underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/policies/privacy-policy" className="underline">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(requestPasswordReset, {});
  if (state.ok) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-5">
      <Field label="Email" error={state.errors?.email} htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required invalid={!!state.errors?.email} />
      </Field>
      <FormMessage state={state} />
      <SubmitButton size="lg" className="w-full" pendingText="Sending…">
        Send reset link
      </SubmitButton>
    </form>
  );
}

export function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const [state, action] = useActionState<FormState, FormData>(resetPassword, {});
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="email" value={email} />
      <Field label="New password" error={state.errors?.password} hint="At least 8 characters." htmlFor="password">
        <PasswordInput id="password" name="password" autoComplete="new-password" invalid={!!state.errors?.password} />
      </Field>
      <FormMessage state={state} />
      <SubmitButton size="lg" className="w-full" pendingText="Saving…">
        Set new password
      </SubmitButton>
    </form>
  );
}
