import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-brand text-ink hover:bg-brand-dark shadow-[inset_0_-2px_0_rgb(0_0_0/0.08)]",
  dark: "bg-ink text-white hover:bg-ink-soft",
  outline: "border border-ink/15 bg-paper text-ink hover:border-ink",
  "outline-light": "border border-white/25 text-white hover:border-white hover:bg-white/5",
  ghost: "text-ink hover:bg-mist",
  danger: "bg-danger text-white hover:bg-red-700",
  whatsapp: "bg-[#25D366] text-white hover:bg-[#1ebe5a]",
} as const;

const sizes = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
  icon: "h-10 w-10",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-display font-semibold whitespace-nowrap transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
