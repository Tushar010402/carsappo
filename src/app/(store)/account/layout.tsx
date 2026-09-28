import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logout } from "@/app/actions/auth";
import { AccountNav } from "@/components/account/account-nav";

export const metadata: Metadata = { title: { default: "My account", template: "%s | My account" }, robots: { index: false } };

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const user = await requireUser("/account");
  const unread = await prisma.notification.count({ where: { userId: user.id, isRead: false } });
  return (
    <div className="container-x py-8 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[240px_1fr] lg:gap-12">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-4 hidden items-center gap-3 lg:flex">
            <span className="grid size-11 place-items-center rounded-full bg-brand font-display text-lg font-semibold">{user.name.charAt(0).toUpperCase()}</span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
          </div>
          <AccountNav unread={unread} />
          <form action={logout} className="mt-4 hidden lg:block">
            <button className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-danger hover:bg-red-50">
              <LogOut className="size-4" /> Log out
            </button>
          </form>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
