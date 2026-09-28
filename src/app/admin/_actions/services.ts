"use server";

import { z } from "zod";
import type { BookingStatus } from "@prisma/client";
import { assertAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BOOKING_STATUS_LABEL, SERVICE_TYPES } from "@/lib/constants";
import { checkbox, formObject, idSchema, intField, optionalText, requiredText, rupeesField, slugField, stringList } from "@/lib/admin/form";
import { dbError, done, failed, invalid, revalidateAdmin, revalidateStore } from "@/lib/admin/server";
import type { ActionState } from "@/lib/admin/types";

const SERVICE_VALUES = SERVICE_TYPES.map((s) => s.value) as [(typeof SERVICE_TYPES)[number]["value"], ...(typeof SERVICE_TYPES)[number]["value"][]];
const BOOKING_STATUSES = Object.keys(BOOKING_STATUS_LABEL) as [BookingStatus, ...BookingStatus[]];

const planSchema = z.object({
  id: z.preprocess((v) => (v === "" ? undefined : v), idSchema.optional()),
  name: requiredText("Name", 80),
  slug: slugField,
  serviceType: z.enum(SERVICE_VALUES, { error: "Choose a service type" }),
  description: requiredText("Description", 500),
  price: rupeesField("Price", 0, 1_000_000),
  period: z.enum(["MONTHLY", "ONE_TIME"]),
  vehicleSize: optionalText(40),
  features: stringList(20, 160),
  isPopular: checkbox,
  isActive: checkbox,
  sortOrder: intField("Sort order", -1000, 10_000),
});

export async function savePlan(_: ActionState, formData: FormData): Promise<ActionState> {
  await assertAdmin();
  const parsed = planSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { id, ...data } = parsed.data;
  try {
    if (id) await prisma.servicePlan.update({ where: { id }, data });
    else await prisma.servicePlan.create({ data });
    revalidateAdmin();
    revalidateStore("/services", "/services/book", "/");
    return done(id ? "Plan saved" : "Plan created");
  } catch (err) {
    return dbError(err);
  }
}

export async function setPlanActive(id: string, active: boolean): Promise<ActionState> {
  await assertAdmin();
  try {
    await prisma.servicePlan.update({ where: { id: idSchema.parse(id) }, data: { isActive: z.boolean().parse(active) } });
    revalidateAdmin();
    revalidateStore("/services", "/services/book", "/");
    return done(active ? "Plan is live" : "Plan hidden");
  } catch (err) {
    return dbError(err);
  }
}

export async function deletePlan(id: string): Promise<ActionState> {
  await assertAdmin();
  const pid = idSchema.parse(id);
  const bookings = await prisma.serviceBooking.count({ where: { planId: pid } });
  if (bookings > 0) return failed(`This plan has ${bookings} booking(s). Hide it instead so booking history keeps the plan name.`);
  try {
    await prisma.servicePlan.delete({ where: { id: pid } });
    revalidateAdmin();
    revalidateStore("/services", "/services/book", "/");
    return done("Plan deleted");
  } catch (err) {
    return dbError(err);
  }
}

const bookingSchema = z.object({
  bookingId: idSchema,
  status: z.enum(BOOKING_STATUSES),
  adminNote: optionalText(3000),
});

export async function updateBooking(_: ActionState, formData: FormData): Promise<ActionState> {
  await assertAdmin();
  const parsed = bookingSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { bookingId, ...data } = parsed.data;
  try {
    const booking = await prisma.serviceBooking.update({ where: { id: bookingId }, data });
    revalidateAdmin();
    return done(`Booking ${booking.bookingNumber} updated`);
  } catch (err) {
    return dbError(err);
  }
}

export async function setBookingStatus(id: string, status: BookingStatus): Promise<ActionState> {
  await assertAdmin();
  try {
    const booking = await prisma.serviceBooking.update({ where: { id: idSchema.parse(id) }, data: { status: z.enum(BOOKING_STATUSES).parse(status) } });
    revalidateAdmin();
    return done(`${booking.bookingNumber} → ${BOOKING_STATUS_LABEL[status]}`);
  } catch (err) {
    return dbError(err);
  }
}
