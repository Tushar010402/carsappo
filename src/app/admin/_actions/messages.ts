"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { idSchema } from "@/lib/admin/form";
import { dbError, done, revalidateAdmin } from "@/lib/admin/server";
import type { ActionState } from "@/lib/admin/types";

export async function setMessageRead(id: string, read: boolean): Promise<ActionState> {
  await assertAdmin();
  try {
    await prisma.contactMessage.update({ where: { id: idSchema.parse(id) }, data: { isRead: z.boolean().parse(read) } });
    revalidateAdmin();
    return done(read ? "Marked as read" : "Marked as unread");
  } catch (err) {
    return dbError(err);
  }
}

export async function markAllMessagesRead(): Promise<ActionState> {
  await assertAdmin();
  const res = await prisma.contactMessage.updateMany({ where: { isRead: false }, data: { isRead: true } });
  revalidateAdmin();
  return done(`${res.count} message${res.count === 1 ? "" : "s"} marked as read`);
}

export async function deleteMessage(id: string): Promise<ActionState> {
  await assertAdmin();
  try {
    await prisma.contactMessage.delete({ where: { id: idSchema.parse(id) } });
    revalidateAdmin();
    return done("Message deleted");
  } catch (err) {
    return dbError(err);
  }
}

export async function deleteSubscriber(id: string): Promise<ActionState> {
  await assertAdmin();
  try {
    await prisma.newsletterSubscriber.delete({ where: { id: idSchema.parse(id) } });
    revalidateAdmin();
    return done("Subscriber removed");
  } catch (err) {
    return dbError(err);
  }
}
