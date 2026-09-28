"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession, destroySession, getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { emailSchema, fieldErrors, loginSchema, passwordSchema, registerSchema, type FormState } from "@/lib/validators";
import { sendMail, simpleEmail } from "@/lib/mailer";
import { absoluteUrl, safeRedirectPath } from "@/lib/utils";

async function mergeGuestWishlist(userId: string, raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || !raw) return;
  try {
    const ids = z.array(z.string().max(40)).max(200).parse(JSON.parse(raw));
    if (!ids.length) return;
    const products = await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true } });
    await prisma.wishlistItem.createMany({ data: products.map((p) => ({ userId, productId: p.id })), skipDuplicates: true });
  } catch {
    // ignore malformed payloads
  }
}

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  if (!(await rateLimit("login", 10, 15 * 60 * 1000)).ok) {
    return { message: "Too many attempts. Please wait a few minutes and try again." };
  }
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  // Always run bcrypt to keep response timing uniform.
  const valid = await verifyPassword(parsed.data.password, user?.passwordHash ?? "$2b$11$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
  if (!user || !valid) return { message: "Incorrect email or password." };

  await createSession(user);
  await mergeGuestWishlist(user.id, formData.get("wishlist"));
  const fallback = user.role === "ADMIN" ? "/admin" : "/account";
  redirect(safeRedirectPath(formData.get("next"), fallback));
}

export async function register(_: FormState, formData: FormData): Promise<FormState> {
  if (!(await rateLimit("register", 5, 60 * 60 * 1000)).ok) {
    return { message: "Too many sign-ups from this network. Please try again later." };
  }
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    password: formData.get("password"),
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (exists) return { errors: { email: "An account with this email already exists. Try logging in." } };

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      passwordHash: await hashPassword(parsed.data.password),
    },
  });
  // Link earlier guest orders placed with the same email.
  await prisma.order.updateMany({ where: { email: user.email, userId: null }, data: { userId: user.id } });
  await createSession(user);
  await mergeGuestWishlist(user.id, formData.get("wishlist"));
  redirect(safeRedirectPath(formData.get("next"), "/account"));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function requestPasswordReset(_: FormState, formData: FormData): Promise<FormState> {
  if (!(await rateLimit("reset", 5, 60 * 60 * 1000)).ok) return { message: "Too many requests. Please try again later." };
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { errors: { email: "Enter a valid email address" } };

  const user = await prisma.user.findUnique({ where: { email: parsed.data } });
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetHash: hashToken(token), passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000) },
    });
    const link = absoluteUrl(`/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`);
    await sendMail({
      to: user.email,
      subject: "Reset your Carsappo password",
      html: simpleEmail("Reset your password", ["We received a request to reset your Carsappo password.", "This link expires in 1 hour. If you didn't ask for this, you can ignore this email."], {
        label: "Choose a new password",
        href: link,
      }),
    });
  }
  return { ok: true, message: "If an account exists for that email, we've sent a password reset link." };
}

export async function resetPassword(_: FormState, formData: FormData): Promise<FormState> {
  const email = emailSchema.safeParse(formData.get("email"));
  const token = z.string().regex(/^[a-f0-9]{64}$/).safeParse(formData.get("token"));
  const password = passwordSchema.safeParse(formData.get("password"));
  if (!password.success) return { errors: { password: password.error.issues[0].message } };
  if (!email.success || !token.success) return { message: "This reset link is invalid. Please request a new one." };

  const user = await prisma.user.findUnique({ where: { email: email.data } });
  const expected = user?.passwordResetHash;
  const valid =
    !!user &&
    !!expected &&
    !!user.passwordResetExpires &&
    user.passwordResetExpires > new Date() &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hashToken(token.data)));
  if (!valid) return { message: "This reset link is invalid or has expired. Please request a new one." };

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(password.data),
      passwordResetHash: null,
      passwordResetExpires: null,
      tokenVersion: { increment: 1 },
    },
  });
  await createSession(updated);
  redirect("/account");
}

export async function changePassword(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Please log in again." };
  const current = String(formData.get("current") ?? "");
  const next = passwordSchema.safeParse(formData.get("password"));
  if (!next.success) return { errors: { password: next.error.issues[0].message } };
  const record = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verifyPassword(current, record.passwordHash))) return { errors: { current: "Current password is incorrect" } };
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next.data), tokenVersion: { increment: 1 } },
  });
  await createSession(updated);
  return { ok: true, message: "Password updated. Other devices have been signed out." };
}
