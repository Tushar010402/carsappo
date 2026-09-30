import type { Metadata } from "next";
import Link from "next/link";
import type { BookingStatus, Prisma, ServicePlan, ServiceType } from "@prisma/client";
import { Check, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSettings, serviceName, servicePincodes, serviceTypes } from "@/lib/settings";
import { SERVICE_TYPE_ORDER } from "@/lib/content";
import { BOOKING_STATUS_LABEL } from "@/lib/constants";
import { formatDate, formatDateTime, formatINR, paiseToRupees } from "@/lib/format";
import { ADMIN_PAGE_SIZE, enumParam, pageParam, param, withParams } from "@/lib/admin/query";
import { deletePlan, savePlan, setBookingStatus, setPlanActive } from "@/app/admin/_actions/services";
import { saveServicesSettings } from "@/app/admin/_actions/settings";
import { saveServicesContent } from "@/app/admin/_actions/content";
import { EmptyRow, MoneyInput, PageHeader, Panel, TBody, THead, Table, Tabs, Td, Th, Toggle, Tr } from "@/components/admin/ui";
import { FilterBar, FilterSelect, SearchInput } from "@/components/admin/filters";
import { AdminPagination } from "@/components/admin/pagination";
import { ActionButton } from "@/components/admin/action-button";
import { FormDialog } from "@/components/admin/dialog";
import { AdminForm, FormActions, FormError, FormField, FormSubmit } from "@/components/admin/form";
import { ListEditor, RowsEditor } from "@/components/admin/list-editor";
import { TextField } from "@/components/admin/fields";
import { TokenHelp } from "@/components/admin/token-help";
import { SlugFields } from "@/components/admin/slug-fields";
import { ActiveBadge, BookingStatusBadge } from "@/components/admin/status-badge";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Car cleaning services" };

const STATUSES = Object.keys(BOOKING_STATUS_LABEL) as BookingStatus[];

type ServiceOption = { value: string; label: string };

function PlanForm({ plan, services }: { plan?: ServicePlan; services: ServiceOption[] }) {
  return (
    <AdminForm action={savePlan} className="space-y-4">
      {plan && <input type="hidden" name="id" value={plan.id} />}
      <SlugFields defaultName={plan?.name} defaultSlug={plan?.slug} prefix="/services#" namePlaceholder="Daily Exterior — Hatchback" />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField name="serviceType" label="Service">
          <select id="serviceType" name="serviceType" className="field" defaultValue={plan?.serviceType ?? "DAILY_EXTERIOR"}>
            {services.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField name="vehicleSize" label="Vehicle size" hint="e.g. Hatchback, Sedan, SUV">
          <input id="vehicleSize" name="vehicleSize" className="field" defaultValue={plan?.vehicleSize ?? ""} maxLength={40} list="vehicle-sizes" />
          <datalist id="vehicle-sizes">
            <option value="Hatchback" />
            <option value="Sedan" />
            <option value="SUV" />
            <option value="MUV" />
          </datalist>
        </FormField>
        <FormField name="price" label="Price">
          <MoneyInput id="price" name="price" defaultValue={plan ? paiseToRupees(plan.price) : ""} required />
        </FormField>
        <FormField name="period" label="Billing">
          <select id="period" name="period" className="field" defaultValue={plan?.period ?? "MONTHLY"}>
            <option value="MONTHLY">Per month (subscription)</option>
            <option value="ONE_TIME">One-time</option>
          </select>
        </FormField>
      </div>
      <FormField name="description" label="Description">
        <textarea id="description" name="description" className="field min-h-20" defaultValue={plan?.description ?? ""} required maxLength={500} />
      </FormField>
      <FormField name="features" label="What's included">
        <ListEditor name="features" defaultValue={plan?.features ?? []} placeholder="e.g. 26 washes a month" addLabel="Add inclusion" max={20} />
      </FormField>
      <div className="grid items-end gap-4 sm:grid-cols-3">
        <FormField name="sortOrder" label="Sort order">
          <input id="sortOrder" name="sortOrder" type="number" className="field" defaultValue={plan?.sortOrder ?? 0} required />
        </FormField>
        <Toggle name="isPopular" label="Most popular" defaultChecked={plan?.isPopular ?? false} className="pb-2" />
        <Toggle name="isActive" label="Active" defaultChecked={plan?.isActive ?? true} className="pb-2" />
      </div>
      <FormError />
      <div className="flex justify-end">
        <FormSubmit>{plan ? "Save plan" : "Create plan"}</FormSubmit>
      </div>
    </AdminForm>
  );
}

async function BookingsTab({ sp, label }: { sp: Awaited<PageProps<"/admin/services">["searchParams"]>; label: (type: ServiceType) => string }) {
  const status = enumParam(sp, "status", STATUSES);
  const q = param(sp, "q");
  const page = pageParam(sp);
  const where: Prisma.ServiceBookingWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { bookingNumber: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q.replace(/\D/g, "") || q } },
            { society: { contains: q, mode: "insensitive" } },
            { carNumber: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [bookings, total] = await Promise.all([
    prisma.serviceBooking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
      include: { plan: { select: { name: true } } },
    }),
    prisma.serviceBooking.count({ where }),
  ]);
  return (
    <Panel flush>
      <FilterBar action="/admin/services" resetHref="/admin/services">
        <SearchInput defaultValue={q} placeholder="Booking no., name, phone, society or car no.…" />
        <FilterSelect label="Status" name="status" defaultValue={status ?? ""}>
          <option value="">Any status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {BOOKING_STATUS_LABEL[s]}
            </option>
          ))}
        </FilterSelect>
      </FilterBar>
      <Table minWidth={960}>
        <THead>
          <Th>Booking</Th>
          <Th>Customer</Th>
          <Th>Service</Th>
          <Th>Car</Th>
          <Th>Preferred start</Th>
          <Th>Status</Th>
          <Th>
            <span className="sr-only">Actions</span>
          </Th>
        </THead>
        <TBody>
          {bookings.length === 0 && <EmptyRow colSpan={7}>No bookings yet. They appear here when customers book from the Services page.</EmptyRow>}
          {bookings.map((b) => (
            <Tr key={b.id}>
              <Td>
                <Link href={`/admin/services/bookings/${b.id}`} className="font-semibold hover:underline">
                  {b.bookingNumber}
                </Link>
                <span className="block text-xs text-muted">{formatDateTime(b.createdAt)}</span>
              </Td>
              <Td>
                <span className="block font-medium">{b.name}</span>
                <a href={`tel:${b.phone}`} className="text-xs text-muted hover:underline">
                  {b.phone}
                </a>
                <span className="block max-w-56 truncate text-xs text-muted">
                  {b.society ? `${b.society} · ` : ""}
                  {b.pincode}
                </span>
              </Td>
              <Td>
                {label(b.serviceType)}
                {b.plan && <span className="block text-xs text-muted">{b.plan.name}</span>}
              </Td>
              <Td>
                {b.carModel}
                {b.carNumber && <span className="block font-mono text-xs text-muted">{b.carNumber}</span>}
              </Td>
              <Td>
                {formatDate(b.preferredDate)}
                <span className="block text-xs text-muted">{b.preferredSlot}</span>
              </Td>
              <Td>
                <BookingStatusBadge status={b.status} />
              </Td>
              <Td align="right">
                <div className="flex justify-end gap-1">
                  {b.status === "NEW" && (
                    <ActionButton action={setBookingStatus.bind(null, b.id, "CONFIRMED")} variant="dark">
                      <Check className="size-4" /> Confirm
                    </ActionButton>
                  )}
                  <Link href={`/admin/services/bookings/${b.id}`} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-mist hover:text-ink" aria-label={`Open ${b.bookingNumber}`}>
                    <Pencil className="size-4" />
                  </Link>
                </div>
              </Td>
            </Tr>
          ))}
        </TBody>
      </Table>
      <AdminPagination page={page} pageSize={ADMIN_PAGE_SIZE} total={total} hrefFor={(n) => withParams("/admin/services", sp, { page: n })} />
    </Panel>
  );
}

async function PlansTab({ services, label }: { services: ServiceOption[]; label: (type: ServiceType) => string }) {
  const plans = await prisma.servicePlan.findMany({ orderBy: [{ sortOrder: "asc" }, { price: "asc" }], include: { _count: { select: { bookings: true } } } });
  return (
    <Panel
      title="Service plans"
      description="Shown on the Services page and in the booking form."
      flush
      actions={
        <FormDialog trigger={<><Plus className="size-4" /> New plan</>} triggerVariant="primary" title="New service plan" size="lg">
          <PlanForm services={services} />
        </FormDialog>
      }
    >
      <Table minWidth={820}>
        <THead>
          <Th>Plan</Th>
          <Th>Service</Th>
          <Th>Size</Th>
          <Th align="right">Price</Th>
          <Th align="right">Bookings</Th>
          <Th>Status</Th>
          <Th>
            <span className="sr-only">Actions</span>
          </Th>
        </THead>
        <TBody>
          {plans.length === 0 && <EmptyRow colSpan={7}>No plans yet.</EmptyRow>}
          {plans.map((p) => (
            <Tr key={p.id}>
              <Td>
                <span className="flex items-center gap-2 font-medium">
                  {p.name} {p.isPopular && <Badge tone="brand">Popular</Badge>}
                </span>
                <span className="block max-w-72 truncate text-xs text-muted">{p.features.slice(0, 3).join(" · ")}</span>
              </Td>
              <Td>{label(p.serviceType)}</Td>
              <Td className="text-muted">{p.vehicleSize ?? "Any"}</Td>
              <Td align="right">
                <span className="font-medium">{formatINR(p.price)}</span>
                <span className="block text-xs text-muted">{p.period === "MONTHLY" ? "/ month" : "one-time"}</span>
              </Td>
              <Td align="right">{p._count.bookings}</Td>
              <Td>
                <ActiveBadge active={p.isActive} />
              </Td>
              <Td align="right">
                <div className="flex justify-end gap-0.5">
                  <ActionButton action={setPlanActive.bind(null, p.id, !p.isActive)} variant="icon" label={p.isActive ? `Hide ${p.name}` : `Show ${p.name}`}>
                    {p.isActive ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </ActionButton>
                  <FormDialog trigger={<Pencil className="size-4" />} triggerVariant="icon" triggerLabel={`Edit ${p.name}`} title={`Edit ${p.name}`} size="lg">
                    <PlanForm plan={p} services={services} />
                  </FormDialog>
                  <ActionButton action={deletePlan.bind(null, p.id)} variant="icon-danger" label={`Delete ${p.name}`} confirm={`Delete plan "${p.name}"?`}>
                    <Trash2 className="size-4" />
                  </ActionButton>
                </div>
              </Td>
            </Tr>
          ))}
        </TBody>
      </Table>
    </Panel>
  );
}

async function AreaTab() {
  const settings = await getSettings();
  const pins = servicePincodes(settings);
  return (
    <Panel title="Service area" description="Bookings are accepted only from these pincodes." className="max-w-3xl">
      <AdminForm action={saveServicesSettings} className="space-y-4">
        <FormField name="serviceablePincodes" label={`Serviceable pincodes (${pins.length})`} hint="Separate with commas, spaces or new lines.">
          <textarea id="serviceablePincodes" name="serviceablePincodes" className="field min-h-32 font-mono text-[13px]" defaultValue={pins.join(", ")} />
        </FormField>
        <FormField name="serviceAreaNote" label="Service area note" hint="Shown on the Services page and when a pincode isn't covered.">
          <input id="serviceAreaNote" name="serviceAreaNote" className="field" defaultValue={settings.services.serviceAreaNote} maxLength={300} />
        </FormField>
        <FormError />
        <div className="flex justify-end">
          <FormSubmit>Save service area</FormSubmit>
        </div>
      </AdminForm>
    </Panel>
  );
}

async function ContentTab() {
  const settings = await getSettings();
  const c = settings.services;
  return (
    <AdminForm action={saveServicesContent} className="space-y-6">
      <TokenHelp />
      <Panel title="Services" description="Names, descriptions and what's included — shown on the Services page, the homepage and the booking form. Hidden services can't be booked.">
        <FormField name="types">
          <div className="grid gap-4 lg:grid-cols-2">
            {SERVICE_TYPE_ORDER.map((type) => {
              const t = c.types[type];
              const base = `types.${type}`;
              return (
                <fieldset key={type} className="space-y-4 rounded-2xl border border-line p-4">
                  <legend className="px-1 font-mono text-[11px] text-muted">{type}</legend>
                  <Toggle name={`${base}.visible`} label="Offer this service" description="Show it on the site and in the booking form." defaultChecked={t.visible} />
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                    <TextField name={`${base}.label`} label="Service name" defaultValue={t.label} max={60} required />
                    <TextField name={`${base}.short`} label="Short name" defaultValue={t.short} max={30} required hint="Used on small cards." />
                  </div>
                  <TextField name={`${base}.description`} label="Description" defaultValue={t.description} max={300} multiline rows={2} />
                  <FormField name={`${base}.included`} label="What's included">
                    <ListEditor name={`${base}.included`} defaultValue={t.included} placeholder="e.g. All four tyres cleaned" addLabel="Add item" max={10} />
                  </FormField>
                </fieldset>
              );
            })}
          </div>
        </FormField>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Booking form">
          <div className="space-y-4">
            <FormField name="timeSlots" label="Time slots" hint="Customers pick one when booking.">
              <ListEditor name="timeSlots" defaultValue={c.timeSlots} placeholder="e.g. 6:00 AM – 8:00 AM" addLabel="Add time slot" max={12} />
            </FormField>
            <TextField name="bookingNote" label="Note under the Book button" defaultValue={c.bookingNote} max={160} />
          </div>
        </Panel>

        <Panel title="How it works" description="Up to 6 numbered steps.">
          <FormField name="steps">
            <RowsEditor
              name="steps"
              defaultValue={c.steps}
              addLabel="Add step"
              max={6}
              fields={[
                { key: "title", label: "Step" },
                { key: "text", label: "Text" },
              ]}
            />
          </FormField>
        </Panel>
      </div>

      <Panel title="Services page text">
        <div className="grid gap-4 lg:grid-cols-2">
          <TextField name="heroTitle" label="Heading" defaultValue={c.heroTitle} max={80} required />
          <TextField name="heroHighlight" label="Second line (yellow)" defaultValue={c.heroHighlight} max={60} />
          <TextField name="heroText" label="Introduction" defaultValue={c.heroText} max={400} multiline rows={3} className="lg:col-span-2" />
          <TextField name="servicesTitle" label="Services heading" defaultValue={c.servicesTitle} max={100} />
          <TextField name="plansTitle" label="Plans heading" defaultValue={c.plansTitle} max={100} />
          <TextField name="plansSubtitle" label="Plans text" defaultValue={c.plansSubtitle} max={160} />
          <TextField name="faqTitle" label="FAQ heading" defaultValue={c.faqTitle} max={80} hint="Questions come from FAQs (Services group)." />
          <TextField name="contactTitle" label="Contact box heading" defaultValue={c.contactTitle} max={80} />
          <TextField name="contactText" label="Contact box text" defaultValue={c.contactText} max={200} />
        </div>
      </Panel>

      <FormError />
      <FormActions sticky>
        <FormSubmit>Save service content</FormSubmit>
      </FormActions>
    </AdminForm>
  );
}

export default async function ServicesPage({ searchParams }: PageProps<"/admin/services">) {
  await requireAdmin();
  const sp = await searchParams;
  const tab = enumParam(sp, "tab", ["bookings", "plans", "content", "area"] as const) ?? "bookings";
  const [newCount, activeCount, settings] = await Promise.all([
    prisma.serviceBooking.count({ where: { status: "NEW" } }),
    prisma.serviceBooking.count({ where: { status: "ACTIVE" } }),
    getSettings(),
  ]);
  const services = serviceTypes(settings, { includeHidden: true }).map((t) => ({ value: t.value, label: t.visible ? t.label : `${t.label} (hidden)` }));
  const label = (type: ServiceType) => serviceName(settings, type);

  return (
    <>
      <PageHeader
        title="Car cleaning services"
        description={`${newCount} new booking${newCount === 1 ? "" : "s"} · ${activeCount} active subscription${activeCount === 1 ? "" : "s"}`}
      />
      <Tabs
        items={[
          { href: "/admin/services", label: "Bookings", active: tab === "bookings", count: newCount || undefined },
          { href: "/admin/services?tab=plans", label: "Plans & pricing", active: tab === "plans" },
          { href: "/admin/services?tab=content", label: "Service content", active: tab === "content" },
          { href: "/admin/services?tab=area", label: "Service area", active: tab === "area" },
        ]}
      />
      {tab === "bookings" && <BookingsTab sp={sp} label={label} />}
      {tab === "plans" && <PlansTab services={services} label={label} />}
      {tab === "content" && <ContentTab />}
      {tab === "area" && <AreaTab />}
    </>
  );
}
