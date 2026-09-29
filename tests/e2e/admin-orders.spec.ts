import { test, expect, ADMIN_STATE, autoConfirm, mockCalls, placeOrderViaApi, unique, waitForMail } from "./helpers/fixtures";
import { db } from "./helpers/db";

test.use({ storageState: ADMIN_STATE });

async function productId(slug: string) {
  return (await db.product.findUniqueOrThrow({ where: { slug }, select: { id: true } })).id;
}

test.describe("Admin — orders, shipping, payments and returns", () => {
  test("dashboard and analytics summarise the store", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("navigation", { name: "Admin navigation" })).toBeVisible();
    for (const t of ["Revenue · last 14 days", "Recent orders", "Low stock", "Recent bookings"]) {
      await expect(page.getByRole("heading", { name: t })).toBeVisible();
    }
    await page.getByRole("navigation", { name: "Admin navigation" }).getByRole("link", { name: "Analytics" }).click();
    await expect(page).toHaveURL(/\/admin\/analytics/);
    for (const t of ["Revenue by day", "Orders by status", "Payment methods", "Revenue by category", "Top 10 products", "Coupon usage"]) {
      await expect(page.getByRole("heading", { name: t })).toBeVisible();
    }
  });

  test("COD order: Shiprocket shipment, AWB, pickup, label, tracking sync, delivery and cash collection", async ({ page }) => {
    autoConfirm(page);
    const email = `${unique("cod")}@example.com`;
    const orderNumber = await placeOrderViaApi(page.request, { items: [{ productId: await productId("tyre-polish-deep-black-500ml"), quantity: 2 }], email, method: "COD" });
    const order = await db.order.findUniqueOrThrow({ where: { orderNumber } });

    await page.goto("/admin/orders");
    await page.getByRole("searchbox").fill(orderNumber);
    await page.keyboard.press("Enter");
    await page.getByRole("link", { name: orderNumber }).first().click();
    await expect(page).toHaveURL(new RegExp(`/admin/orders/${order.id}`));
    await expect(page.getByRole("heading", { level: 1 })).toContainText(orderNumber);

    await page.getByRole("button", { name: "Create shipment" }).click();
    await expect(page.getByText(/Shiprocket order \d+ created/)).toBeVisible();
    await page.getByRole("button", { name: "Assign AWB" }).click();
    await expect(page.getByText(/AWB E2EAWB1234567 assigned \(Delhivery Surface\)/)).toBeVisible();
    await page.getByRole("button", { name: "Request pickup" }).click();
    await expect(page.getByText("Pickup requested", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Generate label" }).click();
    await expect(page.getByRole("link", { name: "Download label" })).toHaveAttribute("href", "http://localhost:4010/label.pdf");

    await page.getByRole("button", { name: "Sync tracking" }).click();
    await expect(page.getByText(/Courier status: Out For Delivery/)).toBeVisible();
    await expect.poll(async () => (await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("OUT_FOR_DELIVERY");

    const calls = (await mockCalls()).map((c) => c.path);
    expect(calls).toEqual(expect.arrayContaining(["/shiprocket/orders/create/adhoc", "/shiprocket/courier/assign/awb", "/shiprocket/courier/generate/pickup", "/shiprocket/courier/generate/label"]));

    // Status update notifies the customer; the timeline is visible on their order page.
    await page.getByLabel("New status").selectOption("DELIVERED");
    await page.getByLabel("Note (optional)").fill("Handed to security desk");
    await page.getByRole("button", { name: "Update status" }).click();
    await expect(page.getByText(/Currently: Delivered/)).toBeVisible();
    await waitForMail({ to: email, subject: new RegExp(`${orderNumber}.*delivered`, "i") });

    await page.getByRole("button", { name: "Mark COD as paid" }).click();
    await expect.poll(async () => (await db.order.findUniqueOrThrow({ where: { id: order.id } })).paymentStatus).toBe("PAID");

    await page.goto(`/order/${orderNumber}?t=${order.accessToken}`);
    await expect(page.getByText("Handed to security desk")).toBeVisible();
    await expect(page.getByText("E2EAWB1234567").first()).toBeVisible();
  });

  test("manual courier details for orders shipped outside Shiprocket", async ({ page }) => {
    const email = `${unique("man")}@example.com`;
    const orderNumber = await placeOrderViaApi(page.request, { items: [{ productId: await productId("tyre-polish-deep-black-500ml"), quantity: 1 }], email, method: "COD" });
    const order = await db.order.findUniqueOrThrow({ where: { orderNumber } });
    await page.goto(`/admin/orders/${order.id}`);
    await page.locator("summary", { hasText: "Courier details (manual)" }).click();
    await page.getByLabel("Courier", { exact: true }).fill("Blue Dart");
    await page.getByLabel("AWB / tracking no.").fill("BD99887766");
    await page.getByLabel("Tracking URL").fill("https://www.bluedart.com/tracking?awb=BD99887766");
    await page.getByText("Also mark as shipped").click();
    await page.getByRole("button", { name: "Save courier details" }).click();
    await expect(page.getByText(/Currently: Shipped/)).toBeVisible();
    const saved = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(saved).toMatchObject({ courierName: "Blue Dart", awbCode: "BD99887766", status: "SHIPPED" });
    await waitForMail({ to: email, subject: new RegExp(`${orderNumber}.*shipped`, "i") });
  });

  test("Razorpay order: partial then full refund through Razorpay", async ({ page }) => {
    autoConfirm(page);
    await db.product.update({ where: { slug: "ceramic-coating-spray-500ml" }, data: { stock: 50 } });
    const email = `${unique("rzp")}@example.com`;
    const orderNumber = await placeOrderViaApi(page.request, { items: [{ productId: await productId("ceramic-coating-spray-500ml"), quantity: 1 }], email, method: "RAZORPAY", state: "Karnataka" });
    const order = await db.order.findUniqueOrThrow({ where: { orderNumber } });
    expect(order.paymentStatus).toBe("PAID");

    await page.goto(`/admin/orders/${order.id}`);
    await page.locator("summary", { hasText: "Refund" }).click();
    await page.getByLabel("Amount").fill("100");
    await page.getByLabel("Reason (internal)").fill("Scratched cap");
    await page.getByRole("button", { name: "Refund", exact: true }).click();
    await expect(page.getByText("Partial refund of ₹100 initiated", { exact: true })).toBeVisible();
    let saved = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(saved.refundedAmount).toBe(10_000);
    expect(saved.paymentStatus).toBe("PAID");
    const refundCall = (await mockCalls()).findLast((c) => c.path === `/razorpay/v1/payments/${order.razorpayPaymentId}/refund`);
    expect(refundCall?.body).toMatchObject({ amount: 10_000 });
    await waitForMail({ to: email, subject: new RegExp(`Refund initiated for order ${orderNumber}`) });

    // Refunding more than the balance is refused; an empty amount refunds the rest.
    await page.reload();
    await page.locator("summary", { hasText: "Refund" }).click();
    await page.getByRole("button", { name: "Refund", exact: true }).click();
    await expect(page.getByText(/^Full refund of ₹[\d,.]+ initiated$/)).toBeVisible();
    saved = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(saved.refundedAmount).toBe(saved.total);
    expect(saved.paymentStatus).toBe("REFUNDED");
  });

  test("returns: approve, then refund and restock", async ({ page }) => {
    autoConfirm(page);
    const slug = "microfiber-cloth-800gsm-pack-of-3";
    await db.product.update({ where: { slug }, data: { stock: 100 } });
    const email = `${unique("ret")}@example.com`;
    const orderNumber = await placeOrderViaApi(page.request, { items: [{ productId: await productId(slug), quantity: 2 }], email, method: "COD" });
    const order = await db.order.update({ where: { orderNumber }, data: { status: "DELIVERED", paymentStatus: "PAID" } });
    await db.returnRequest.create({ data: { orderId: order.id, reason: "Received a damaged product", details: "Torn packaging" } });
    expect((await db.product.findUniqueOrThrow({ where: { slug } })).stock).toBe(98);

    await page.goto("/admin/returns");
    const row = page.getByRole("row").filter({ hasText: orderNumber });
    await row.getByRole("button", { name: "Manage" }).click();
    let dialog = page.getByRole("dialog", { name: `Return · ${orderNumber}` });
    await dialog.getByLabel("Status").selectOption("APPROVED");
    await dialog.getByLabel("Note").fill("Pickup on Friday");
    await dialog.getByRole("button", { name: "Update return" }).click();
    await expect(dialog).toBeHidden();
    await waitForMail({ to: email, subject: new RegExp(`Return approved · order ${orderNumber}`) });

    await page.getByRole("row").filter({ hasText: orderNumber }).getByRole("button", { name: "Manage" }).click();
    dialog = page.getByRole("dialog", { name: `Return · ${orderNumber}` });
    await dialog.getByLabel("Status").selectOption("REFUNDED");
    await expect(dialog.getByText("COD order: records a refund you paid by UPI / bank.")).toBeVisible();
    await dialog.getByRole("button", { name: "Update return" }).click();
    await expect(dialog).toBeHidden();

    const saved = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(saved.status).toBe("RETURNED");
    expect(saved.paymentStatus).toBe("REFUNDED");
    expect((await db.product.findUniqueOrThrow({ where: { slug } })).stock).toBe(100);
  });

  test("GST invoices register and CSV export", async ({ page }) => {
    const orderNumber = await placeOrderViaApi(page.request, { items: [{ productId: await productId("tyre-polish-deep-black-500ml"), quantity: 1 }], email: `${unique("inv")}@example.com`, method: "COD" });
    const order = await db.order.findUniqueOrThrow({ where: { orderNumber } });
    await page.goto("/admin/invoices");
    await expect(page.getByText(order.invoiceNumber!).first()).toBeVisible();
    const href = await page.getByRole("link", { name: /Export CSV for GST filing/ }).getAttribute("href");
    const res = await page.request.get(href!);
    expect(res.headers()["content-type"]).toContain("text/csv");
    const csv = await res.text();
    expect(csv.split("\n")[0]).toMatch(/Invoice No.*HSN\/SAC.*CGST.*SGST.*IGST/);
    expect(csv).toContain(order.invoiceNumber!);
  });

  test("service bookings and contact messages reach the admin", async ({ page }) => {
    const booking = await db.serviceBooking.create({
      data: {
        bookingNumber: `SB${Date.now().toString().slice(-6)}`,
        name: "Admin Booking Test",
        phone: "9876512345",
        address: "Tower 2, Flat 804",
        pincode: "201310",
        carModel: "Kia Seltos",
        serviceType: "INTERIOR",
        preferredDate: new Date(),
        preferredSlot: "8:00 AM – 10:00 AM",
      },
    });
    await page.goto("/admin/services");
    await page.getByRole("link", { name: booking.bookingNumber }).first().click();
    await expect(page).toHaveURL(new RegExp(`/admin/services/bookings/${booking.id}`));
    await expect(page.getByRole("link", { name: "9876512345" }).first()).toHaveAttribute("href", "tel:9876512345");
    await page.getByLabel("Status").selectOption("CONFIRMED");
    await page.getByLabel("Internal note").fill("Cleaner: Ravi");
    await page.getByRole("button", { name: "Save booking" }).click();
    await expect.poll(async () => (await db.serviceBooking.findUniqueOrThrow({ where: { id: booking.id } })).status).toBe("CONFIRMED");

    const subject = unique("Fleet enquiry");
    await db.contactMessage.create({ data: { name: "Fleet Owner", email: "fleet@example.com", subject, message: "Need 30 dash cams for our taxis." } });
    await page.goto("/admin/messages");
    await expect(page.getByText(subject)).toBeVisible();
  });
});
