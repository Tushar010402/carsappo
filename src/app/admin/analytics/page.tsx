import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, IndianRupee, ShoppingBag, TicketPercent, TrendingUp, UserPlus } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import { formatINR } from "@/lib/format";
import { analytics, RANGES, type RangeDays } from "@/lib/admin/analytics";
import { param } from "@/lib/admin/query";
import { EmptyRow, Money, PageHeader, Panel, StatCard, TBody, THead, Table, Tabs, Td, Th, Tr } from "@/components/admin/ui";
import { BarList, ColumnChart, SplitBar } from "@/components/admin/charts";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Analytics" };

function Delta({ current, previous }: { current: number; previous: number }) {
  if (!previous) return <span className="text-muted">No data for the prior period</span>;
  const pct = Math.round(((current - previous) / previous) * 100);
  const up = pct >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-0.5 font-medium", up ? "text-success" : "text-danger")}>
      <Icon className="size-3.5" aria-hidden />
      {up ? "+" : ""}
      {pct}% <span className="font-normal text-muted">vs prior period</span>
    </span>
  );
}

const wholeINR = (paise: number) => formatINR(Math.round(paise / 100) * 100);

const compactINR = (paise: number) => {
  const r = paise / 100;
  if (r >= 1e7) return `₹${(r / 1e7).toFixed(1)}Cr`;
  if (r >= 1e5) return `₹${(r / 1e5).toFixed(1)}L`;
  if (r >= 1e3) return `₹${(r / 1e3).toFixed(r >= 1e4 ? 0 : 1)}k`;
  return `₹${Math.round(r)}`;
};

const dayLabel = (ymd: string, days: number) => {
  const d = new Date(`${ymd}T00:00:00Z`);
  return days <= 7
    ? d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", timeZone: "UTC" })
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
};

export default async function AnalyticsPage({ searchParams }: PageProps<"/admin/analytics">) {
  await requireAdmin();
  const sp = await searchParams;
  const raw = Number(param(sp, "range"));
  const days: RangeDays = (RANGES as readonly number[]).includes(raw) ? (raw as RangeDays) : 30;
  const a = await analytics(days);
  const discountShare = a.current.revenue ? Math.round((a.current.discount / (a.current.revenue + a.current.discount)) * 100) : 0;

  return (
    <>
      <PageHeader title="Analytics" description="Revenue counts paid orders plus live (not cancelled) COD orders. Dates are in IST." />
      <Tabs items={RANGES.map((r) => ({ href: `/admin/analytics?range=${r}`, label: `Last ${r} days`, active: r === days }))} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Revenue" value={wholeINR(a.current.revenue)} icon={<IndianRupee className="size-4" />} tone="brand" hint={<Delta current={a.current.revenue} previous={a.previous.revenue} />} />
        <StatCard label="Orders (revenue)" value={a.current.orders} icon={<ShoppingBag className="size-4" />} hint={<Delta current={a.current.orders} previous={a.previous.orders} />} />
        <StatCard label="Average order value" value={wholeINR(a.current.aov)} icon={<TrendingUp className="size-4" />} hint={<Delta current={a.current.aov} previous={a.previous.aov} />} />
        <StatCard label="New customers" value={a.newCustomers} icon={<UserPlus className="size-4" />} hint={<Delta current={a.newCustomers} previous={a.prevCustomers} />} />
        <StatCard label="Discounts given" value={wholeINR(a.current.discount)} icon={<TicketPercent className="size-4" />} hint={`${discountShare}% of gross order value`} />
      </div>

      <Panel title="Revenue by day" description={`${a.allOrders} orders placed in total (all statuses) in the last ${days} days`} className="mb-6">
        <ColumnChart
          label={`Revenue per day, last ${days} days`}
          format={compactINR}
          height={240}
          data={a.daily.map((d) => ({
            key: d.day,
            label: dayLabel(d.day, days),
            value: d.revenue,
            detail: `${d.orders} order${d.orders === 1 ? "" : "s"}`,
          }))}
        />
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-xs font-semibold text-muted hover:text-ink">Show as table</summary>
          <div className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-mist text-left text-[11px] tracking-wider text-muted uppercase">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2 text-right">Orders</th>
                  <th className="px-3 py-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {[...a.daily].reverse().map((d) => (
                  <tr key={d.day}>
                    <td className="px-3 py-1.5">{dayLabel(d.day, 30)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{d.orders}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{formatINR(d.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </Panel>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Orders by status" description="All orders placed in the period">
          <BarList
            format={(v) => String(v)}
            items={a.byStatus.map((s) => ({
              key: s.status,
              label: (
                <Link href={`/admin/orders?status=${s.status}`} className="hover:underline">
                  {ORDER_STATUS_LABEL[s.status]}
                </Link>
              ),
              value: s.count,
              secondary: compactINR(s.total),
            }))}
          />
        </Panel>
        <Panel title="Payment methods" description="Share of revenue">
          <SplitBar
            format={wholeINR}
            parts={(["RAZORPAY", "COD"] as const).map((m) => {
              const row = a.byMethod.find((x) => x.method === m);
              return { key: m, label: m === "COD" ? "Cash on delivery" : "Online (Razorpay)", value: row?.total ?? 0, detail: `${row?.count ?? 0} orders` };
            })}
          />
        </Panel>
        <Panel title="Revenue by category" description="Line items before order-level discounts">
          <BarList format={compactINR} items={a.byCategory.map((c) => ({ key: c.name, label: c.name, value: c.revenue, secondary: `${c.units} units` }))} />
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Panel title="Top 10 products" description="By revenue (line totals, GST inclusive)" flush>
          <Table minWidth={560}>
            <THead>
              <Th>#</Th>
              <Th>Product</Th>
              <Th align="right">Units</Th>
              <Th align="right">Revenue</Th>
            </THead>
            <TBody>
              {a.topProducts.length === 0 && <EmptyRow colSpan={4}>No sales in this period.</EmptyRow>}
              {a.topProducts.map((p, i) => (
                <Tr key={`${p.productId}-${p.name}`}>
                  <Td className="w-10 text-muted tabular-nums">{i + 1}</Td>
                  <Td>
                    {p.productId ? (
                      <Link href={`/admin/products/${p.productId}`} className="font-medium hover:underline">
                        {p.name}
                      </Link>
                    ) : (
                      <span className="font-medium">{p.name}</span>
                    )}
                  </Td>
                  <Td align="right">{p.units}</Td>
                  <Td align="right">
                    <Money paise={p.revenue} className="font-medium" />
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Panel>
        <Panel title="Coupon usage" description="Coupons redeemed on confirmed orders" flush>
          <Table minWidth={360}>
            <THead>
              <Th>Code</Th>
              <Th align="right">Uses</Th>
              <Th align="right">Discount</Th>
              <Th align="right">Order value</Th>
            </THead>
            <TBody>
              {a.coupons.length === 0 && <EmptyRow colSpan={4}>No coupons used in this period.</EmptyRow>}
              {a.coupons.map((c) => (
                <Tr key={c.code}>
                  <Td>
                    <span className="font-mono text-[13px] font-semibold">{c.code}</span>
                  </Td>
                  <Td align="right">{c.uses}</Td>
                  <Td align="right">
                    <Money paise={c.discount} />
                  </Td>
                  <Td align="right">
                    <Money paise={c.revenue} />
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </Panel>
      </div>
    </>
  );
}
