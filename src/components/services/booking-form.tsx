"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { createBooking, type BookingState } from "@/app/actions/forms";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { ButtonLink } from "@/components/ui/button";
import { WhatsappIcon } from "@/components/icons/brand";
import { SERVICE_SLOTS, SERVICE_TYPES } from "@/lib/constants";
import { formatINR } from "@/lib/format";
import { todayInIndia, whatsappLink } from "@/lib/utils";

type Plan = { id: string; name: string; serviceType: string; price: number; period: "MONTHLY" | "ONE_TIME"; vehicleSize: string | null };

export function BookingForm({
  plans,
  defaultType,
  defaultPlan,
  whatsapp,
  pincodes,
}: {
  plans: Plan[];
  defaultType?: string;
  defaultPlan?: string;
  whatsapp: string;
  pincodes: string[];
}) {
  const [state, action] = useActionState<BookingState, FormData>(createBooking, {});
  const [type, setType] = useState(defaultType && SERVICE_TYPES.some((s) => s.value === defaultType) ? defaultType : "DAILY_EXTERIOR");
  const [pin, setPin] = useState("");
  const typePlans = useMemo(() => plans.filter((p) => p.serviceType === type), [plans, type]);
  const [today] = useState(todayInIndia);
  const pinChecked = /^\d{6}$/.test(pin);
  const pinOk = pinChecked && pincodes.includes(pin);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.ok) successRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [state.ok]);

  if (state.ok) {
    return (
      <div ref={successRef} className="scroll-mt-28 rounded-[28px] bg-ink p-8 text-white">
        <CheckCircle2 className="size-10 text-brand" />
        <h2 className="mt-4 text-2xl font-semibold">Booking received!</h2>
        <p className="mt-2 text-zinc-300">
          Your booking number is <b className="text-brand">{state.bookingNumber}</b>. Our team will call you shortly to confirm your slot.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {whatsapp && (
            <a
              href={whatsappLink(whatsapp, `Hi Carsappo! I just booked a service. Booking number: ${state.bookingNumber}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#25D366] px-5 text-sm font-semibold text-white"
            >
              <WhatsappIcon className="size-4" /> Chat on WhatsApp
            </a>
          )}
          <ButtonLink href="/shop" variant="outline-light">
            Shop car care products
          </ButtonLink>
        </div>
      </div>
    );
  }

  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Service" htmlFor="b-type">
          <Select id="b-type" name="serviceType" value={type} onChange={(ev) => setType(ev.target.value)}>
            {SERVICE_TYPES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Plan" htmlFor="b-plan">
          <Select id="b-plan" name="planId" defaultValue={defaultPlan && typePlans.some((p) => p.id === defaultPlan) ? defaultPlan : typePlans[0]?.id ?? ""} key={type}>
            {typePlans.length === 0 && <option value="">Custom — we&apos;ll share a quote</option>}
            {typePlans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {formatINR(p.price)}
                {p.period === "MONTHLY" ? "/month" : ""}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" error={e.name} htmlFor="b-name">
          <Input id="b-name" name="name" autoComplete="name" required invalid={!!e.name} />
        </Field>
        <Field label="Mobile number" error={e.phone} htmlFor="b-phone">
          <Input id="b-phone" name="phone" type="tel" autoComplete="tel" required invalid={!!e.phone} />
        </Field>
        <Field label="Email (optional)" error={e.email} htmlFor="b-email">
          <Input id="b-email" name="email" type="email" autoComplete="email" invalid={!!e.email} />
        </Field>
        <Field
          label="Pincode"
          error={e.pincode}
          hint={pinChecked ? (pinOk ? "✓ We serve your area" : "Sorry, this pincode is outside our Greater Noida service area") : "Greater Noida only"}
          htmlFor="b-pin"
        >
          <Input id="b-pin" name="pincode" inputMode="numeric" maxLength={6} required value={pin} onChange={(ev) => setPin(ev.target.value.replace(/\D/g, ""))} invalid={!!e.pincode || (pinChecked && !pinOk)} />
        </Field>
        <Field label="Full address" error={e.address} className="sm:col-span-2" htmlFor="b-address">
          <Input id="b-address" name="address" autoComplete="street-address" required placeholder="Flat / tower, sector" invalid={!!e.address} />
        </Field>
        <Field label="Society / parking details (optional)" htmlFor="b-society">
          <Input id="b-society" name="society" placeholder="e.g. Gaur City 2, basement B2, slot 114" />
        </Field>
        <Field label="Car model" error={e.carModel} htmlFor="b-car">
          <Input id="b-car" name="carModel" required placeholder="e.g. Hyundai Creta" invalid={!!e.carModel} />
        </Field>
        <Field label="Car number (optional)" htmlFor="b-carno">
          <Input id="b-carno" name="carNumber" placeholder="UP16 AB 1234" className="uppercase" />
        </Field>
        <Field label="Start date" error={e.preferredDate} htmlFor="b-date">
          <Input id="b-date" name="preferredDate" type="date" min={today} defaultValue={today} required invalid={!!e.preferredDate} />
        </Field>
        <Field label="Preferred time slot" error={e.preferredSlot} htmlFor="b-slot">
          <Select id="b-slot" name="preferredSlot" defaultValue={SERVICE_SLOTS[0]}>
            {SERVICE_SLOTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Anything else? (optional)" htmlFor="b-notes">
        <Textarea id="b-notes" name="notes" className="min-h-20" placeholder="Access instructions, key handover, special requests…" />
      </Field>
      <FormMessage state={state} />
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton size="lg" pendingText="Booking…">
          Book Service
        </SubmitButton>
        <p className="text-xs text-muted">
          No payment now. We&apos;ll confirm by phone. See{" "}
          <Link href="/services#faqs" className="underline">
            FAQs
          </Link>
          .
        </p>
      </div>
    </form>
  );
}
