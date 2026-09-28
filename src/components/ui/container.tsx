import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  href,
  linkLabel = "View all",
  className,
  dark,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  href?: string;
  linkLabel?: string;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div className={cn("mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className={cn("eyebrow mb-3", dark && "text-brand")}>{eyebrow}</p>}
        <h2 className={cn("text-3xl leading-tight font-semibold sm:text-4xl", dark ? "text-white" : "text-ink")}>{title}</h2>
        {subtitle && <p className={cn("mt-3 text-base", dark ? "text-zinc-400" : "text-muted")}>{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className={cn(
            "group inline-flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap",
            dark ? "text-white" : "text-ink",
          )}
        >
          {linkLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line px-6 py-16 text-center">
      {icon && <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-mist text-ink">{icon}</div>}
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="mt-2 max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
