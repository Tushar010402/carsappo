import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ArrowLeft, CircleAlert, Info, TriangleAlert } from "lucide-react";
import { AdminImage } from "@/components/admin/admin-image";
import { isPreviewableUrl } from "@/components/admin/upload";
import { cn } from "@/lib/utils";

/** Page title row with optional back link, description and actions. */
export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink">
            <ArrowLeft className="size-3.5" aria-hidden /> {back.label}
          </Link>
        )}
        <h1 className="truncate text-2xl font-semibold text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** White panel used for every admin section. */
export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  flush,
  id,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** No body padding (for tables that span edge to edge). */
  flush?: boolean;
  id?: string;
}) {
  return (
    <section id={id} className={cn("rounded-2xl border border-line bg-paper shadow-[0_1px_2px_rgb(0_0_0/0.03)]", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            {title && <h2 className="font-display text-[15px] font-semibold text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn(!flush && "p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

// ───────────────────────── Tables ─────────────────────────

export function Table({ children, className, minWidth = 720 }: { children: ReactNode; className?: string; minWidth?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full border-collapse text-sm", className)} style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-mist/70 text-left text-[11px] font-semibold tracking-wider text-muted uppercase">
      <tr>{children}</tr>
    </thead>
  );
}

export function Th({ children, className, align }: { children?: ReactNode; className?: string; align?: "right" | "center" }) {
  return (
    <th scope="col" className={cn("px-4 py-2.5 font-semibold whitespace-nowrap", align === "right" && "text-right", align === "center" && "text-center", className)}>
      {children}
    </th>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-line">{children}</tbody>;
}

export function Tr({ children, className, ...props }: ComponentProps<"tr">) {
  return (
    <tr className={cn("transition-colors hover:bg-mist/50", className)} {...props}>
      {children}
    </tr>
  );
}

export function Td({ children, className, align, colSpan }: { children?: ReactNode; className?: string; align?: "right" | "center"; colSpan?: number }) {
  return (
    <td colSpan={colSpan} className={cn("px-4 py-3 align-middle", align === "right" && "text-right tabular-nums", align === "center" && "text-center", className)}>
      {children}
    </td>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-muted">
        {children}
      </td>
    </tr>
  );
}

// ───────────────────────── Stats ─────────────────────────

export function StatCard({
  label,
  value,
  hint,
  icon,
  href,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  href?: string;
  tone?: "default" | "brand" | "warning" | "danger";
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-muted">{label}</p>
        {icon && (
          <span
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-lg",
              tone === "brand" && "bg-brand text-ink",
              tone === "default" && "bg-mist text-ink",
              tone === "warning" && "bg-amber-50 text-amber-700",
              tone === "danger" && "bg-red-50 text-red-600",
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </>
  );
  const cls = "block rounded-2xl border border-line bg-paper p-4 transition";
  return href ? (
    <Link href={href} className={cn(cls, "hover:border-ink/30 hover:shadow-soft")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

// ───────────────────────── Misc ─────────────────────────

/** Link-based tabs that keep state in the URL. */
export function Tabs({ items }: { items: { href: string; label: ReactNode; active: boolean; count?: number }[] }) {
  return (
    <nav className="no-scrollbar -mx-1 mb-5 flex gap-1 overflow-x-auto px-1" aria-label="Tabs">
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.active ? "page" : undefined}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition",
            t.active ? "bg-ink text-white" : "bg-paper text-ink ring-1 ring-line hover:ring-ink/30",
          )}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={cn("rounded-full px-1.5 text-[11px] font-semibold tabular-nums", t.active ? "bg-brand text-ink" : "bg-mist text-muted")}>
              {t.count}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}

export function Callout({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: "info" | "warning" | "danger";
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const Icon = tone === "info" ? Info : tone === "warning" ? TriangleAlert : CircleAlert;
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border px-4 py-3 text-sm",
        tone === "info" && "border-sky-200 bg-sky-50 text-sky-900",
        tone === "warning" && "border-amber-200 bg-amber-50 text-amber-900",
        tone === "danger" && "border-red-200 bg-red-50 text-red-800",
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="leading-relaxed">{children}</div>}
      </div>
    </div>
  );
}

/** Definition list for detail pages. */
export function KeyValues({ items, className }: { items: [ReactNode, ReactNode][]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-[minmax(0,9rem)_1fr] gap-x-4 gap-y-2 text-sm", className)}>
      {items.map(([k, v], i) => (
        <div key={i} className="contents">
          <dt className="text-muted">{k}</dt>
          <dd className="min-w-0 break-words text-ink">{v ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Styled on/off switch backed by a real checkbox (works inside any form). */
export function Toggle({
  name,
  label,
  description,
  defaultChecked,
  className,
  ...props
}: Omit<ComponentProps<"input">, "type"> & { label: ReactNode; description?: ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-start justify-between gap-4 select-none", className)}>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-muted">{description}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" {...props} />
        <span className="h-6 w-10 rounded-full bg-zinc-300 transition peer-checked:bg-ink peer-focus-visible:ring-2 peer-focus-visible:ring-brand" />
        <span className="absolute top-1 left-1 size-4 rounded-full bg-white shadow transition peer-checked:translate-x-4 peer-checked:bg-brand" />
      </span>
    </label>
  );
}

/** Number input with a ₹ prefix (values are entered in rupees). */
export function MoneyInput({ className, ...props }: Omit<ComponentProps<"input">, "type">) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3.5 grid place-items-center text-sm text-muted">₹</span>
      <input type="number" inputMode="decimal" step="0.01" min={0} className={cn("field pl-7 tabular-nums", className)} {...props} />
    </div>
  );
}

export function Thumb({ src, alt = "", size = 40 }: { src?: string | null; alt?: string; size?: number }) {
  return (
    <span className="relative block shrink-0 overflow-hidden rounded-lg border border-line bg-mist" style={{ width: size, height: size }}>
      {src && isPreviewableUrl(src) ? <AdminImage src={src} alt={alt} fill sizes={`${size * 2}px`} className="object-cover" /> : null}
    </span>
  );
}

export function Money({ paise, className }: { paise: number; className?: string }) {
  const rupees = paise / 100;
  const text = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: Number.isInteger(rupees) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rupees);
  return <span className={cn("tabular-nums", className)}>{text}</span>;
}
