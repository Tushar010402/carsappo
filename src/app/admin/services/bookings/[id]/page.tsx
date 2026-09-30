import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageCircle, Phone } from "lucide-react";
import type { BookingStatus } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BOOKING_STATUS_LABEL } from "@/lib/constants";
import { getSettings, serviceName } from "@/lib/settings";
import { formatDate, formatDateTime, formatINR } from "@/lib/format";
import { whatsappLink } from "@/lib/utils";
import { updateBooking } from "@/app/admin/_actions/services";
import { KeyValues, PageHeader, Panel } from "@/components/admin/ui";
import { AdminForm, FormError, FormField, FormSubmit } from "@/components/admin/form";
import { BookingStatusBadge } from "@/components/admin/status-badge";
import { buttonClasses } from "@/components/ui/button";

export const metadata: Metadata = { title: "Booking" };

export default async function BookingDetailPage({ params }: PageProps<"/admin/services/bookings/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const [booking, settings] = await Promise.all([prisma.serviceBooking.findUnique({ where: { id }, include: { plan: true } }), getSettings()]);
  if (!booking) notFound();
  const service = serviceName(settings, booking.serviceType);

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            Booking {booking.bookingNumber} <BookingStatusBadge status={booking.status} />
          </span>
        }
        description={`Received ${formatDateTime(booking.createdAt)}`}
        back={{ href: "/admin/services", label: "Bookings" }}
        actions={
          <>
            <a href={`tel:${booking.phone}`} className={buttonClasses("outline", "sm")}>
              <Phone className="size-4" /> Call
            </a>
            <a
              href={whatsappLink(booking.phone, `Hi ${booking.name}, this is ${settings.store.name} about your ${service} booking ${booking.bookingNumber}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("whatsapp", "sm")}
            >
              <MessageCircle className="size-4" /> WhatsApp
            </a>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Panel title="Service">
            <KeyValues
              items={[
                ["Service", service],
                ["Plan", booking.plan ? `${booking.plan.name} · ${formatINR(booking.plan.price)}${booking.plan.period === "MONTHLY" ? "/month" : ""}` : "—"],
                ["Preferred start", formatDate(booking.preferredDate)],
                ["Time slot", booking.preferredSlot],
                ["Car", `${booking.carModel}${booking.carNumber ? ` · ${booking.carNumber}` : ""}`],
                ["Notes", booking.notes ? <span key="n" className="whitespace-pre-line">{booking.notes}</span> : "—"],
              ]}
            />
          </Panel>
          <Panel title="Customer">
            <KeyValues
              items={[
                ["Name", booking.name],
                ["Phone", <a key="p" href={`tel:${booking.phone}`} className="hover:underline">{booking.phone}</a>],
                ["Email", booking.email ? <a key="e" href={`mailto:${booking.email}`} className="hover:underline">{booking.email}</a> : "—"],
                ["Society", booking.society ?? "—"],
                ["Address", booking.address],
                ["Pincode", booking.pincode],
              ]}
            />
          </Panel>
        </div>
        <Panel title="Update booking">
          <AdminForm key={booking.updatedAt.toISOString()} action={updateBooking} className="space-y-4">
            <input type="hidden" name="bookingId" value={booking.id} />
            <FormField name="status" label="Status">
              <select id="status" name="status" className="field" defaultValue={booking.status}>
                {(Object.keys(BOOKING_STATUS_LABEL) as BookingStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {BOOKING_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField name="adminNote" label="Internal note" hint="Assigned cleaner, payment received, schedule changes…">
              <textarea id="adminNote" name="adminNote" className="field min-h-32" defaultValue={booking.adminNote ?? ""} maxLength={3000} />
            </FormField>
            <FormError />
            <FormSubmit className="w-full">Save booking</FormSubmit>
          </AdminForm>
        </Panel>
      </div>
    </>
  );
}
