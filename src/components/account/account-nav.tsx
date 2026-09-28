"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, FileText, Heart, LayoutGrid, MapPin, Package, RotateCcw, Ticket, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/account", label: "Overview", icon: LayoutGrid },
  { href: "/account/orders", label: "My Orders", icon: Package },
  { href: "/account/track", label: "Track Orders", icon: Truck },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/coupons", label: "Coupons", icon: Ticket },
  { href: "/account/returns", label: "Returns", icon: RotateCcw },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
  { href: "/account/invoices", label: "Invoices", icon: FileText },
];

export function AccountNav({ unread }: { unread: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Account" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-1 lg:px-0">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = href === "/account" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition lg:rounded-xl",
              active ? "bg-ink text-white" : "text-zinc-600 hover:bg-mist hover:text-ink",
            )}
          >
            <Icon className="size-4" />
            {label}
            {label === "Notifications" && unread > 0 && (
              <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-ink">{unread}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
