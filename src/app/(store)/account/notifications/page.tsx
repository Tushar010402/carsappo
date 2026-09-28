import type { Metadata } from "next";
import Link from "next/link";
import { Bell } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { markAllNotificationsRead } from "@/app/actions/account";
import { formatDateTime } from "@/lib/format";
import { EmptyState } from "@/components/ui/container";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser("/account/notifications");
  const notifications = await prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 100 });
  const unread = notifications.some((n) => !n.isRead);
  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">Notifications</h1>
        {unread && (
          <form action={markAllNotificationsRead}>
            <button className="text-sm font-semibold underline">Mark all as read</button>
          </form>
        )}
      </div>
      {notifications.length === 0 ? (
        <EmptyState icon={<Bell className="size-6" />} title="You're all caught up" description="Order updates and offers will appear here." />
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {notifications.map((n) => {
            const body = (
              <>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  {!n.isRead && <span className="size-2 rounded-full bg-brand-dark" aria-label="Unread" />}
                  {n.title}
                </p>
                <p className="mt-1 text-sm text-muted">{n.body}</p>
                <p className="mt-1 text-xs text-muted">{formatDateTime(n.createdAt)}</p>
              </>
            );
            return (
              <li key={n.id} className={cn("p-5", !n.isRead && "bg-brand-soft/40")}>
                {n.link ? (
                  <Link href={n.link} className="block">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
