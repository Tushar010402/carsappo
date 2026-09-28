import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { sidebarCounts } from "@/lib/admin/metrics";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Carsappo Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();
  const [counts, settings] = await Promise.all([sidebarCounts(), getSettings()]);
  return (
    <AdminShell user={{ name: user.name, email: user.email }} counts={counts} storeName={settings.store.name}>
      {children}
    </AdminShell>
  );
}
