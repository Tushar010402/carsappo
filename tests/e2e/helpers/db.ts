import { PrismaClient } from "@prisma/client";
import { E2E_DATABASE_URL } from "../env";

/** Direct database access for assertions (the app under test uses the same database). */
export const db = new PrismaClient({ datasources: { db: { url: E2E_DATABASE_URL } } });
