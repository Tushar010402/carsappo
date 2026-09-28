import type { Metadata } from "next";
import Link from "next/link";
import type { ReturnStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { RETURN_STATUS_LABEL } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { ADMIN_PAGE_SIZE, enumParam, pageParam, withParams } from "@/lib/admin/query";
import { EmptyRow, Money, PageHeader, Panel, TBody, THead, Table, Tabs, Td, Th, Tr } from "@/components/admin/ui";
import { AdminPagination } from "@/components/admin/pagination";
import { FormDialog } from "@/components/admin/dialog";
import { ReturnForm } from "@/components/admin/return-form";
import { OrderStatusBadge, PaymentBadge, ReturnStatusBadge } from "@/components/admin/status-badge";

export const metadata: Metadata = { title: "Returns" };

const STATUSES = Object.keys(RETURN_STATUS_LABEL) as ReturnStatus[];
const NEXT: Record<ReturnStatus, ReturnStatus[]> = {
  REQUESTED: ["APPROVED", "REJECTED"],
  APPROVED: ["PICKED_UP", "REJECTED", "REFUNDED"],
  REJECTED: ["APPROVED"],
  PICKED_UP: ["REFUNDED"],
  REFUNDED: [],
};

export default async function ReturnsPage({ searchParams }: PageProps<"/admin/returns">) {
  await requireAdmin();
  const sp = await searchParams;
  const status = enumParam(sp, "status", STATUSES);
  const page = pageParam(sp);
  const where = status ? { status } : { status: { in: ["REQUESTED", "APPROVED", "PICKED_UP"] as ReturnStatus[] } };
  const showAll = sp.status === "all";

  const [returns, total, counts] = await Promise.all([
    prisma.returnRequest.findMany({
      where: showAll ? {} : where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      include: {
        order: { select: { id: true, orderNumber: true, total: true, status: true, paymentStatus: true, paymentMethod: true, shipName: true, email: true, razorpayPaymentId: true } },
      },
    }),
    prisma.returnRequest.count({ where: showAll ? {} : where }),
    prisma.returnRequest.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const count = (s: ReturnStatus) => counts.find((c) => c.status === s)?._count._all ?? 0;
  const open = count("REQUESTED") + count("APPROVED") + count("PICKED_UP");

  return (
    <>
      <PageHeader title="Returns" description="Customer return requests. Customers are notified on every status change." />
      <Tabs
        items={[
          { href: "/admin/returns", label: "Open", count: open, active: !status && !showAll },
          ...STATUSES.map((s) => ({ href: `/admin/returns?status=${s}`, label: RETURN_STATUS_LABEL[s], count: count(s), active: status === s })),
          { href: "/admin/returns?status=all", label: "All", active: showAll },
        ]}
      />
      <Panel flush>
        <Table minWidth={900}>
          <THead>
            <Th>Order</Th>
            <Th>Customer</Th>
            <Th>Reason</Th>
            <Th align="right">Order value</Th>
            <Th>Payment</Th>
            <Th>Return</Th>
            <Th>
              <span className="sr-only">Actions</span>
            </Th>
          </THead>
          <TBody>
            {returns.length === 0 && <EmptyRow colSpan={7}>No return requests here.</EmptyRow>}
            {returns.map((r) => (
              <Tr key={r.id}>
                <Td>
                  <Link href={`/admin/orders/${r.order.id}`} className="font-semibold hover:underline">
                    {r.order.orderNumber}
                  </Link>
                  <span className="block text-xs text-muted">{formatDateTime(r.createdAt)}</span>
                  <span className="mt-1 block">
                    <OrderStatusBadge status={r.order.status} />
                  </span>
                </Td>
                <Td>
                  {r.order.shipName}
                  <span className="block text-xs text-muted">{r.order.email}</span>
                </Td>
                <Td>
                  <span className="font-medium">{r.reason}</span>
                  {r.details && <span className="block max-w-72 text-xs text-muted">{r.details}</span>}
                  {r.adminNote && <span className="mt-1 block max-w-72 text-xs text-sky-700">Note: {r.adminNote}</span>}
                </Td>
                <Td align="right">
                  <Money paise={r.order.total} />
                </Td>
                <Td>
                  <PaymentBadge status={r.order.paymentStatus} method={r.order.paymentMethod} />
                </Td>
                <Td>
                  <ReturnStatusBadge status={r.status} />
                </Td>
                <Td align="right">
                  <FormDialog trigger="Manage" title={`Return · ${r.order.orderNumber}`} description={r.reason}>
                    <ReturnForm
                      returnId={r.id}
                      status={r.status}
                      allowed={NEXT[r.status]}
                      adminNote={r.adminNote ?? ""}
                      orderTotal={r.order.total}
                      paid={r.order.paymentStatus === "PAID"}
                      online={r.order.paymentMethod === "RAZORPAY" && !!r.order.razorpayPaymentId}
                    />
                  </FormDialog>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
        <AdminPagination page={page} pageSize={ADMIN_PAGE_SIZE} total={total} hrefFor={(n) => withParams("/admin/returns", sp, { page: n })} />
      </Panel>
    </>
  );
}
