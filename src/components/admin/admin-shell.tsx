"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Boxes,
  Car,
  ChartColumn,
  CircleHelp,
  ExternalLink,
  FileText,
  Globe,
  House,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  Package,
  PanelsTopLeft,
  Quote,
  ReceiptText,
  RotateCcw,
  Settings,
  ShoppingBag,
  Sparkles,
  Star,
  Tags,
  TicketPercent,
  Truck,
  UserCog,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import type { SidebarCounts } from "@/lib/admin/metrics";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon; badge?: keyof SidebarCounts };

const NAV: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/analytics", label: "Analytics", icon: ChartColumn },
    ],
  },
  {
    heading: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag, badge: "toShip" },
      { href: "/admin/returns", label: "Returns", icon: RotateCcw, badge: "openReturns" },
      { href: "/admin/invoices", label: "GST Invoices", icon: ReceiptText },
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
    ],
  },
  {
    heading: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/categories", label: "Categories & Brands", icon: Tags },
      { href: "/admin/inventory", label: "Inventory", icon: Boxes },
      { href: "/admin/vehicles", label: "Vehicles", icon: Car },
      { href: "/admin/reviews", label: "Reviews", icon: Star, badge: "pendingReviews" },
    ],
  },
  {
    heading: "Website",
    items: [
      { href: "/admin/storefront/home", label: "Homepage", icon: House },
      { href: "/admin/storefront/navigation", label: "Menus & footer", icon: PanelsTopLeft },
      { href: "/admin/pages", label: "Pages & policies", icon: FileText },
      { href: "/admin/banners", label: "Banners", icon: ImageIcon },
      { href: "/admin/blog", label: "Blog", icon: Newspaper },
      { href: "/admin/testimonials", label: "Testimonials", icon: Quote },
      { href: "/admin/faqs", label: "FAQs", icon: CircleHelp },
    ],
  },
  {
    heading: "Car cleaning",
    items: [{ href: "/admin/services", label: "Services & Bookings", icon: Sparkles, badge: "newBookings" }],
  },
  {
    heading: "Configuration",
    items: [
      { href: "/admin/shipping", label: "Shipping", icon: Truck },
      { href: "/admin/seo", label: "SEO & Tracking", icon: Globe },
      { href: "/admin/messages", label: "Messages", icon: Inbox, badge: "unreadMessages" },
      { href: "/admin/team", label: "Team", icon: UserCog },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({
  user,
  counts,
  storeName,
  children,
}: {
  user: { name: string; email: string };
  counts: SidebarCounts;
  storeName: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const initials = user.name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen flex-1 bg-mist lg:pl-64">
      {/* Mobile overlay */}
      <div
        className={cn("fixed inset-0 z-40 bg-ink/50 backdrop-blur-[1px] transition-opacity lg:hidden", open ? "opacity-100" : "pointer-events-none opacity-0")}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-ink text-zinc-300 transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-white/10 px-5">
          <Link href="/admin" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <span className="grid size-8 place-items-center rounded-lg bg-brand font-display text-sm font-bold text-ink">C</span>
            <span className="leading-tight">
              <span className="block font-display text-[15px] font-bold tracking-[0.08em] text-white">
                CARS<span className="text-brand">APPO</span>
              </span>
              <span className="block text-[10px] font-semibold tracking-[0.2em] text-zinc-400 uppercase">Admin</span>
            </span>
          </Link>
          <button type="button" className="grid size-8 place-items-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="size-4" />
          </button>
        </div>

        <nav aria-label="Admin navigation" className="flex-1 space-y-5 overflow-y-auto px-3 py-4 [scrollbar-width:thin]">
          {NAV.map((group) => (
            <div key={group.heading}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold tracking-[0.18em] text-zinc-400 uppercase">{group.heading}</p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  const count = item.badge ? counts[item.badge] : 0;
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition",
                          active ? "bg-white/[0.09] text-white" : "hover:bg-white/[0.05] hover:text-white",
                        )}
                      >
                        <Icon className={cn("size-4 shrink-0", active ? "text-brand" : "text-zinc-500 group-hover:text-zinc-300")} aria-hidden />
                        <span className="flex-1 truncate">{item.label}</span>
                        {count > 0 && (
                          <span className="rounded-full bg-brand px-1.5 py-px text-[10px] font-bold text-ink tabular-nums" aria-label={`${count} pending`}>
                            {count > 99 ? "99+" : count}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium hover:bg-white/[0.05] hover:text-white"
          >
            <ExternalLink className="size-4 text-zinc-500" aria-hidden /> Visit {storeName}
          </a>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-paper/90 px-4 backdrop-blur sm:px-6 lg:px-8">
        <button
          type="button"
          className="grid size-9 place-items-center rounded-lg border border-line text-ink hover:bg-mist lg:hidden"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
        >
          <Menu className="size-4" />
        </button>
        <div className="flex-1" />
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-sm font-medium text-ink transition hover:border-ink"
        >
          <ExternalLink className="size-3.5" aria-hidden /> <span className="hidden sm:inline">View store</span>
          <span className="sm:hidden">Store</span>
        </a>
        <div className="flex items-center gap-2.5 border-l border-line pl-3">
          <span className="grid size-9 place-items-center rounded-full bg-ink font-display text-xs font-semibold text-brand" aria-hidden>
            {initials || "A"}
          </span>
          <span className="hidden min-w-0 leading-tight md:block">
            <span className="block max-w-40 truncate text-sm font-semibold text-ink">{user.name}</span>
            <span className="block max-w-40 truncate text-xs text-muted">{user.email}</span>
          </span>
          <form action={logout}>
            <button type="submit" className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-mist hover:text-ink" aria-label="Log out" title="Log out">
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
