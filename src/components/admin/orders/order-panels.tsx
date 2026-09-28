import type { Order, OrderStatus } from "@prisma/client";
import { Ban, CheckCircle2, ExternalLink, FileDown, PackagePlus, RefreshCw, ScanBarcode, Truck } from "lucide-react";
import { ORDER_STATUS_LABEL } from "@/lib/constants";
import { formatINR } from "@/lib/format";
import {
  assignShipmentAwb,
  cancelShipment,
  createShipment,
  generateShipmentLabel,
  markCodPaid,
  markOnlinePaid,
  refundOrder,
  requestShipmentPickup,
  saveAdminNote,
  saveShippingDetails,
  syncShipmentTracking,
  updateOrderStatus,
} from "@/app/admin/_actions/orders";
import { ActionButton } from "@/components/admin/action-button";
import { AdminForm, FormError, FormField, FormSubmit } from "@/components/admin/form";
import { Callout, KeyValues, MoneyInput, Panel, Toggle } from "@/components/admin/ui";
import { PaymentBadge } from "@/components/admin/status-badge";
import { buttonClasses } from "@/components/ui/button";

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PROCESSING",
  PROCESSING: "SHIPPED",
  SHIPPED: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
};

export function StatusPanel({ order }: { order: Order }) {
  const suggested = NEXT_STATUS[order.status] ?? order.status;
  const statuses = (Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).filter((s) => s !== "PENDING" || order.status === "PENDING");
  return (
    <Panel title="Update status" description={`Currently: ${ORDER_STATUS_LABEL[order.status]}`}>
      <AdminForm action={updateOrderStatus} className="space-y-3">
        <input type="hidden" name="orderId" value={order.id} />
        <FormField name="status" label="New status">
          <select id="status" name="status" className="field" defaultValue={suggested} key={order.status}>
            {statuses.map((s) => (
              <option key={s} value={s} disabled={s === order.status}>
                {ORDER_STATUS_LABEL[s]}
                {s === order.status ? " (current)" : ""}
              </option>
            ))}
          </select>
        </FormField>
        <FormField name="note" label="Note (optional)" hint="Shown in the order timeline to the customer.">
          <input id="note" name="note" className="field" placeholder="e.g. Packed with complimentary microfiber" maxLength={500} />
        </FormField>
        <Toggle name="notify" label="Notify customer" description="Email + account notification" defaultChecked />
        {order.paymentMethod === "RAZORPAY" && order.paymentStatus === "PAID" && (
          <p className="text-xs text-muted">Cancelling a paid order does not refund it automatically — use Refund in the payment panel.</p>
        )}
        <FormError />
        <FormSubmit className="w-full">Update status</FormSubmit>
      </AdminForm>
    </Panel>
  );
}

export function PaymentPanel({ order, razorpayConfigured }: { order: Order; razorpayConfigured: boolean }) {
  const refundable = order.total - order.refundedAmount;
  const canRefund = order.paymentStatus === "PAID" && refundable > 0;
  return (
    <Panel title="Payment" actions={<PaymentBadge status={order.paymentStatus} method={order.paymentMethod} />}>
      <KeyValues
        items={[
          ["Method", order.paymentMethod === "COD" ? "Cash on delivery" : "Online (Razorpay)"],
          ["Amount", <b key="a">{formatINR(order.total, true)}</b>],
          ...(order.refundedAmount > 0 ? ([["Refunded", <span key="rf" className="font-medium text-danger">−{formatINR(order.refundedAmount, true)}</span>]] as [string, React.ReactNode][]) : []),
          ...(order.razorpayOrderId ? ([["Razorpay order", <span key="ro" className="font-mono text-xs">{order.razorpayOrderId}</span>]] as [string, React.ReactNode][]) : []),
          ...(order.razorpayPaymentId ? ([["Payment ID", <span key="rp" className="font-mono text-xs">{order.razorpayPaymentId}</span>]] as [string, React.ReactNode][]) : []),
        ]}
      />

      {order.status === "PENDING" && order.paymentMethod === "RAZORPAY" && (
        <Callout tone="warning" title="Awaiting payment" className="mt-4">
          <p>The customer hasn&apos;t completed payment{order.paymentStatus === "FAILED" ? " (last attempt failed)" : ""}. Stock is not reserved and no invoice exists yet. It confirms automatically when Razorpay reports the payment.</p>
          <p className="mt-1">Only if you&apos;ve verified the payment in the Razorpay dashboard:</p>
          <div className="mt-2">
            <ActionButton action={markOnlinePaid.bind(null, order.id)} variant="dark" confirm="Mark this order as paid and confirm it? Only do this after verifying the payment in Razorpay.">
              <CheckCircle2 className="size-4" /> Mark paid &amp; confirm
            </ActionButton>
          </div>
        </Callout>
      )}

      {order.paymentMethod === "COD" && order.paymentStatus === "PENDING" && order.status !== "CANCELLED" && (
        <div className="mt-4 rounded-xl bg-mist p-3">
          <p className="text-sm">Collect {formatINR(order.total)} on delivery.</p>
          <ActionButton action={markCodPaid.bind(null, order.id)} variant="dark" className="mt-2" confirm={`Confirm ${formatINR(order.total)} cash was received for ${order.orderNumber}?`}>
            <CheckCircle2 className="size-4" /> Mark COD as paid
          </ActionButton>
        </div>
      )}

      {canRefund && (
        <details className="group mt-4 rounded-xl border border-line">
          <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-sm font-semibold">
            Refund
            <span className="text-xs font-normal text-muted group-open:hidden">Full or partial</span>
          </summary>
          <AdminForm action={refundOrder} className="space-y-3 border-t border-line p-3" confirm="Issue this refund? This cannot be undone.">
            <input type="hidden" name="orderId" value={order.id} />
            <FormField name="amount" label="Amount" hint={`Leave empty to refund the full ${order.refundedAmount > 0 ? "remaining " : ""}${formatINR(refundable)}.`}>
              <MoneyInput id="amount" name="amount" max={order.total / 100} placeholder={String(order.total / 100)} />
            </FormField>
            <FormField name="reason" label="Reason (internal)">
              <input id="reason" name="reason" className="field" maxLength={300} placeholder="e.g. Damaged item, partial return" />
            </FormField>
            {order.paymentMethod === "RAZORPAY" && order.razorpayPaymentId && razorpayConfigured ? (
              <Toggle name="manual" label="Record only" description="Refund already issued outside Razorpay — just record it" />
            ) : (
              <>
                <input type="hidden" name="manual" value="on" />
                <p className="text-xs text-muted">
                  {order.paymentMethod === "COD"
                    ? "COD refunds are paid by bank transfer / UPI. This records the refund on the order."
                    : "Razorpay isn't configured, so this only records a refund you issued yourself."}
                </p>
              </>
            )}
            <FormError />
            <FormSubmit variant="danger" className="w-full">
              Refund
            </FormSubmit>
          </AdminForm>
        </details>
      )}
    </Panel>
  );
}

export function ShippingPanel({ order, shiprocketConfigured }: { order: Order; shiprocketConfigured: boolean }) {
  const shippable = !["PENDING", "CANCELLED", "RETURNED"].includes(order.status);
  return (
    <Panel title="Shipping" description={order.courierName ? `${order.courierName}${order.awbCode ? ` · AWB ${order.awbCode}` : ""}` : "Not shipped yet"}>
      <div className="space-y-4">
        {shiprocketConfigured ? (
          <div className="space-y-3">
            <KeyValues
              items={[
                ["Shiprocket order", order.shiprocketOrderId ?? "—"],
                ["Shipment ID", order.shipmentId ?? "—"],
                ["AWB", order.awbCode ?? "—"],
              ]}
            />
            <div className="flex flex-wrap gap-2">
              {!order.shiprocketOrderId && (
                <ActionButton action={createShipment.bind(null, order.id)} variant="dark" disabled={!shippable}>
                  <PackagePlus className="size-4" /> Create shipment
                </ActionButton>
              )}
              {order.shipmentId && !order.awbCode && (
                <ActionButton action={assignShipmentAwb.bind(null, order.id)} variant="dark">
                  <ScanBarcode className="size-4" /> Assign AWB
                </ActionButton>
              )}
              {order.shipmentId && order.awbCode && (
                <>
                  <ActionButton action={requestShipmentPickup.bind(null, order.id)}>
                    <Truck className="size-4" /> Request pickup
                  </ActionButton>
                  <ActionButton action={generateShipmentLabel.bind(null, order.id)}>
                    <FileDown className="size-4" /> {order.labelUrl ? "Regenerate label" : "Generate label"}
                  </ActionButton>
                </>
              )}
              {order.awbCode && (
                <ActionButton action={syncShipmentTracking.bind(null, order.id)}>
                  <RefreshCw className="size-4" /> Sync tracking
                </ActionButton>
              )}
              {order.shiprocketOrderId && (
                <ActionButton action={cancelShipment.bind(null, order.id)} variant="ghost" className="text-red-600" confirm="Cancel this Shiprocket shipment?">
                  <Ban className="size-4" /> Cancel shipment
                </ActionButton>
              )}
            </div>
            {!shippable && !order.shiprocketOrderId && <p className="text-xs text-muted">Shipments can be created once the order is confirmed.</p>}
          </div>
        ) : (
          <Callout tone="info" title="Shiprocket not connected">
            Set <code className="rounded bg-white/70 px-1">SHIPROCKET_EMAIL</code> and <code className="rounded bg-white/70 px-1">SHIPROCKET_PASSWORD</code> (an API user from
            Shiprocket → Settings → API) in the server environment to create shipments, assign AWBs and sync tracking from here. Until then, enter courier details
            manually below.
          </Callout>
        )}

        <div className="flex flex-wrap gap-2">
          {order.labelUrl && (
            <a href={order.labelUrl} target="_blank" rel="noopener noreferrer" className={buttonClasses("outline", "sm")}>
              <FileDown className="size-4" /> Download label
            </a>
          )}
          {order.trackingUrl && (
            <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className={buttonClasses("outline", "sm")}>
              <ExternalLink className="size-4" /> Track shipment
            </a>
          )}
        </div>

        <details className="group rounded-xl border border-line" open={!shiprocketConfigured && shippable && !order.awbCode}>
          <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-sm font-semibold">
            Courier details (manual)
            <span className="text-xs font-normal text-muted">Edit</span>
          </summary>
          <AdminForm key={order.updatedAt.toISOString()} action={saveShippingDetails} className="space-y-3 border-t border-line p-3">
            <input type="hidden" name="orderId" value={order.id} />
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField name="courierName" label="Courier">
                <input id="courierName" name="courierName" className="field" defaultValue={order.courierName ?? ""} placeholder="Delhivery" />
              </FormField>
              <FormField name="awbCode" label="AWB / tracking no.">
                <input id="awbCode" name="awbCode" className="field font-mono text-[13px]" defaultValue={order.awbCode ?? ""} />
              </FormField>
            </div>
            <FormField name="trackingUrl" label="Tracking URL">
              <input id="trackingUrl" name="trackingUrl" className="field" defaultValue={order.trackingUrl ?? ""} placeholder="https://…" />
            </FormField>
            <FormField name="estimatedDelivery" label="Estimated delivery">
              <input
                id="estimatedDelivery"
                name="estimatedDelivery"
                type="date"
                className="field"
                defaultValue={order.estimatedDelivery ? order.estimatedDelivery.toISOString().slice(0, 10) : ""}
              />
            </FormField>
            {["CONFIRMED", "PROCESSING"].includes(order.status) && (
              <Toggle name="markShipped" label="Also mark as shipped" description="Moves the order to Shipped and notifies the customer" />
            )}
            <FormError />
            <FormSubmit size="sm">Save courier details</FormSubmit>
          </AdminForm>
        </details>
      </div>
    </Panel>
  );
}

export function AdminNotePanel({ order }: { order: Order }) {
  return (
    <Panel title="Internal note" description="Only visible to admins. Refunds and payment changes are logged here automatically.">
      <AdminForm key={order.updatedAt.toISOString()} action={saveAdminNote} className="space-y-3">
        <input type="hidden" name="orderId" value={order.id} />
        <FormField name="adminNote">
          <textarea id="adminNote" name="adminNote" className="field min-h-28 text-[13px]" defaultValue={order.adminNote ?? ""} maxLength={5000} />
        </FormField>
        <FormSubmit size="sm" variant="outline">
          Save note
        </FormSubmit>
      </AdminForm>
    </Panel>
  );
}
