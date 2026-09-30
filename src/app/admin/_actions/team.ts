"use server";

import { z } from "zod";
import { assertAdmin, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { emailSchema, passwordSchema } from "@/lib/validators";
import { formObject } from "@/lib/admin/form";
import { dbError, done, failed, invalid, revalidateAdmin } from "@/lib/admin/server";
import type { ActionState } from "@/lib/admin/types";

const addSchema = z.object({
  email: emailSchema,
  name: z.string().trim().max(80).default(""),
  password: z.string().max(100).default(""),
});

/** Gives an existing account admin access, or creates a new admin account with a starting password. */
export async function addAdmin(_: ActionState, formData: FormData): Promise<ActionState> {
  await assertAdmin();
  const parsed = addSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { email, name, password } = parsed.data;
  try {
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true, name: true } });
    if (existing?.role === "ADMIN") return failed(`${existing.name} is already an admin`, { email: "Already an admin" });
    if (existing) {
      // New role → sign them out everywhere so their next session carries admin access.
      await prisma.user.update({ where: { id: existing.id }, data: { role: "ADMIN", tokenVersion: { increment: 1 } } });
      revalidateAdmin();
      return done(`${existing.name} is now an admin`);
    }
    const errors: Record<string, string> = {};
    if (name.length < 2) errors.name = "Enter their name";
    if (!password) errors.password = "Set a starting password (at least 8 characters)";
    else if (!passwordSchema.safeParse(password).success) errors.password = "Use at least 8 characters";
    if (Object.keys(errors).length) return failed("No account uses that email yet — add a name and starting password to create one", errors);
    await prisma.user.create({ data: { email, name, role: "ADMIN", passwordHash: await hashPassword(password) } });
    revalidateAdmin();
    return done(`Admin account created for ${email}`);
  } catch (err) {
    return dbError(err);
  }
}
