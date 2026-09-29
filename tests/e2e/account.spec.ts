import type { Browser, Page } from "@playwright/test";
import { test, expect, addToCart, fillCheckoutAddress, waitForMail, unique, CUSTOMER_STATE } from "./helpers/fixtures";
import { db } from "./helpers/db";
import { CUSTOMER } from "./env";

/** Places a COD order as the signed-in customer and returns its order number. */
async function placeCodOrder(page: Page, slug: string) {
  await addToCart(page, slug);
  await page.goto("/checkout");
  await page.fill("#c-phone", CUSTOMER.phone);
  if (!(await page.getByRole("button", { name: "+ Add a new address" }).isVisible())) {
    await fillCheckoutAddress(page, { name: CUSTOMER.name, phone: CUSTOMER.phone, line1: "C-404, Galaxy North Avenue", pincode: "201306", city: "Greater Noida West", state: "Uttar Pradesh" });
  }
  await page.getByLabel(/Cash on Delivery/).check();
  await page.getByRole("button", { name: /Place order/ }).click();
  await page.waitForURL(/\/order\/CS\d+/);
  return page.url().match(/order\/(CS\d+)/)![1];
}

async function registerFreshUser(browser: Browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const user = { email: `${unique("user")}@example.com`, password: "Fresh-Pass-123" };
  await page.goto("/register");
  await page.fill("#name", "Fresh User");
  await page.fill("#email", user.email);
  await page.fill("#password", user.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL((u) => u.pathname === "/account");
  return { context, page, user };
}

test.describe("Customer dashboard", () => {
  test.describe.configure({ mode: "serial" });
  test.use({ storageState: CUSTOMER_STATE });

  test("overview with stats and profile update @mobile", async ({ page }) => {
    await page.goto("/account");
    await expect(page.getByRole("heading", { name: /Hi, Riya/ })).toBeVisible();
    for (const link of ["My Orders", "Track Orders", "Wishlist", "Addresses", "Coupons", "Returns", "Notifications", "Invoices"]) {
      await expect(page.getByRole("navigation", { name: "Account" }).getByRole("link", { name: new RegExp(link) })).toBeVisible();
    }
    await page.fill("#pf-phone", "9811122234");
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Profile updated.")).toBeVisible();
    expect((await db.user.findUniqueOrThrow({ where: { email: CUSTOMER.email } })).phone).toBe("9811122234");
  });

  test("my orders, order detail with timeline and invoice, and cancellation restocks", async ({ page }) => {
    const before = (await db.product.findUniqueOrThrow({ where: { slug: "seat-gap-filler-organizer" } })).stock;
    const orderNumber = await placeCodOrder(page, "seat-gap-filler-organizer");
    expect((await db.product.findUniqueOrThrow({ where: { slug: "seat-gap-filler-organizer" } })).stock).toBe(before - 1);

    await page.goto("/account/orders");
    await page.getByRole("link", { name: new RegExp(orderNumber) }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(orderNumber);
    await expect(page.getByText("Confirmed").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Invoice", exact: true })).toHaveAttribute("href", new RegExp(`/invoice/${orderNumber}`));

    await page.getByRole("button", { name: "Cancel order" }).click();
    await page.getByRole("button", { name: "Yes, cancel" }).click();
    await expect(page.getByText("Your order has been cancelled.").first()).toBeVisible();
    await expect(page.getByText("This order was cancelled.")).toBeVisible();
    const order = await db.order.findUniqueOrThrow({ where: { orderNumber } });
    expect(order.status).toBe("CANCELLED");
    expect((await db.product.findUniqueOrThrow({ where: { slug: "seat-gap-filler-organizer" } })).stock).toBe(before);
    await waitForMail({ to: CUSTOMER.email, subject: new RegExp(`Order ${orderNumber} cancelled`) });
  });

  test("returns: request a return on a delivered order", async ({ page }) => {
    const orderNumber = await placeCodOrder(page, "leather-steering-wheel-cover");
    const order = await db.order.update({ where: { orderNumber }, data: { status: "DELIVERED", paymentStatus: "PAID" } });
    await db.orderEvent.create({ data: { orderId: order.id, status: "DELIVERED" } });

    await page.goto(`/account/orders/${orderNumber}`);
    await expect(page.getByRole("heading", { name: "Need to return something?" })).toBeVisible();
    await page.getByLabel("Reason").selectOption("Does not fit my vehicle");
    await page.getByLabel("Details (optional)").fill("Ordered for the wrong wheel size.");
    await page.getByRole("button", { name: "Request return" }).click();
    await expect(page.getByText(/Return requested/).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Return request" })).toBeVisible();

    await page.goto("/account/returns");
    await expect(page.getByRole("link", { name: orderNumber })).toBeVisible();
    await expect(page.getByText("Requested", { exact: true }).first()).toBeVisible();
    await waitForMail({ to: "ops@carsappo.test", subject: new RegExp(`Return request · ${orderNumber}`) });
  });

  test("notifications list order updates and can be marked read", async ({ page }) => {
    await page.goto("/account/notifications");
    await expect(page.getByText(/Order CS\d+ confirmed/).first()).toBeVisible();
    await page.getByRole("button", { name: "Mark all as read" }).click();
    await expect(page.getByRole("button", { name: "Mark all as read" })).toHaveCount(0);
    expect(await db.notification.count({ where: { user: { email: CUSTOMER.email }, isRead: false } })).toBe(0);
  });

  test("invoices and order tracking", async ({ page }) => {
    const orderNumber = await placeCodOrder(page, "door-edge-guards-set-of-4");
    await page.goto("/account/invoices");
    const row = page.getByRole("row", { name: new RegExp(orderNumber) });
    await expect(row).toBeVisible();
    const href = await row.getByRole("link", { name: "Download" }).getAttribute("href");
    await page.goto(href!);
    await expect(page.getByText("TAX INVOICE", { exact: true })).toBeVisible();

    await page.goto("/account/track");
    await expect(page.getByRole("link", { name: new RegExp(orderNumber) })).toBeVisible();
    await expect(page.getByText("Awaiting dispatch").first()).toBeVisible();
  });

  test("addresses: add, edit, set default and delete", async ({ page }) => {
    await page.goto("/account/addresses");
    await page.getByRole("button", { name: "Add address" }).click();
    const dialog = page.getByRole("dialog", { name: "Address" });
    await dialog.locator("#a-name").fill("Office");
    await dialog.locator("#a-phone").fill("9811100000");
    await dialog.locator("#a-line1").fill("Plot 5, Knowledge Park II");
    await dialog.locator("#a-pincode").fill("201310");
    await dialog.locator("#a-city").fill("Greater Noida");
    await dialog.locator("#a-state").selectOption("Uttar Pradesh");
    await dialog.getByRole("button", { name: "Save address" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const card = page.locator("div.rounded-2xl").filter({ hasText: "Plot 5, Knowledge Park II" });
    await expect(card).toBeVisible();

    await card.getByRole("button", { name: "Edit" }).click();
    await page.getByRole("dialog", { name: "Address" }).locator("#a-line1").fill("Plot 7, Knowledge Park II");
    await page.getByRole("dialog", { name: "Address" }).getByRole("button", { name: "Save address" }).click();
    const edited = page.locator("div.rounded-2xl").filter({ hasText: "Plot 7, Knowledge Park II" });
    await expect(edited).toBeVisible();
    await edited.getByRole("button", { name: "Set as default" }).click();
    await expect(edited.getByText("Default")).toBeVisible();
    await edited.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("Plot 7, Knowledge Park II")).toHaveCount(0);
  });

  test("coupons page applies a coupon to the cart", async ({ page }) => {
    await page.goto("/account/coupons");
    await expect(page.getByText("WELCOME10")).toBeVisible();
    await expect(page.getByText("CARCARE150")).toBeVisible();
    await page.locator("div").filter({ hasText: /^CARCARE150/ }).getByRole("button", { name: "Apply to cart" }).first().click();
    await addToCart(page, "nappa-leather-seat-covers-luxe");
    await page.goto("/cart");
    await expect(page.getByText(/CARCARE150 applied/)).toBeVisible();
  });

  test("wishlist syncs with the account", async ({ page }) => {
    await page.goto("/shop?q=inflator");
    await page.getByRole("button", { name: /Add Digital Tyre Inflator.* to wishlist/ }).click();
    await expect(page.getByText("Saved to your wishlist")).toBeVisible();
    await expect.poll(() => db.wishlistItem.count({ where: { user: { email: CUSTOMER.email }, product: { slug: "digital-tyre-inflator" } } })).toBe(1);
    await page.goto("/account/wishlist");
    await expect(page.getByRole("link", { name: "Digital Tyre Inflator with Auto Cut-off", exact: true }).first()).toBeVisible();
    await page.getByRole("button", { name: /Remove Digital Tyre Inflator.* from wishlist/ }).click();
    await expect.poll(() => db.wishlistItem.count({ where: { user: { email: CUSTOMER.email }, product: { slug: "digital-tyre-inflator" } } })).toBe(0);
  });
});

test.describe("Accounts & authentication", () => {
  test("guest wishlist survives reloads and merges into the account on login", async ({ page }) => {
    await page.goto("/shop?q=perfume");
    await page.getByRole("button", { name: /Add Luxury Car Perfume — Oud Noir to wishlist/ }).click();
    await page.reload();
    await expect(page.locator("header").getByRole("link", { name: "Wishlist" })).toContainText("1");
    await page.goto("/wishlist");
    await expect(page.getByRole("link", { name: "Luxury Car Perfume — Oud Noir", exact: true }).first()).toBeVisible();

    await page.goto("/login");
    await page.fill("#email", CUSTOMER.email);
    await page.fill("#password", CUSTOMER.password);
    await page.getByRole("button", { name: "Log in" }).click();
    await page.waitForURL((u) => u.pathname === "/account");
    await expect.poll(() => db.wishlistItem.count({ where: { user: { email: CUSTOMER.email }, product: { slug: "luxury-car-perfume-oud-noir" } } })).toBe(1);
  });

  test("password change, logout, forgot & reset password by email", async ({ browser }) => {
    const { context, page, user } = await registerFreshUser(browser);
    await page.fill("#pw-current", "wrong-password");
    await page.fill("#pw-new", "Newer-Pass-456");
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page.getByText("Current password is incorrect")).toBeVisible();
    await page.fill("#pw-current", user.password);
    await page.fill("#pw-new", "Newer-Pass-456");
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page.getByText("Password updated. Other devices have been signed out.")).toBeVisible();

    await page.getByRole("button", { name: "Log out" }).first().click();
    await page.waitForURL((u) => u.pathname === "/");
    await page.goto("/account");
    await expect(page).toHaveURL(/\/login\?next=%2Faccount/);

    await page.goto("/forgot-password");
    await page.fill("#email", user.email);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText(/If an account exists for that email/)).toBeVisible();
    const mail = await waitForMail({ to: user.email, subject: /Reset your Carsappo password/ });
    const link = mail.html.match(/href="(http[^"]+reset-password[^"]+)"/)![1].replace(/&amp;/g, "&");
    await page.goto(new URL(link).pathname + new URL(link).search);
    await page.fill("#password", "Reset-Pass-789");
    await page.getByRole("button", { name: "Set new password" }).click();
    await page.waitForURL((u) => u.pathname === "/account");

    // The reset link is single-use.
    await page.getByRole("button", { name: "Log out" }).first().click();
    await page.goto(new URL(link).pathname + new URL(link).search);
    await page.fill("#password", "Another-Pass-000");
    await page.getByRole("button", { name: "Set new password" }).click();
    await expect(page.getByText(/invalid or has expired/)).toBeVisible();

    await page.goto("/login");
    await page.fill("#email", user.email);
    await page.fill("#password", "Reset-Pass-789");
    await page.getByRole("button", { name: "Log in" }).click();
    await page.waitForURL((u) => u.pathname === "/account");
    await context.close();
  });

  test("wrong credentials are rejected without revealing which field was wrong", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", CUSTOMER.email);
    await page.fill("#password", "not-the-password");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("Incorrect email or password.")).toBeVisible();
  });

  test("guest orders are linked when the customer later registers", async ({ page }) => {
    const email = `${unique("later")}@example.com`;
    await addToCart(page, "chain-lube-spray-150ml");
    await page.goto("/checkout");
    await fillCheckoutAddress(page, { email, name: "Later User", line1: "22 Civil Lines", pincode: "302006", city: "Jaipur", state: "Rajasthan" });
    await page.getByLabel(/Cash on Delivery/).check();
    await page.getByRole("button", { name: /Place order/ }).click();
    await page.waitForURL(/\/order\/CS\d+/);
    const orderNumber = page.url().match(/order\/(CS\d+)/)![1];
    await page.getByRole("link", { name: "Create account" }).click();
    await expect(page.locator("#email")).toHaveValue(email);
    await page.fill("#name", "Later User");
    await page.fill("#password", "Later-Pass-123");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL((u) => u.pathname === "/account");
    await expect(page.getByRole("link", { name: new RegExp(orderNumber) })).toBeVisible();
  });

  test("guest order tracking by order number and email", async ({ page }) => {
    const order = await db.order.findFirstOrThrow({ where: { userId: null, email: { endsWith: "@example.com" } }, orderBy: { createdAt: "desc" } });
    await page.goto("/track-order");
    await page.fill("#t-order", order.orderNumber);
    await page.fill("#t-contact", "someone-else@example.com");
    await page.getByRole("button", { name: "Track order" }).click();
    await expect(page.getByText("We couldn't find an order with those details.")).toBeVisible();
    await page.fill("#t-contact", order.email);
    await page.getByRole("button", { name: "Track order" }).click();
    await page.waitForURL(new RegExp(`/order/${order.orderNumber}\\?t=`));
    await expect(page.getByRole("heading", { name: "Order status" })).toBeVisible();
  });
});
