"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { addressSchema, fieldErrors, phoneSchema, type FormState } from "@/lib/validators";

export async function updateProfile(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Please log in again." };
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Enter your name").max(80),
      phone: phoneSchema.optional().or(z.literal("").transform(() => undefined)),
    })
    .safeParse({ name: formData.get("name"), phone: formData.get("phone") ?? "" });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  await prisma.user.update({ where: { id: user.id }, data: { name: parsed.data.name, phone: parsed.data.phone ?? null } });
  revalidatePath("/account");
  return { ok: true, message: "Profile updated." };
}

export async function saveAddress(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { message: "Please log in again." };
  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error);
    return { errors: Object.fromEntries(Object.entries(errors).map(([k, v]) => [`address.${k}`, v])) };
  }
  const id = String(formData.get("id") ?? "");
  const makeDefault = formData.get("isDefault") === "on";
  const count = await prisma.address.count({ where: { userId: user.id } });
  if (makeDefault) await prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
  if (id) {
    const res = await prisma.address.updateMany({ where: { id, userId: user.id }, data: { ...parsed.data, ...(makeDefault ? { isDefault: true } : {}) } });
    if (!res.count) return { message: "Address not found." };
  } else {
    await prisma.address.create({ data: { ...parsed.data, userId: user.id, isDefault: makeDefault || count === 0 } });
  }
  revalidatePath("/account/addresses");
  return { ok: true, message: "Address saved." };
}

export async function deleteAddress(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const id = String(formData.get("id") ?? "");
  const addr = await prisma.address.findFirst({ where: { id, userId: user.id } });
  if (!addr) return;
  await prisma.address.delete({ where: { id } });
  if (addr.isDefault) {
    const next = await prisma.address.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }
  revalidatePath("/account/addresses");
}

export async function setDefaultAddress(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;
  const id = String(formData.get("id") ?? "");
  const addr = await prisma.address.findFirst({ where: { id, userId: user.id } });
  if (!addr) return;
  await prisma.$transaction([
    prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
    prisma.address.update({ where: { id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/account/addresses");
}

export async function markAllNotificationsRead() {
  const user = await getCurrentUser();
  if (!user) return;
  await prisma.notification.updateMany({ where: { userId: user.id, isRead: false }, data: { isRead: true } });
  revalidatePath("/account", "layout");
}
