import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSettings, renderText, servicePincodes, serviceTypes } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { firstParam } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { BookingForm } from "@/components/services/booking-form";

export const metadata: Metadata = pageMetadata({
  title: "Book Daily Car Cleaning in Greater Noida",
  description: "Book doorstep daily car cleaning, interior cleaning, tyre polish or dashboard polish in Greater Noida.",
  path: "/services/book",
});

export default async function BookServicePage({ searchParams }: PageProps<"/services/book">) {
  const sp = await searchParams;
  const [settings, plans] = await Promise.all([
    getSettings(),
    prisma.servicePlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, serviceType: true, price: true, period: true, vehicleSize: true },
    }),
  ]);
  return (
    <div className="container-x max-w-3xl py-10 sm:py-14">
      <Breadcrumbs items={[{ name: "Services", path: "/services" }, { name: "Book", path: "/services/book" }]} />
      <h1 className="mt-6 text-3xl font-semibold sm:text-4xl">Book a service</h1>
      <p className="mt-2 flex items-center gap-2 text-muted">
        <MapPin className="size-4" /> {settings.services.serviceAreaNote}
      </p>
      <div className="mt-8 rounded-[28px] border border-line p-6 sm:p-8">
        <BookingForm
          plans={plans}
          defaultType={firstParam(sp.type)}
          defaultPlan={firstParam(sp.plan)}
          whatsapp={settings.store.whatsapp}
          storeName={settings.store.name}
          pincodes={servicePincodes(settings)}
          services={serviceTypes(settings).map((t) => ({ value: t.value, label: t.label }))}
          slots={settings.services.timeSlots}
          note={renderText(settings, settings.services.bookingNote)}
          areaNote={settings.services.serviceAreaNote}
        />
      </div>
    </div>
  );
}
