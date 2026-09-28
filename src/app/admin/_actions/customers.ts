"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { idSchema } from "@/lib/admin/form";
import { dbError, done, failed, revalidateAdmin } from "@/lib/admin/server";
import type { ActionState } from "@/lib/admin/types";

/** Promote a customer to admin or demote an admin. Admins can't demote themselves. */
export async function setUserRole(userId: string, role: "ADMIN" | "CUSTOMER"): Promise<ActionState> {
  const admin = await assertAdmin();
  const id = idSchema.parse(userId);
  const nextRole = z.enum(["ADMIN", "CUSTOMER"]).parse(role);
  if (id === admin.id && nextRole !== "ADMIN") return failed("You can't remove your own admin access");
  try {
    const user = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!user) return failed("Customer not found");
    if (user.role === nextRole) return failed(`Already ${nextRole === "ADMIN" ? "an admin" : "a customer"}`);
    if (nextRole === "CUSTOMER") {
      const admins = await prisma.user.count({ where: { role: "ADMIN" } });
      if (admins <= 1) return failed("At least one admin is required");
    }
    // Bump tokenVersion: signs the user out everywhere so their next session carries the new role.
    await prisma.user.update({ where: { id }, data: { role: nextRole, tokenVersion: { increment: 1 } } });
    revalidateAdmin();
    return done(nextRole === "ADMIN" ? "Promoted to admin" : "Admin access removed");
  } catch (err) {
    return dbError(err);
  }
}
