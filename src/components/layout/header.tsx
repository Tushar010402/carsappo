"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingBag,
  User,
  X,
  CarFront,
  ArrowRight,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { SmartSearch } from "@/components/layout/smart-search";
import { CategoryIcon } from "@/components/icons/category-icon";
import { useCart, cartCount } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";
import { useGarage, vehicleLabel, vehicleQuery } from "@/store/garage";
import { logout } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

export type NavCategory = { id: string; name: string; slug: string; icon: string | null; description: string | null };

export type HeaderNav = {
  items: { label: string; href: string }[];
  megaPromoTitle: string;
  megaPromoText: string;
  megaPromoLink: string;
};

export function Header({
  categories,
  user,
  announcement,
  logoUrl,
  nav,
}: {
  /** Menu from Admin → Storefront → Navigation; the "/shop" item opens the category mega-menu. */
  nav: HeaderNav;
  categories: NavCategory[];
  user: { name: string; role: "CUSTOMER" | "ADMIN" } | null;
  announcement?: string;
  logoUrl?: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const items = useCart((s) => s.items);
  const cartHydrated = useCart((s) => s.hydrated);
  const openDrawer = useCart((s) => s.openDrawer);
  const wishCount = useWishlist((s) => s.ids.length);
  const wishHydrated = useWishlist((s) => s.hydrated);
  const vehicle = useGarage((s) => s.vehicle);
  const count = cartCount(items);
  const NAV = nav.items.map((i) => ({ ...i, mega: i.href === "/shop" }));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileOpen(false);
    setSearchOpen(false);
    setMegaOpen(false);
    setAccountOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      {announcement && (
        <div className="bg-ink text-white">
          <div className="container-x flex h-9 items-center justify-center gap-2 text-center text-xs font-medium tracking-wide">
            <span className="size-1.5 rounded-full bg-brand" aria-hidden />
            <span className="truncate">{announcement}</span>
          </div>
        </div>
      )}
      <header
        className={cn(
          "sticky top-0 z-40 border-b transition-colors",
          scrolled ? "border-line bg-white/90 backdrop-blur-xl" : "border-transparent bg-white",
        )}
      >
        <div className="container-x flex h-16 items-center gap-3 lg:h-[72px]">
          <button
            className="-ml-2 grid size-10 place-items-center rounded-full hover:bg-mist lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>

          <Logo logoUrl={logoUrl} />

          <nav className="ml-10 hidden items-center gap-1 lg:flex" aria-label="Main">
            {NAV.map((item) =>
              item.mega ? (
                <div key={`${item.href}|${item.label}`} className="relative" onMouseEnter={() => setMegaOpen(true)} onMouseLeave={() => setMegaOpen(false)}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition hover:bg-mist",
                      isActive(item.href) && "text-ink",
                      !isActive(item.href) && "text-zinc-600",
                    )}
                    aria-expanded={megaOpen}
                  >
                    {item.label}
                    <ChevronDown className={cn("size-3.5 transition-transform", megaOpen && "rotate-180")} />
                  </Link>
                  {megaOpen && (
                    <div className="absolute top-full left-0 pt-3">
                      <div className="grid w-[640px] grid-cols-[1fr_220px] gap-2 rounded-3xl border border-line bg-white p-3 shadow-lift">
                        <div className="grid grid-cols-2 gap-1">
                          {categories.map((c) => (
                            <Link key={c.id} href={`/category/${c.slug}`} className="flex items-center gap-3 rounded-2xl p-2.5 hover:bg-mist">
                              <span className="grid size-10 place-items-center rounded-xl bg-mist">
                                <CategoryIcon name={c.icon} className="size-5" />
                              </span>
                              <span className="text-sm font-medium">{c.name}</span>
                            </Link>
                          ))}
                        </div>
                        <div className="flex flex-col justify-between rounded-2xl bg-ink p-5 text-white">
                          <div>
                            <CarFront className="size-7 text-brand" />
                            <p className="mt-3 font-display text-lg leading-snug font-semibold">{nav.megaPromoTitle}</p>
                            <p className="mt-1 text-xs text-zinc-400">{nav.megaPromoText}</p>
                          </div>
                          <Link href="/#shop-by-vehicle" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
                            {nav.megaPromoLink} <ArrowRight className="size-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={`${item.href}|${item.label}`}
                  href={item.href}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-sm font-medium transition hover:bg-mist",
                    isActive(item.href) ? "text-ink" : "text-zinc-600",
                  )}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <button
              className="grid size-10 place-items-center rounded-full hover:bg-mist"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search"
              aria-expanded={searchOpen}
            >
              {searchOpen ? <X className="size-5" /> : <Search className="size-5" />}
            </button>
            <Link href="/wishlist" className="relative grid size-10 place-items-center rounded-full hover:bg-mist" aria-label="Wishlist">
              <Heart className="size-5" />
              {wishHydrated && wishCount > 0 && (
                <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-ink px-1 text-[10px] leading-4 font-bold text-white">
                  {wishCount}
                </span>
              )}
            </Link>
            <button onClick={openDrawer} className="relative grid size-10 place-items-center rounded-full hover:bg-mist" aria-label={`Cart, ${count} items`}>
              <ShoppingBag className="size-5" />
              {cartHydrated && count > 0 && (
                <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] leading-4 font-bold text-ink">
                  {count}
                </span>
              )}
            </button>
            {user ? (
              <div className="relative hidden sm:block" onMouseLeave={() => setAccountOpen(false)}>
                <button
                  onClick={() => setAccountOpen((v) => !v)}
                  onMouseEnter={() => setAccountOpen(true)}
                  className="ml-1 flex h-10 items-center gap-2 rounded-full bg-mist pr-3.5 pl-1.5 text-sm font-medium"
                  aria-expanded={accountOpen}
                >
                  <span className="grid size-7 place-items-center rounded-full bg-ink text-xs font-semibold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  {user.name.split(" ")[0]}
                </button>
                {accountOpen && (
                  <div className="absolute top-full right-0 pt-2">
                    <div className="w-56 rounded-2xl border border-line bg-white p-1.5 shadow-lift">
                      {user.role === "ADMIN" && (
                        <Link href="/admin" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-mist">
                          <LayoutDashboard className="size-4" /> Admin panel
                        </Link>
                      )}
                      <Link href="/account" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-mist">
                        <User className="size-4" /> My account
                      </Link>
                      <Link href="/account/orders" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-mist">
                        <Package className="size-4" /> My orders
                      </Link>
                      <form action={logout}>
                        <button className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-danger hover:bg-red-50">
                          <LogOut className="size-4" /> Log out
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="ml-1 hidden h-10 items-center rounded-full bg-ink px-5 font-display text-sm font-semibold text-white hover:bg-ink-soft sm:inline-flex"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-line bg-white">
            <div className="container-x py-4">
              <SmartSearch autoFocus onNavigate={() => setSearchOpen(false)} />
            </div>
          </div>
        )}
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm animate-fade-up flex-col bg-white shadow-lift">
            <div className="flex h-16 items-center justify-between border-b border-line px-4">
              <Logo logoUrl={logoUrl} />
              <button className="grid size-10 place-items-center rounded-full hover:bg-mist" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-5">
              {vehicle && (
                <Link href={`/shop?${vehicleQuery(vehicle)}`} className="mb-5 flex items-center gap-3 rounded-2xl bg-ink p-4 text-white">
                  <CarFront className="size-5 text-brand" />
                  <span className="text-sm">
                    <span className="block text-xs text-zinc-400">My garage</span>
                    {vehicleLabel(vehicle)}
                  </span>
                </Link>
              )}
              <nav className="flex flex-col" aria-label="Mobile">
                {NAV.map((item) => (
                  <Link
                    key={`${item.href}|${item.label}`}
                    href={item.href}
                    className={cn("rounded-xl px-3 py-3 font-display text-lg font-medium", isActive(item.href) ? "bg-mist" : "")}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <p className="eyebrow mt-6 mb-2 px-3">Categories</p>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((c) => (
                  <Link key={c.id} href={`/category/${c.slug}`} className="flex items-center gap-2 rounded-xl border border-line p-2.5 text-sm">
                    <CategoryIcon name={c.icon} className="size-4 shrink-0" />
                    <span className="truncate">{c.name}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="border-t border-line p-4">
              {user ? (
                <div className="flex gap-2">
                  <Link href={user.role === "ADMIN" ? "/admin" : "/account"} className="flex h-11 flex-1 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
                    {user.role === "ADMIN" ? "Admin panel" : "My account"}
                  </Link>
                  <form action={logout}>
                    <button className="h-11 rounded-full border border-line px-5 text-sm font-semibold">Log out</button>
                  </form>
                </div>
              ) : (
                <Link href="/login" className="flex h-11 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white">
                  Login / Sign up
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
