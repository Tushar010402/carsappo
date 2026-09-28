import type { Metadata } from "next";
import type { Coupon } from "@prisma/client";
import { Pencil, Plus, Power, PowerOff, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { describeCoupon } from "@/lib/coupons";
import { formatDateTime, paiseToRupees } from "@/lib/format";
import { toIstInput } from "@/lib/admin/query";
import { deleteCoupon, setCouponActive } from "@/app/admin/_actions/coupons";
import { EmptyRow, PageHeader, Panel, TBody, THead, Table, Td, Th, Tr } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-button";
import { FormDialog } from "@/components/admin/dialog";
import { CouponForm, type CouponFormValues } from "@/components/admin/coupon-form";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Coupons" };

const EMPTY: CouponFormValues = {
  code: "",
  description: "",
  type: "PERCENT",
  value: "10",
  minOrder: "0",
  maxDiscount: "",
  usageLimit: "",
  perUserLimit: "1",
  startsAt: "",
  expiresAt: "",
  isActive: true,
  isPublic: false,
};

function toForm(c: Coupon): CouponFormValues {
  return {
    id: c.id,
    code: c.code,
    description: c.description ?? "",
    type: c.type,
    value: String(c.type === "PERCENT" ? c.value : paiseToRupees(c.value)),
    minOrder: String(paiseToRupees(c.minOrder)),
    maxDiscount: c.maxDiscount ? String(paiseToRupees(c.maxDiscount)) : "",
    usageLimit: c.usageLimit ? String(c.usageLimit) : "",
    perUserLimit: c.perUserLimit ? String(c.perUserLimit) : "",
    startsAt: toIstInput(c.startsAt),
    expiresAt: toIstInput(c.expiresAt),
    isActive: c.isActive,
    isPublic: c.isPublic,
  };
}

function couponState(c: Coupon, now: Date) {
  if (!c.isActive) return <Badge tone="soft">Inactive</Badge>;
  if (c.expiresAt && c.expiresAt < now) return <Badge tone="danger">Expired</Badge>;
  if (c.startsAt && c.startsAt > now) return <Badge tone="info">Scheduled</Badge>;
  if (c.usageLimit !== null && c.usedCount >= c.usageLimit) return <Badge tone="warning">Used up</Badge>;
  return <Badge tone="success">Live</Badge>;
}

export default async function CouponsPage() {
  await requireAdmin();
  const coupons = await prisma.coupon.findMany({ orderBy: [{ isActive: "desc" }, { createdAt: "desc" }] });
  const now = new Date();

  return (
    <>
      <PageHeader
        title="Coupons"
        description="Discount codes customers can apply in the cart. Usage counts update when an order is confirmed."
        actions={
          <FormDialog trigger={<><Plus className="size-4" /> New coupon</>} triggerVariant="primary" title="New coupon" size="lg">
            <CouponForm coupon={EMPTY} />
          </FormDialog>
        }
      />
      <Panel flush>
        <Table minWidth={900}>
          <THead>
            <Th>Code</Th>
            <Th>Offer</Th>
            <Th align="right">Used</Th>
            <Th>Validity</Th>
            <Th>Status</Th>
            <Th>
              <span className="sr-only">Actions</span>
            </Th>
          </THead>
          <TBody>
            {coupons.length === 0 && <EmptyRow colSpan={6}>No coupons yet.</EmptyRow>}
            {coupons.map((c) => (
              <Tr key={c.id}>
                <Td>
                  <span className="rounded-md border border-dashed border-ink/30 bg-brand-soft px-2 py-1 font-mono text-[13px] font-semibold">{c.code}</span>
                  {c.isPublic && (
                    <Badge tone="info" className="ml-2">
                      Public
                    </Badge>
                  )}
                </Td>
                <Td>
                  <span className="block">{describeCoupon(c)}</span>
                  {c.description && <span className="block max-w-72 truncate text-xs text-muted">{c.description}</span>}
                </Td>
                <Td align="right">
                  {c.usedCount}
                  {c.usageLimit !== null && <span className="text-muted"> / {c.usageLimit}</span>}
                  {c.perUserLimit !== null && <span className="block text-[11px] text-muted">{c.perUserLimit} per customer</span>}
                </Td>
                <Td className="text-xs text-muted">
                  {c.startsAt ? `From ${formatDateTime(c.startsAt)}` : "From creation"}
                  <br />
                  {c.expiresAt ? `Until ${formatDateTime(c.expiresAt)}` : "No expiry"}
                </Td>
                <Td>{couponState(c, now)}</Td>
                <Td align="right">
                  <div className="flex justify-end gap-0.5">
                    <ActionButton action={setCouponActive.bind(null, c.id, !c.isActive)} variant="icon" label={c.isActive ? `Deactivate ${c.code}` : `Activate ${c.code}`}>
                      {c.isActive ? <PowerOff className="size-4" /> : <Power className="size-4" />}
                    </ActionButton>
                    <FormDialog trigger={<Pencil className="size-4" />} triggerVariant="icon" triggerLabel={`Edit ${c.code}`} title={`Edit ${c.code}`} size="lg">
                      <CouponForm coupon={toForm(c)} />
                    </FormDialog>
                    <ActionButton action={deleteCoupon.bind(null, c.id)} variant="icon-danger" label={`Delete ${c.code}`} confirm={`Delete coupon ${c.code}?`}>
                      <Trash2 className="size-4" />
                    </ActionButton>
                  </div>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Panel>
    </>
  );
}
