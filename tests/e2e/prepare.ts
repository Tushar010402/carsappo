/**
 * Prepares a clean end-to-end environment without destroying any data:
 *   1. E2E_DATABASE_URL set (CI): migrate that (fresh) database.
 *      Otherwise: create a brand-new database named carsappo_e2e_<timestamp> and migrate it.
 *   2. seed demo data + store settings used by the tests
 *   3. build the app into .next-e2e (skip with SKIP_BUILD=1)
 */
import { execSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { ADMIN, E2E_DATABASE_URL, E2E_DB_FILE, LOCAL_POSTGRES_URL, serverEnv } from "./env";

function run(cmd: string, env: Record<string, string>) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", env: { ...process.env, ...serverEnv, ...env } });
}

async function createFreshDatabase() {
  const name = `carsappo_e2e_${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}`;
  const admin = new PrismaClient({ datasources: { db: { url: LOCAL_POSTGRES_URL } } });
  await admin.$executeRawUnsafe(`CREATE DATABASE "${name}"`);
  await admin.$disconnect();
  return LOCAL_POSTGRES_URL.replace("/postgres?", `/${name}?`);
}

async function main() {
  if (process.env.ONLY_BUILD === "1") {
    rmSync(".next-e2e/cache", { recursive: true, force: true });
    run("npx next build", { DATABASE_URL: E2E_DATABASE_URL });
    return;
  }
  const url = process.env.E2E_DATABASE_URL || (await createFreshDatabase());
  mkdirSync("test-results", { recursive: true });
  writeFileSync(E2E_DB_FILE, JSON.stringify({ url }));
  console.log(`E2E database: ${url.replace(/:[^:@/]+@/, ":****@")}`);

  run("npx prisma migrate deploy", { DATABASE_URL: url });
  run("npx tsx prisma/seed.ts", { DATABASE_URL: url, SEED_DEMO: "true", ADMIN_EMAIL: ADMIN.email, ADMIN_PASSWORD: ADMIN.password });

  const prisma = new PrismaClient({ datasources: { db: { url } } });
  const store = { whatsapp: "9876543210", phone: "+91 98765 43210", gstin: "09AAACC1206D1ZM", legalName: "Carsappo Test Pvt Ltd" };
  await prisma.setting.upsert({ where: { key: "store" }, create: { key: "store", value: JSON.stringify(store) }, update: { value: JSON.stringify(store) } });
  await prisma.$disconnect();

  rmSync("test-results/outbox", { recursive: true, force: true });
  rmSync("test-results/uploads", { recursive: true, force: true });
  rmSync("test-results/.auth", { recursive: true, force: true });
  // Cached data (e.g. settings) must not survive between runs.
  rmSync(".next-e2e/cache", { recursive: true, force: true });

  if (process.env.SKIP_BUILD !== "1") run("npx next build", { DATABASE_URL: url });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
