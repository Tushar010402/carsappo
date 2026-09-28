"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/button";

export function SubmitButton({
  children,
  pendingText,
  variant = "primary",
  size = "md",
  className,
  disabled,
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} size={size} className={className} disabled={pending || disabled} aria-busy={pending}>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {pending && pendingText ? pendingText : children}
    </Button>
  );
}
