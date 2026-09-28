"use client";

import { useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/providers/toast";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "@/components/ui/button";
import type { BoundAction } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

const ICON_STYLES = {
  icon: "inline-grid size-8 place-items-center rounded-lg text-muted transition hover:bg-mist hover:text-ink disabled:opacity-50",
  "icon-danger": "inline-grid size-8 place-items-center rounded-lg text-muted transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50",
} as const;

/**
 * One-click server action (delete, approve, toggle…) with optional confirm prompt and toasts.
 * Pass a server action with its arguments bound on the server: `action={deleteX.bind(null, id)}`.
 */
export function ActionButton({
  action,
  children,
  confirm,
  label,
  variant = "outline",
  size = "sm",
  className,
  disabled,
}: {
  action: BoundAction;
  children: ReactNode;
  confirm?: string;
  /** Accessible name (required for icon-only buttons). */
  label?: string;
  variant?: ButtonVariant | keyof typeof ICON_STYLES;
  size?: ButtonSize;
  className?: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const iconOnly = variant === "icon" || variant === "icon-danger";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={pending || disabled}
      aria-busy={pending}
      className={cn(iconOnly ? ICON_STYLES[variant] : buttonClasses(variant as ButtonVariant, size), className)}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        startTransition(async () => {
          try {
            const res = await action();
            if (res?.ok) {
              toast(res.message || "Done");
              if (res.redirectTo) router.push(res.redirectTo);
            } else {
              toast(res?.message || "Action failed", "error");
            }
          } catch (err) {
            console.error(err);
            toast("Something went wrong. Please try again.", "error");
          }
        });
      }}
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {pending && iconOnly ? null : children}
    </button>
  );
}
