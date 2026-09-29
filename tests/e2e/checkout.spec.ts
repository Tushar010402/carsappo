import type { Page } from "@playwright/test";
import { test, expect, addToCart, fillCheckoutAddress, stubRazorpayCheckout, mockCalls, waitForMail, unique, CUSTOMER_STATE } from "./helpers/fixtures";
import { db } from "./helpers/db";
import { CUSTOMER, RAZORPAY_TEST_WEBHOOK_SECRET } from "./env";
import crypto from "node:crypto";

const rupees = (text: string) => Number(text.replace(/[^\d.]/g, ""));

async function summaryValue(page: Page, label: string | RegExp) {
  const row = page.locator("div.flex.items-center.justify-between").filter({ hasText: label }).last();
  return rupees(await row.locator("span").last().innerText());
}

test.describe("Cart", () => {
  test("summary, shipping threshold, GST, coupons and estimated delivery @mobile", async ({ page }) => {
    await addToCart(page, "tyre-polish-deep-black-500ml");
    await page.goto("/cart");
    await expect(page.getByRole("heading", { name: "Your cart" })).toBeVisible();
    await expect(page.getByText("Tyre Polish — Deep Black Shine (500 ml)").first()).toBeVisible();

    // Below ₹999 → ₹79 shipping and a nudge towards free shipping.
    await expect(page.getByText(/more for free shipping/)).toBeVisible();
    expect(await summaryValue(page, "Shipping")).toBe(79);
    await expect(page.getByText("GST (included)")).toBeVisible();
    await expect(page.getByText(/Estimated delivery/)).toBeVisible();

    // Invalid coupon, then a coupon whose minimum isn't met, then a valid one.
    await page.getByLabel("Coupon code").fill("NOPE");
    await page.getByRole("button", { name: "Apply", exact: true }).click();
    await expect(page.getByText("This coupon code is not valid")).toBeVisible();
    const summary = page.getByRole("complementary");
    await summary.getByRole("button", { name: "Remove", exact: true }).click();
    await page.getByLabel("Coupon code").fill("CARCARE150");
    await page.getByRole("button", { name: "Apply", exact: true }).click();
    await expect(page.getByText(/more to use CARCARE150/)).toBeVisible();
    await summary.getByRole("button", { name: "Remove", exact: true }).click();
    await page.getByRole("button", { name: /WELCOME10/ }).click();
    await expect(page.getByText(/WELCOME10 applied/)).toBeVisible();
    expect(await summaryValue(page, "Coupon (WELCOME10)")).toBeCloseTo(34.9, 1);

    // Quantity 3 → ₹1,047 subtotal, but free shipping is judged after the discount (₹942.30 < ₹999).
    await page.getByRole("button", { name: "Increase quantity" }).click();
    await page.getByRole("button", { name: "Increase quantity" }).click();
    await expect(page.getByText("Subtotal (3 items)")).toBeVisible();
    await expect.poll(() => summaryValue(page, "Order total")).toBeCloseTo(1047 - 104.7 + 79, 1);
    expect(await summaryValue(page, "Shipping")).toBe(79);
    // Without the coupon it crosses ₹999 → free shipping.
    await page.getByRole("button", { name: "Remove coupon" }).click();
    await expect(page.getByText("FREE", { exact: true })).toBeVisible();
    await expect.poll(() => summaryValue(page, "Order total")).toBe(1047);

    await page.locator("main li").getByRole("button", { name: "Remove" }).click();
    await expect(page.getByRole("heading", { name: "Your cart is empty" })).toBeVisible();
  });
});

test.describe("Checkout", () => {
  test("validates required fields and pincode", async ({ page }) => {
    await addToCart(page, "microfiber-cloth-800gsm-pack-of-3");
    await page.goto("/checkout");
    await page.getByLabel(/Cash on Delivery/).check();
    await page.getByRole("button", { name: /Place order/ }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Please fix the highlighted fields." })).toBeVisible();
    await expect(page.getByText("Enter a valid email address")).toBeVisible();
    await expect(page.getByText("Enter a valid 10-digit mobile number").first()).toBeVisible();
    await expect(page.getByText("Enter a valid 6-digit pincode")).toBeVisible();
    await expect(page.getByText("Select a state")).toBeVisible();
  });

  test("guest COD order: confirmation, stock, GST invoice (CGST+SGST) and emails @mobile", async ({ page }, testInfo) => {
    const email = `${unique("guest")}@example.com`;
    // Each project buys a different product so parallel runs don't race on stock.
    const slug = testInfo.project.name === "mobile" ? "ph-neutral-car-shampoo-1l" : "dashboard-polish-matte-300ml";
    const before = await db.product.findUniqueOrThrow({ where: { slug } });
    await addToCart(page, slug, 2);
    await page.goto("/checkout");
    await fillCheckoutAddress(page, { email, name: "Guest Buyer", line1: "Tower 2, Flat 1102, Gaur City", pincode: "201318", city: "Greater Noida West", state: "Uttar Pradesh" });
    await page.getByLabel(/Cash on Delivery/).check();
    await expect(page.getByText("COD charges")).toBeVisible();
    await page.getByRole("button", { name: /Place order/ }).click();

    await page.waitForURL(/\/order\/CS\d+\?t=.+&placed=1/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Thank you, Guest! Your order is confirmed.");
    const orderNumber = page.url().match(/order\/(CS\d+)/)![1];

    const order = await db.order.findUniqueOrThrow({ where: { orderNumber }, include: { items: true } });
    expect(order.status).toBe("CONFIRMED");
    expect(order.paymentMethod).toBe("COD");
    expect(order.subtotal).toBe(before.price * 2);
    expect(order.codFee).toBe(4900);
    expect(order.total).toBe(order.subtotal + order.shippingFee + order.codFee);
    expect(order.invoiceNumber).toMatch(/^CS\/\d{2}-\d{2}\/\d{5}$/);
    const after = await db.product.findUniqueOrThrow({ where: { slug } });
    expect(after.stock).toBe(before.stock - 2);

    // Purchase conversion is pushed to the dataLayer (GA4 / GTM / Ads).
    const purchase = await page.evaluate(() => (window.dataLayer as { event?: string; ecommerce?: { transaction_id?: string } }[]).find((e) => e.event === "purchase"));
    expect(purchase?.ecommerce?.transaction_id).toBe(orderNumber);

    const mail = await waitForMail({ to: email, subject: new RegExp(`Order ${orderNumber} confirmed`) });
    expect(mail.html).toContain(orderNumber);
    await waitForMail({ to: "ops@carsappo.test", subject: new RegExp(`New order ${orderNumber}`) });

    // GST invoice: Uttar Pradesh buyer from a UP seller → CGST + SGST.
    await page.goto((await page.getByRole("link", { name: "Download invoice" }).getAttribute("href"))!);
    await expect(page.getByText("TAX INVOICE", { exact: true })).toBeVisible();
    await expect(page.getByText(/Intra-state \(CGST \+ SGST\)/)).toBeVisible();
    await expect(page.getByText("GSTIN: 09AAACC1206D1ZM")).toBeVisible();
    await expect(page.getByText(/^Rupees .* Only$/)).toBeVisible();

    // The cart was emptied.
    await page.goto("/cart");
    await expect(page.getByRole("heading", { name: "Your cart is empty" })).toBeVisible();
  });

  test("online payment via Razorpay (UPI/cards/net banking) confirms and verifies the order", async ({ page }) => {
    await stubRazorpayCheckout(page, "pay");
    const email = `${unique("rzp")}@example.com`;
    await addToCart(page, "portable-car-vacuum-cleaner-120w");
    await page.goto("/checkout");
    await fillCheckoutAddress(page, { email, name: "Priya Menon", line1: "12 MG Road, Indiranagar", pincode: "560038", city: "Bengaluru", state: "Karnataka" });
    await expect(page.getByLabel(/Pay online/)).toBeChecked();
    await page.getByRole("button", { name: /^Pay ₹/ }).click();
    await page.waitForURL(/\/order\/CS\d+.*placed=1/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Your order is confirmed");

    const orderNumber = page.url().match(/order\/(CS\d+)/)![1];
    const order = await db.order.findUniqueOrThrow({ where: { orderNumber } });
    expect(order.paymentStatus).toBe("PAID");
    expect(order.razorpayPaymentId).toMatch(/^pay_/);
    // Amount sent to Razorpay equals the server-computed total (in paise).
    const created = (await mockCalls()).filter((c) => c.path === "/razorpay/v1/orders" && (c.body as { receipt: string }).receipt === orderNumber);
    expect((created.at(-1)!.body as { amount: number }).amount).toBe(order.total);
    // Inter-state (Karnataka) invoice uses IGST.
    await page.goto((await page.getByRole("link", { name: "Download invoice" }).getAttribute("href"))!);
    await expect(page.getByText(/Inter-state \(IGST\)/)).toBeVisible();
  });

  test("cancelled payment keeps the order and allows retrying", async ({ page }) => {
    await stubRazorpayCheckout(page, "dismiss");
    await addToCart(page, "car-perfume-ocean-breeze");
    await page.goto("/checkout");
    await fillCheckoutAddress(page, { email: `${unique("retry")}@example.com`, name: "Retry Buyer", line1: "4 Park Street", pincode: "700016", city: "Kolkata", state: "West Bengal" });
    await page.getByRole("button", { name: /^Pay ₹/ }).click();
    await expect(page.getByText("Payment was cancelled. Your order is saved — you can retry payment.")).toBeVisible();
    await page.evaluate(() => ((window as unknown as { __rzpMode: string }).__rzpMode = "pay"));
    await page.getByRole("button", { name: /Retry payment/ }).click();
    await page.waitForURL(/\/order\/CS\d+.*placed=1/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Your order is confirmed");
  });

  test("Razorpay webhook confirms an order if the customer never returns", async ({ page, request }) => {
    await stubRazorpayCheckout(page, "dismiss");
    await addToCart(page, "anti-fog-glass-cleaner-500ml");
    await page.goto("/checkout");
    await fillCheckoutAddress(page, { email: `${unique("wh")}@example.com`, name: "Webhook Buyer", line1: "7 Marine Drive", pincode: "400020", city: "Mumbai", state: "Maharashtra" });
    await page.getByRole("button", { name: /^Pay ₹/ }).click();
    await expect(page.getByText(/Payment was cancelled/)).toBeVisible();
    const pending = await db.order.findFirstOrThrow({ where: { shipName: "Webhook Buyer" }, orderBy: { createdAt: "desc" } });
    expect(pending.status).toBe("PENDING");

    const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_webhook123", order_id: pending.razorpayOrderId } } } });
    const bad = await request.post("/api/webhooks/razorpay", { data: body, headers: { "x-razorpay-signature": "bad", "content-type": "application/json" } });
    expect(bad.status()).toBe(401);
    const sig = crypto.createHmac("sha256", RAZORPAY_TEST_WEBHOOK_SECRET).update(body).digest("hex");
    for (let i = 0; i < 2; i++) {
      const ok = await request.post("/api/webhooks/razorpay", { data: body, headers: { "x-razorpay-signature": sig, "content-type": "application/json" } });
      expect(ok.status()).toBe(200);
    }
    const confirmed = await db.order.findUniqueOrThrow({ where: { id: pending.id }, include: { events: true } });
    expect(confirmed.status).toBe("CONFIRMED");
    expect(confirmed.paymentStatus).toBe("PAID");
    expect(confirmed.events.filter((e) => e.status === "CONFIRMED")).toHaveLength(1);
  });

  test("COD is unavailable above the COD limit", async ({ page }) => {
    await addToCart(page, "nappa-leather-seat-covers-luxe");
    await page.goto("/checkout");
    await expect(page.getByText("COD is not available for this order.")).toBeVisible();
    await expect(page.getByLabel(/Cash on Delivery/)).toBeDisabled();
  });

  test("server re-checks stock at checkout", async ({ page }) => {
    await db.product.update({ where: { slug: "detailing-brush-set-5pcs" }, data: { stock: 120 } });
    await addToCart(page, "detailing-brush-set-5pcs");
    await db.product.update({ where: { slug: "detailing-brush-set-5pcs" }, data: { stock: 0 } });
    await page.goto("/cart");
    await expect(page.getByText("Detailing Brush Set (5 pcs) is no longer available and was removed from your cart.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your cart is empty" })).toBeVisible();
    await db.product.update({ where: { slug: "detailing-brush-set-5pcs" }, data: { stock: 120 } });
  });
});

test.describe("Checkout as a signed-in customer", () => {
  test.use({ storageState: CUSTOMER_STATE });

  test("saves the address and reuses it next time", async ({ page }) => {
    await addToCart(page, "chenille-microfiber-wash-mitt");
    await page.goto("/checkout");
    await expect(page.getByText(`Signed in as ${CUSTOMER.email}`)).toBeVisible();
    const hasSaved = await page.getByRole("button", { name: "+ Add a new address" }).isVisible();
    if (!hasSaved) {
      await fillCheckoutAddress(page, { name: CUSTOMER.name, phone: CUSTOMER.phone, line1: "C-404, Galaxy North Avenue", pincode: "201306", city: "Greater Noida West", state: "Uttar Pradesh" });
      await expect(page.getByLabel("Save this address for next time")).toBeChecked();
    } else {
      await page.fill("#c-phone", CUSTOMER.phone);
    }
    await page.getByLabel(/Cash on Delivery/).check();
    await page.getByRole("button", { name: /Place order/ }).click();
    await page.waitForURL(/\/order\/CS\d+/);
    expect(await db.address.count({ where: { user: { email: CUSTOMER.email } } })).toBeGreaterThan(0);

    await addToCart(page, "chenille-microfiber-wash-mitt");
    await page.goto("/checkout");
    await expect(page.getByText("C-404, Galaxy North Avenue").first()).toBeVisible();
  });
});
