import { BadgeCheck, Package, Heart, Truck } from "lucide-react";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="container-x grid min-h-[70vh] items-center gap-12 py-12 lg:grid-cols-2 lg:py-20">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-8 text-center text-sm">{footer}</div>}
      </div>
      <div className="relative hidden overflow-hidden rounded-[32px] bg-ink p-12 text-white lg:block">
        <div className="dot-grid absolute inset-0" />
        <div className="absolute -right-24 -bottom-24 size-96 rounded-full bg-brand/25 blur-3xl" />
        <div className="relative">
          <p className="eyebrow text-brand">Carsappo account</p>
          <h2 className="mt-4 text-4xl leading-tight font-semibold">Everything your car needs — in one place.</h2>
          <ul className="mt-10 space-y-5 text-zinc-300">
            {[
              { icon: Package, text: "Track orders and download GST invoices" },
              { icon: Heart, text: "Save products to your wishlist" },
              { icon: Truck, text: "Faster checkout with saved addresses" },
              { icon: BadgeCheck, text: "Member-only coupons and early access" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-white/10">
                  <Icon className="size-5 text-brand" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
