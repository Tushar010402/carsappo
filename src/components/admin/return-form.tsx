"use client";

import { useState } from "react";
import type { ReturnStatus } from "@prisma/client";
import { updateReturn } from "@/app/admin/_actions/returns";
import { AdminForm, FormError, FormField, FormSubmit } from "@/components/admin/form";
import { MoneyInput, Toggle } from "@/components/admin/ui";
import { RETURN_STATUS_LABEL } from "@/lib/constants";
import { formatINR } from "@/lib/format";

export function ReturnForm({
  returnId,
  status,
  allowed,
  adminNote,
  orderTotal,
  paid,
  online,
}: {
  returnId: string;
  status: ReturnStatus;
  allowed: ReturnStatus[];
  adminNote: string;
  orderTotal: number;
  paid: boolean;
  online: boolean;
}) {
  const [next, setNext] = useState<ReturnStatus>(allowed[0] ?? status);
  const [refund, setRefund] = useState(paid);
  return (
    <AdminForm action={updateReturn} className="space-y-4">
      <input type="hidden" name="returnId" value={returnId} />
      <FormField name="status" label="Status">
        <select id="status" name="status" className="field" value={next} onChange={(e) => setNext(e.target.value as ReturnStatus)}>
          {[status, ...allowed].map((s) => (
            <option key={s} value={s}>
              {RETURN_STATUS_LABEL[s]}
              {s === status ? " (current)" : ""}
            </option>
          ))}
        </select>
      </FormField>
      {next === "REFUNDED" && next !== status && (
        <div className="space-y-3 rounded-xl border border-line p-3">
          <Toggle
            name="refund"
            label="Refund payment"
            description={
              !paid ? "Order isn't marked paid — nothing to refund." : online ? "Refunds through Razorpay to the original method." : "COD order: records a refund you paid by UPI / bank."
            }
            checked={refund && paid}
            disabled={!paid}
            onChange={(e) => setRefund(e.target.checked)}
          />
          {refund && paid && (
            <FormField name="amount" label="Refund amount" hint={`Empty = full order value (${formatINR(orderTotal)}).`}>
              <MoneyInput id="amount" name="amount" max={orderTotal / 100} placeholder={String(orderTotal / 100)} />
            </FormField>
          )}
          <p className="text-xs text-muted">The order is marked Returned and its items are added back to stock.</p>
        </div>
      )}
      <FormField name="adminNote" label="Note" hint="Internal; included in the customer message when rejecting.">
        <textarea id="adminNote" name="adminNote" className="field min-h-24" defaultValue={adminNote} maxLength={2000} />
      </FormField>
      <FormError />
      <div className="flex justify-end">
        <FormSubmit>Update return</FormSubmit>
      </div>
    </AdminForm>
  );
}
