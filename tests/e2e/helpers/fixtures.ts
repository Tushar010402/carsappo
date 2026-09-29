import crypto from "node:crypto";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { test as base, expect, type Page } from "@playwright/test";
import { MOCK_PORT, RAZORPAY_TEST_SECRET } from "../env";

export const ADMIN_STATE = "test-results/.auth/admin.json";
export const CUSTOMER_STATE = "test-results/.auth/customer.json";

export const test = base.extend<{ consoleErrors: string[] }>({
  // Every test fails if the page logs an uncaught error or a console error.
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
      page.on("console", (m) => {
        if (m.type() !== "error") return;
        const text = m.text();
        // Intentionally rejected requests (validation 400s, auth 401s, 404/409 checks) log a resource error; that's expected.
        if (/Failed to load resource: the server responded with a status of (400|401|404|409)/.test(text)) return;
        errors.push(`console: ${text}`);
      });
      await use(errors);
      expect(errors, "no console/page errors").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export function unique(prefix = "u") {
  return `${prefix}${Date.now().toString(36)}${crypto.randomBytes(2).toString("hex")}`;
}

/**
 * Stands in for Razorpay's checkout.js: "pays" by signing the order the same way Razorpay does
 * (HMAC-SHA256 of `order_id|payment_id` with the key secret) and calls the page's handler.
 * mode "dismiss" simulates the customer closing the payment window.
 */
export async function stubRazorpayCheckout(page: Page, mode: "pay" | "dismiss" = "pay") {
  await page.route("https://checkout.razorpay.com/v1/checkout.js", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `
        window.__rzpOpened = [];
        window.Razorpay = function (options) {
          this.options = options;
          this.on = function () {};
          this.open = async function () {
            window.__rzpOpened.push({ order_id: options.order_id, amount: options.amount, key: options.key, prefill: options.prefill });
            if ((window.__rzpMode || ${JSON.stringify(mode)}) === "dismiss") { setTimeout(function () { options.modal && options.modal.ondismiss && options.modal.ondismiss(); }, 50); return; }
            const paymentId = "pay_" + Math.random().toString(36).slice(2, 12);
            const enc = new TextEncoder();
            const key = await crypto.subtle.importKey("raw", enc.encode(${JSON.stringify(RAZORPAY_TEST_SECRET)}), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
            const sig = await crypto.subtle.sign("HMAC", key, enc.encode(options.order_id + "|" + paymentId));
            const hex = Array.from(new Uint8Array(sig)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
            setTimeout(function () { options.handler({ razorpay_order_id: options.order_id, razorpay_payment_id: paymentId, razorpay_signature: hex }); }, 50);
          };
        };`,
    }),
  );
}

export async function mockCalls(): Promise<{ method: string; path: string; body: unknown }[]> {
  const res = await fetch(`http://localhost:${MOCK_PORT}/__calls`);
  return res.json();
}

type Mail = { to: string; subject: string; html: string; sentAt: string };

/** Emails the app sent (captured via MAIL_OUTBOX_DIR). */
export function outbox(filter?: { to?: string; subject?: RegExp }): Mail[] {
  const dir = "test-results/outbox";
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .sort()
    .map((f) => JSON.parse(readFileSync(path.join(dir, f), "utf8")) as Mail)
    .filter((m) => (!filter?.to || m.to === filter.to) && (!filter?.subject || filter.subject.test(m.subject)));
}

export async function waitForMail(filter: { to?: string; subject?: RegExp }, timeout = 10_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const found = outbox(filter);
    if (found.length) return found.at(-1)!;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`No email matching ${JSON.stringify({ to: filter.to, subject: String(filter.subject) })}`);
}

/** Adds a product to the cart from its product page. */
export async function addToCart(page: Page, slug: string, qty = 1) {
  await page.goto(`/product/${slug}`);
  for (let i = 1; i < qty; i++) await page.getByRole("button", { name: "Increase quantity" }).first().click();
  await page.locator("#buy-box").getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByRole("dialog", { name: "Shopping cart" })).toBeVisible();
  await page.getByRole("button", { name: "Close cart" }).click();
}

export async function fillCheckoutAddress(
  page: Page,
  a: { email?: string; phone?: string; name: string; line1: string; pincode: string; city: string; state: string },
) {
  if (a.email) await page.fill("#c-email", a.email);
  await page.fill("#c-phone", a.phone ?? "9876543210");
  await page.fill("#a-name", a.name);
  await page.fill("#a-phone", a.phone ?? "9876543210");
  await page.fill("#a-line1", a.line1);
  await page.fill("#a-pincode", a.pincode);
  await page.fill("#a-city", a.city);
  await page.selectOption("#a-state", a.state);
}

/** Returns true if the document scrolls horizontally (a responsive-layout bug). */
export async function hasHorizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
}
