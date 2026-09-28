"use client";

import { useActionState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { subscribeNewsletter } from "@/app/actions/forms";
import type { FormState } from "@/lib/validators";

export function NewsletterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(subscribeNewsletter, {});
  return (
    <form action={action} className="mt-5">
      <div className="flex h-12 items-center rounded-full border border-white/15 bg-white/5 pr-1.5 pl-5 focus-within:border-brand">
        <input
          type="email"
          name="email"
          required
          placeholder="Your email address"
          aria-label="Email address"
          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
        />
        <button
          disabled={pending}
          className="grid size-9 place-items-center rounded-full bg-brand text-ink transition hover:bg-brand-dark disabled:opacity-60"
          aria-label="Subscribe"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
        </button>
      </div>
      {state.message && <p className={`mt-2 text-xs ${state.ok ? "text-brand" : "text-red-400"}`}>{state.message}</p>}
    </form>
  );
}
