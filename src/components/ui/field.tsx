import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  error,
  hint,
  children,
  className,
  htmlFor,
}: {
  label?: ReactNode;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={className}>
      {label && (
        <label className="label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, invalid, ...props }: ComponentProps<"input"> & { invalid?: boolean }) {
  return <input className={cn("field", invalid && "border-danger focus:ring-danger/20", className)} aria-invalid={invalid || undefined} {...props} />;
}

export function Textarea({ className, invalid, ...props }: ComponentProps<"textarea"> & { invalid?: boolean }) {
  return <textarea className={cn("field min-h-28", invalid && "border-danger", className)} aria-invalid={invalid || undefined} {...props} />;
}

export function Select({ className, invalid, children, ...props }: ComponentProps<"select"> & { invalid?: boolean }) {
  return (
    <select
      className={cn(
        "field appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%236b6b73' stroke-width='2' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-[right_0.75rem_center] bg-no-repeat pr-9",
        invalid && "border-danger",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    >
      {children}
    </select>
  );
}

export function Checkbox({ label, className, ...props }: ComponentProps<"input"> & { label: ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-center gap-2.5 text-sm select-none", className)}>
      <input type="checkbox" className="size-4 rounded border-line accent-ink" {...props} />
      <span>{label}</span>
    </label>
  );
}

export function FormMessage({ state }: { state?: { ok?: boolean; message?: string } }) {
  if (!state?.message) return null;
  return (
    <p
      role="status"
      className={cn(
        "rounded-xl px-4 py-3 text-sm font-medium",
        state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700",
      )}
    >
      {state.message}
    </p>
  );
}
