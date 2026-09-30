import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { razorpayEnabled } from "@/lib/razorpay";
import { shiprocketEnabled } from "@/lib/shiprocket";
import { formatDateTime, paiseToRupees } from "@/lib/format";
import { saveShippingSettings } from "@/app/admin/_actions/settings";
import { saveDeliveryZones } from "@/app/admin/_actions/content";
import { EmptyRow, PageHeader, Panel, TBody, THead, Table, Td, Th, Toggle, Tr } from "@/components/admin/ui";
import { AdminForm, FormError, FormField, FormSubmit } from "@/components/admin/form";
import { RowsEditor } from "@/components/admin/list-editor";
import { MoneyInput } from "@/components/admin/ui";
import { OrderStatusBadge } from "@/components/admin/status-badge";

export const metadata: Metadata = { title: "Shipping" };

function Integration({ name, configured, env, note }: { name: string; configured: boolean; env: string[]; note: string }) {
  return (
    <li className="flex gap-3 py-3">
      {configured ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" /> : <CircleDashed className="mt-0.5 size-5 shrink-0 text-muted" />}
      <div className="min-w-0 text-sm">
        <p className="font-semibold">
          {name} · <span className={configured ? "text-success" : "text-muted"}>{configured ? "Connected" : "Not configured"}</span>
        </p>
        <p className="text-muted">{note}</p>
        {!configured && (
          <p className="mt-1 text-xs text-muted">
            Set {env.map((e, i) => (
              <span key={e}>
                {i > 0 && (i === env.length - 1 ? " and " : ", ")}
                <code className="rounded bg-mist px-1 py-0.5 text-ink">{e}</code>
              </span>
            ))}{" "}
            in the server environment, then restart.
          </p>
        )}
      </div>
    </li>
  );
}

export default async function ShippingPage() {
  await requireAdmin();
  const [{ shipping, store, delivery }, shipments] = await Promise.all([
    getSettings(),
    prisma.order.findMany({
      where: { awbCode: { not: null } },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { id: true, orderNumber: true, shipName: true, shipCity: true, courierName: true, awbCode: true, trackingUrl: true, status: true, updatedAt: true },
    }),
  ]);

  return (
    <>
      <PageHeader title="Shipping" description="Delivery charges, Cash on Delivery rules, delivery zones and courier integration." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Panel title="Shipping rules" description="Amounts in rupees (GST inclusive).">
          <AdminForm action={saveShippingSettings} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField name="freeShippingThreshold" label="Free shipping above" hint="Orders at or above this subtotal ship free. 0 = always free.">
                <MoneyInput id="freeShippingThreshold" name="freeShippingThreshold" defaultValue={paiseToRupees(shipping.freeShippingThreshold)} required />
              </FormField>
              <FormField name="flatShippingFee" label="Flat shipping fee" hint="Charged below the free-shipping threshold.">
                <MoneyInput id="flatShippingFee" name="flatShippingFee" defaultValue={paiseToRupees(shipping.flatShippingFee)} required />
              </FormField>
            </div>
            <div className="space-y-4 rounded-xl border border-line p-4">
              <Toggle name="codEnabled" label="Cash on Delivery" description="Offer COD at checkout" defaultChecked={shipping.codEnabled} />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField name="codFee" label="COD handling fee">
                  <MoneyInput id="codFee" name="codFee" defaultValue={paiseToRupees(shipping.codFee)} required />
                </FormField>
                <FormField name="codMaxOrder" label="Max order value for COD" hint="Larger orders must pay online.">
                  <MoneyInput id="codMaxOrder" name="codMaxOrder" defaultValue={paiseToRupees(shipping.codMaxOrder)} required />
                </FormField>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField name="dispatchDays" label="Dispatch time (days)" hint="Added to courier estimates.">
                <input id="dispatchDays" name="dispatchDays" type="number" min={0} max={30} className="field" defaultValue={shipping.dispatchDays} required />
              </FormField>
              <FormField name="returnWindowDays" label="Return window (days)" hint="After delivery.">
                <input id="returnWindowDays" name="returnWindowDays" type="number" min={0} max={90} className="field" defaultValue={shipping.returnWindowDays} required />
              </FormField>
              <FormField name="shiprocketPickupLocation" label="Shiprocket pickup location" hint="Exact nickname from Shiprocket → Pickup addresses.">
                <input id="shiprocketPickupLocation" name="shiprocketPickupLocation" className="field" defaultValue={shipping.shiprocketPickupLocation} required maxLength={80} />
              </FormField>
            </div>
            <FormError />
            <div className="flex justify-end">
              <FormSubmit>Save shipping settings</FormSubmit>
            </div>
          </AdminForm>
        </Panel>

        <Panel title="Integrations" description="Credentials live in environment variables, never in the database.">
          <ul className="divide-y divide-line">
            <Integration
              name="Shiprocket"
              configured={shiprocketEnabled()}
              env={["SHIPROCKET_EMAIL", "SHIPROCKET_PASSWORD"]}
              note={`Creates shipments, assigns AWBs, pickups, labels and live tracking. Pickup pincode: ${store.pincode || "—"} (Settings → Store).`}
            />
            <Integration
              name="Razorpay"
              configured={razorpayEnabled()}
              env={["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"]}
              note="Online payments (UPI, cards, netbanking, wallets) and refunds. Configure the webhook at /api/webhooks/razorpay."
            />
          </ul>
        </Panel>
      </div>

      <Panel
        title="Delivery zones"
        description="Delivery estimates shown on product pages, the cart and the shipping policy. A pincode uses the zone with the longest matching prefix; everything else falls under the last row."
        className="mt-6"
        id="zones"
      >
        <AdminForm action={saveDeliveryZones} className="space-y-4">
          <FormField name="zones" hint="Prefixes are the first 1–6 digits of a pincode, separated by commas (e.g. 110, 201). Days are counted after dispatch.">
            <RowsEditor
              name="zones"
              defaultValue={delivery.zones.map((z) => ({ ...z, minDays: String(z.minDays), maxDays: String(z.maxDays) }))}
              addLabel="Add zone"
              max={20}
              columns="sm:grid-cols-[minmax(0,1.3fr)_minmax(0,2.5fr)_5.5rem_5.5rem]"
              fields={[
                { key: "name", label: "Zone name" },
                { key: "prefixes", label: "Pincode prefixes" },
                { key: "minDays", label: "Min days", type: "number" },
                { key: "maxDays", label: "Max days", type: "number" },
              ]}
            />
          </FormField>
          <div className="grid items-end gap-4 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,2.5fr)_5.5rem_5.5rem] sm:pr-[6.4rem]">
            <FormField name="restName" label="Everywhere else">
              <input id="restName" name="restName" className="field" defaultValue={delivery.restName} maxLength={60} required />
            </FormField>
            <Toggle name="skipSundays" label="Skip Sundays" description="Don't count Sundays in delivery dates." defaultChecked={delivery.skipSundays} className="pb-1" />
            <FormField name="restMinDays" label="Min days">
              <input id="restMinDays" name="restMinDays" type="number" min={0} max={60} className="field" defaultValue={delivery.restMinDays} required />
            </FormField>
            <FormField name="restMaxDays" label="Max days">
              <input id="restMaxDays" name="restMaxDays" type="number" min={0} max={60} className="field" defaultValue={delivery.restMaxDays} required />
            </FormField>
          </div>
          <FormError />
          <div className="flex justify-end">
            <FormSubmit>Save delivery zones</FormSubmit>
          </div>
        </AdminForm>
      </Panel>

      <Panel title="Recent shipments" description="Orders with an AWB, most recently updated first." flush className="mt-6">
        <Table minWidth={760}>
          <THead>
            <Th>Order</Th>
            <Th>Customer</Th>
            <Th>Courier</Th>
            <Th>AWB</Th>
            <Th>Status</Th>
            <Th>Updated</Th>
          </THead>
          <TBody>
            {shipments.length === 0 && <EmptyRow colSpan={6}>No shipments yet.</EmptyRow>}
            {shipments.map((o) => (
              <Tr key={o.id}>
                <Td>
                  <Link href={`/admin/orders/${o.id}`} className="font-semibold hover:underline">
                    {o.orderNumber}
                  </Link>
                </Td>
                <Td>
                  {o.shipName}
                  <span className="block text-xs text-muted">{o.shipCity}</span>
                </Td>
                <Td>{o.courierName ?? "—"}</Td>
                <Td>
                  {o.trackingUrl ? (
                    <a href={o.trackingUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-[13px] underline-offset-4 hover:underline">
                      {o.awbCode}
                    </a>
                  ) : (
                    <span className="font-mono text-[13px]">{o.awbCode}</span>
                  )}
                </Td>
                <Td>
                  <OrderStatusBadge status={o.status} />
                </Td>
                <Td className="text-muted">{formatDateTime(o.updatedAt)}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </Panel>
    </>
  );
}
