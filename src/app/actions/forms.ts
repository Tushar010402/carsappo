"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { bookingSchema, contactSchema, emailSchema, fieldErrors, reviewSchema, type FormState } from "@/lib/validators";
import { adminEmail, sendMail, simpleEmail } from "@/lib/mailer";
import { getSettings, servicePincodes } from "@/lib/settings";
import { generateBookingNumber } from "@/lib/orders";
import { refreshProductRating } from "@/lib/reviews";
import { formatDate } from "@/lib/format";
import { serviceLabel } from "@/lib/constants";

export async function subscribeNewsletter(_: FormState, formData: FormData): Promise<FormState> {
  if (!(await rateLimit("newsletter", 5, 10 * 60 * 1000)).ok) return { message: "Please try again in a few minutes." };
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { message: "Enter a valid email address." };
  await prisma.newsletterSubscriber.upsert({ where: { email: email.data }, create: { email: email.data }, update: {} });
  return { ok: true, message: "You're in! Watch your inbox for car care tips and offers." };
}

export async function submitContact(_: FormState, formData: FormData): Promise<FormState> {
  if (!(await rateLimit("contact", 5, 10 * 60 * 1000)).ok) return { message: "Please wait a few minutes before sending another message." };
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const msg = await prisma.contactMessage.create({ data: parsed.data });
  const admin = adminEmail();
  if (admin) {
    await sendMail({
      to: admin,
      replyTo: msg.email,
      subject: `Contact form: ${msg.subject || msg.name}`,
      html: simpleEmail(`Message from ${msg.name}`, [`${msg.email}${msg.phone ? ` · ${msg.phone}` : ""}`, msg.message]),
    });
  }
  return { ok: true, message: "Thanks for reaching out! Our team will get back to you within 24 hours." };
}

export type BookingState = FormState & { bookingNumber?: string };

export async function createBooking(_: BookingState, formData: FormData): Promise<BookingState> {
  if (!(await rateLimit("booking", 5, 10 * 60 * 1000)).ok) return { message: "Please wait a few minutes before booking again." };
  const parsed = bookingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const data = parsed.data;

  const settings = await getSettings();
  if (!servicePincodes(settings).includes(data.pincode)) {
    return {
      errors: {
        pincode: "Sorry — daily car cleaning is currently available only in Greater Noida. Leave us a message and we'll notify you when we reach your area.",
      },
    };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (data.preferredDate < today) return { errors: { preferredDate: "Choose today or a future date" } };

  let planId: string | undefined;
  if (data.planId) {
    const plan = await prisma.servicePlan.findFirst({ where: { id: data.planId, isActive: true }, select: { id: true } });
    planId = plan?.id;
  }

  const booking = await prisma.serviceBooking.create({
    data: {
      bookingNumber: await generateBookingNumber(),
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      society: data.society,
      pincode: data.pincode,
      carModel: data.carModel,
      carNumber: data.carNumber,
      serviceType: data.serviceType,
      planId,
      preferredDate: data.preferredDate,
      preferredSlot: data.preferredSlot,
      notes: data.notes,
    },
  });

  const summary = [
    `${serviceLabel(booking.serviceType)} · starts ${formatDate(booking.preferredDate)}, ${booking.preferredSlot}`,
    `${booking.carModel}${booking.carNumber ? ` (${booking.carNumber})` : ""}`,
    `${booking.address}, ${booking.pincode}`,
  ];
  if (booking.email) {
    await sendMail({
      to: booking.email,
      subject: `Booking ${booking.bookingNumber} received — Carsappo Daily Car Cleaning`,
      html: simpleEmail("We've received your booking", [...summary, "Our team will call you shortly to confirm your slot."]),
    });
  }
  const admin = adminEmail();
  if (admin) {
    await sendMail({
      to: admin,
      subject: `New service booking ${booking.bookingNumber}`,
      html: simpleEmail(`New booking from ${booking.name} (${booking.phone})`, summary),
    });
  }
  return { ok: true, bookingNumber: booking.bookingNumber, message: "Booking received! We'll call you shortly to confirm." };
}

export async function submitReview(_: FormState, formData: FormData): Promise<FormState> {
  if (!(await rateLimit("review", 5, 60 * 60 * 1000)).ok) return { message: "Please try again later." };
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId }, select: { id: true, slug: true } });
  if (!product) return { message: "Product not found." };

  const user = await getCurrentUser();
  const verified = user
    ? (await prisma.orderItem.count({
        where: { productId: product.id, order: { userId: user.id, status: "DELIVERED" } },
      })) > 0
    : false;

  await prisma.review.create({
    data: {
      productId: product.id,
      userId: user?.id,
      name: parsed.data.name,
      rating: parsed.data.rating,
      title: parsed.data.title,
      body: parsed.data.body,
      isVerified: verified,
      // Verified-purchase reviews go live immediately; others are moderated in the admin panel.
      isApproved: verified,
    },
  });
  if (verified) {
    await refreshProductRating(product.id);
    revalidatePath(`/product/${product.slug}`);
  }
  return {
    ok: true,
    message: verified ? "Thanks! Your review is live." : "Thanks! Your review will appear once it's approved by our team.",
  };
}
