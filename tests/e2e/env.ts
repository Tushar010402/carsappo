/** Environment for the end-to-end test server. Every integration points at local stand-ins. */
export const E2E_PORT = 3200;
export const MOCK_PORT = 4010;
export const BASE_URL = `http://localhost:${E2E_PORT}`;
import { existsSync, readFileSync } from "node:fs";

/** Where tests/e2e/prepare.ts records the database it created for the current run. */
export const E2E_DB_FILE = "test-results/e2e-db.json";
export const LOCAL_POSTGRES_URL = process.env.E2E_POSTGRES_URL || "postgresql://postgres:postgres@localhost:5432/postgres?schema=public";

function resolveDatabaseUrl() {
  if (process.env.E2E_DATABASE_URL) return process.env.E2E_DATABASE_URL;
  if (existsSync(E2E_DB_FILE)) return (JSON.parse(readFileSync(E2E_DB_FILE, "utf8")) as { url: string }).url;
  return LOCAL_POSTGRES_URL.replace("/postgres?", "/carsappo_e2e?");
}

export const E2E_DATABASE_URL = resolveDatabaseUrl();

export const RAZORPAY_TEST_SECRET = "e2e_rzp_secret";
export const RAZORPAY_TEST_WEBHOOK_SECRET = "e2e_rzp_webhook_secret";
export const SHIPROCKET_TEST_WEBHOOK_TOKEN = "e2e_shiprocket_webhook_token";
export const ADMIN = { email: "admin@carsappo.com", password: "E2e-Admin-Pass-1" };
export const CUSTOMER = { name: "Riya Kapoor", email: "riya.e2e@example.com", password: "E2e-Customer-Pass-1", phone: "9811122233" };

export const serverEnv: Record<string, string> = {
  NODE_ENV: "production",
  NEXT_DIST_DIR: ".next-e2e",
  NEXT_TELEMETRY_DISABLED: "1",
  DATABASE_URL: E2E_DATABASE_URL,
  AUTH_SECRET: "e2e-auth-secret-0123456789abcdefghijklmnopqrstuvwxyz",
  NEXT_PUBLIC_SITE_URL: BASE_URL,
  RAZORPAY_KEY_ID: "rzp_test_e2e",
  RAZORPAY_KEY_SECRET: RAZORPAY_TEST_SECRET,
  RAZORPAY_WEBHOOK_SECRET: RAZORPAY_TEST_WEBHOOK_SECRET,
  RAZORPAY_API_BASE: `http://localhost:${MOCK_PORT}/razorpay/v1`,
  SHIPROCKET_EMAIL: "api@carsappo.test",
  SHIPROCKET_PASSWORD: "e2e",
  SHIPROCKET_API_BASE: `http://localhost:${MOCK_PORT}/shiprocket`,
  SHIPROCKET_WEBHOOK_TOKEN: SHIPROCKET_TEST_WEBHOOK_TOKEN,
  MAIL_OUTBOX_DIR: "test-results/outbox",
  UPLOAD_DIR: "test-results/uploads",
  RATE_LIMIT_DISABLED: "true",
  ADMIN_NOTIFY_EMAIL: "ops@carsappo.test",
};
