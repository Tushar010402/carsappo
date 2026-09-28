import type { Metadata } from "next";
import { Ticket } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { describeCoupon } from "@/lib/coupons";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { CopyCode } from "@/components/account/copy-code";

export const metadata: Metadata = { title: "Coupons" };

export default async function CouponsPage() {
  const user = await requireUser("/account/coupons");
  const now = new Date();
  const [coupons, usages] = await Promise.all([
    prisma.coupon.findMany({
      where: {
        isActive: true,
        isPublic: true,
        AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.couponUsage.findMany({ where: { OR: [{ userId: user.id }, { email: user.email }] }, include: { coupon: { select: { code: true } } }, orderBy: { createdAt: "desc" } }),
  ]);
  return (
    <div className="space-y-10">
      <div>
        <h1 className="mb-6 text-3xl font-semibold">Coupons</h1>
        {coupons.length === 0 ? (
          <EmptyState icon={<Ticket className="size-6" />} title="No coupons right now" description="Subscribe to our newsletter to hear about new offers first." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {coupons.map((c) => {
              const used = usages.filter((u) => u.couponId === c.id).length;
              const exhausted = c.perUserLimit !== null && used >= c.perUserLimit;
              return (
                <div key={c.id} className="relative overflow-hidden rounded-2xl border border-dashed border-ink/30 bg-brand-soft/50 p-5">
                  <p className="font-display text-2xl font-semibold tracking-wider">{c.code}</p>
                  <p className="mt-1 text-sm">{c.description || describeCoupon(c)}</p>
                  <p className="mt-3 text-xs text-muted">{c.expiresAt ? `Valid till ${formatDate(c.expiresAt)}` : "No expiry"}</p>
                  <div className="mt-4">{exhausted ? <Badge tone="soft">Already used</Badge> : <CopyCode code={c.code} />}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {usages.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Used coupons</h2>
          <ul className="divide-y divide-line rounded-2xl border border-line text-sm">
            {usages.map((u) => (
              <li key={u.id} className="flex justify-between px-4 py-3">
                <span className="font-medium">{u.coupon.code}</span>
                <span className="text-muted">{formatDate(u.createdAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
