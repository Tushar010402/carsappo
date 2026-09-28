"use client";

import { createContext, startTransition, useActionState, useContext, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/providers/toast";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useDialog } from "@/components/admin/dialog";
import type { ActionState, FormAction } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

type FormContextValue = { state: ActionState; pending: boolean };

const FormContext = createContext<FormContextValue>({ state: {}, pending: false });

export function useAdminFormState() {
  return useContext(FormContext);
}

/**
 * Client wrapper for admin server actions:
 * - submits via a transition (no automatic React form reset, so input survives validation errors),
 * - shows success / error toasts, closes an enclosing dialog and follows `redirectTo`,
 * - exposes field errors to <FormField> and pending state to <FormSubmit>.
 */
export function AdminForm({
  action,
  children,
  className,
  resetOnSuccess,
  onSuccess,
  id,
  confirm,
}: {
  action: FormAction;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  onSuccess?: (state: ActionState) => void;
  id?: string;
  /** Ask for confirmation before submitting. */
  confirm?: string;
}) {
  const router = useRouter();
  const dialog = useDialog();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, dispatch, pending] = useActionState<ActionState, FormData>(async (prev, formData) => {
    let result: ActionState;
    try {
      result = (await action(prev, formData)) ?? {};
    } catch (err) {
      console.error(err);
      result = { ok: false, message: "Something went wrong. Please refresh and try again." };
    }
    if (result.ok) {
      toast(result.message || "Saved");
      if (resetOnSuccess) formRef.current?.reset();
      dialog?.close();
      onSuccess?.(result);
      if (result.redirectTo) router.push(result.redirectTo);
    } else if (result.message) {
      toast(result.message, "error");
    }
    return result;
  }, {});

  return (
    <FormContext.Provider value={{ state, pending }}>
      <form
        ref={formRef}
        id={id}
        className={className}
        onSubmit={(e) => {
          e.preventDefault();
          if (pending) return;
          if (confirm && !window.confirm(confirm)) return;
          const formData = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter ?? undefined);
          startTransition(() => dispatch(formData));
        }}
      >
        {children}
      </form>
    </FormContext.Provider>
  );
}

/** Label + control + inline error for the field `name`. */
export function FormField({
  name,
  label,
  hint,
  children,
  className,
  htmlFor,
}: {
  name: string;
  label?: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  const { state } = useAdminFormState();
  return (
    <Field label={label} hint={hint} error={state.errors?.[name]} className={className} htmlFor={htmlFor ?? name}>
      {children}
    </Field>
  );
}

export function FormSubmit({
  children,
  variant = "dark",
  size = "md",
  className,
  name,
  value,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useAdminFormState();
  return (
    <Button type="submit" variant={variant} size={size} className={className} disabled={pending} aria-busy={pending} name={name} value={value}>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </Button>
  );
}

/** Form-level error summary (non-field errors). */
export function FormError({ className }: { className?: string }) {
  const { state } = useAdminFormState();
  if (state.ok || !state.message) return null;
  return (
    <p role="alert" className={cn("rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700", className)}>
      {state.message}
    </p>
  );
}

/** Sticky footer row for long forms. */
export function FormActions({ children, className, sticky }: { children: ReactNode; className?: string; sticky?: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-end gap-2",
        sticky && "sticky bottom-0 z-10 -mx-4 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
