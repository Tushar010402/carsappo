"use server";

import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FUEL_TYPES } from "@/lib/constants";
import { formObject, idSchema, intField, mediaUrl, optionalInt, requiredText, slugField } from "@/lib/admin/form";
import { dbError, done, failed, invalid, revalidateAdmin, revalidateStore } from "@/lib/admin/server";
import type { ActionState } from "@/lib/admin/types";

const FUELS = FUEL_TYPES.map((f) => f.value) as [string, ...string[]];
const optionalIdField = z.preprocess((v) => (v === "" ? undefined : v), idSchema.optional());

const makeSchema = z.object({
  id: optionalIdField,
  name: requiredText("Name", 60),
  slug: slugField,
  logo: mediaUrl(),
  sortOrder: intField("Sort order", -1000, 10_000),
});

export async function saveMake(_: ActionState, formData: FormData): Promise<ActionState> {
  await assertAdmin();
  const parsed = makeSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const { id, ...data } = parsed.data;
  try {
    const make = id ? await prisma.vehicleMake.update({ where: { id }, data }) : await prisma.vehicleMake.create({ data });
    revalidateAdmin();
    revalidateStore("/", "/shop");
    return done(id ? "Make saved" : "Make created", id ? {} : { redirectTo: `/admin/vehicles?make=${make.id}` });
  } catch (err) {
    return dbError(err);
  }
}

export async function deleteMake(id: string): Promise<ActionState> {
  await assertAdmin();
  const mid = idSchema.parse(id);
  try {
    // Cascades to models and their product compatibility rows.
    await prisma.vehicleMake.delete({ where: { id: mid } });
    revalidateAdmin();
    revalidateStore("/", "/shop");
    return done("Make deleted", { redirectTo: "/admin/vehicles" });
  } catch (err) {
    return dbError(err);
  }
}

const modelSchema = z
  .object({
    id: optionalIdField,
    makeId: idSchema,
    name: requiredText("Name", 60),
    slug: slugField,
    type: z.enum(["CAR", "BIKE"]),
    yearFrom: intField("Year from", 1950, 2100),
    yearTo: optionalInt("Year to", 1950, 2100),
  })
  .refine((d) => d.yearTo === null || d.yearTo >= d.yearFrom, { message: "Year to must be after year from", path: ["yearTo"] });

export async function saveModel(_: ActionState, formData: FormData): Promise<ActionState> {
  await assertAdmin();
  const parsed = modelSchema.safeParse(formObject(formData));
  if (!parsed.success) return invalid(parsed.error);
  const fuels = z.array(z.enum(FUELS)).safeParse(formData.getAll("fuelTypes"));
  if (!fuels.success) return failed("Choose valid fuel types", { fuelTypes: "Invalid fuel type" });
  const { id, ...data } = parsed.data;
  try {
    const make = await prisma.vehicleMake.findUnique({ where: { id: data.makeId }, select: { id: true } });
    if (!make) return failed("Make not found");
    const payload = { ...data, fuelTypes: fuels.data };
    if (id) await prisma.vehicleModel.update({ where: { id }, data: payload });
    else await prisma.vehicleModel.create({ data: payload });
    revalidateAdmin();
    revalidateStore("/", "/shop");
    return done(id ? "Model saved" : "Model added");
  } catch (err) {
    return dbError(err);
  }
}

export async function deleteModel(id: string): Promise<ActionState> {
  await assertAdmin();
  const mid = idSchema.parse(id);
  try {
    await prisma.vehicleModel.delete({ where: { id: mid } });
    revalidateAdmin();
    revalidateStore("/", "/shop");
    return done("Model deleted");
  } catch (err) {
    return dbError(err);
  }
}
