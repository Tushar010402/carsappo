import { test, expect, ADMIN_STATE, autoConfirm, unique } from "./helpers/fixtures";
import { db } from "./helpers/db";
import type { Page } from "@playwright/test";

test.use({ storageState: ADMIN_STATE });

/** Submits the AdminForm that contains `button` and waits for its success toast. */
async function save(page: Page, button: string, toast: RegExp) {
  await page.getByRole("button", { name: button }).click();
  await expect(page.getByText(toast).first()).toBeVisible();
}

test.describe("Admin — website editor (homepage, menus, pages)", () => {
  test("homepage: hide and reorder sections, edit the hero trust line", async ({ page }) => {
    const layout = async (action: () => Promise<void>) => {
      await page.goto("/admin/storefront/home");
      await action();
      await save(page, "Save layout", /Homepage updated/);
    };
    const saveTrustLine = async (text: string) => {
      await page.goto("/admin/storefront/home");
      await page.getByLabel("Trust line under the search bar").fill(text);
      await save(page, "Save hero", /Homepage updated/);
    };
    await page.goto("/admin/storefront/home");
    const originalTrust = await page.getByLabel("Trust line under the search bar").inputValue();
    try {
      await layout(async () => {
        await page.getByRole("button", { name: "Hide Why Carsappo" }).click();
        await page.getByRole("button", { name: "Move Daily car cleaning up" }).click();
      });
      await saveTrustLine("Hand-checked parts · {returnDays}-day returns");

      await page.goto("/");
      await expect(page.getByText("Hand-checked parts · 7-day returns")).toBeVisible();
      await expect(page.getByRole("heading", { name: "A car care brand you can trust." })).toHaveCount(0);
      const cleaning = await page.getByRole("heading", { name: "Daily Car Cleaning, at your doorstep." }).boundingBox();
      const reviews = await page.getByRole("heading", { name: "Real cars. Real customers." }).boundingBox();
      expect(cleaning!.y).toBeLessThan(reviews!.y);
    } finally {
      await layout(async () => {
        await page.getByRole("button", { name: "Show Why Carsappo" }).click();
        await page.getByRole("button", { name: "Move Daily car cleaning down" }).click();
      });
      await saveTrustLine(originalTrust);
    }
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "A car care brand you can trust." })).toBeVisible();
  });

  test("menus: add a header menu item and a footer quick link", async ({ page }) => {
    await page.goto("/admin/storefront/navigation");
    const menu = page.locator("form").filter({ has: page.getByRole("button", { name: "Save menu" }) });
    const footer = page.locator("form").filter({ has: page.getByRole("button", { name: "Save footer" }) });
    const items = await menu.getByRole("textbox", { name: /^Label \d+$/ }).count();
    await menu.getByRole("button", { name: "Add menu item" }).click();
    await menu.getByLabel(`Label ${items + 1}`, { exact: true }).fill("Offers");
    await menu.getByLabel(`Link ${items + 1}`, { exact: true }).fill("/shop?offers=1");
    await save(page, "Save menu", /Navigation & footer updated/);
    const links = await footer.getByRole("textbox", { name: /^Label \d+$/ }).count();
    await footer.getByRole("button", { name: "Add link" }).click();
    await footer.getByLabel(`Label ${links + 1}`, { exact: true }).fill("Gift cards");
    await footer.getByLabel(`Link ${links + 1}`, { exact: true }).fill("/shop?q=gift");
    await save(page, "Save footer", /Navigation & footer updated/);

    try {
      await page.goto("/about");
      await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Offers" })).toHaveAttribute("href", "/shop?offers=1");
      await expect(page.getByRole("contentinfo").getByRole("link", { name: "Gift cards" })).toHaveAttribute("href", "/shop?q=gift");
    } finally {
      await page.goto("/admin/storefront/navigation");
      await menu.getByRole("button", { name: "Remove row" }).nth(items).click();
      await save(page, "Save menu", /Navigation & footer updated/);
      await footer.getByRole("button", { name: "Remove row" }).nth(links).click();
      await save(page, "Save footer", /Navigation & footer updated/);
    }
    await page.goto("/about");
    await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Offers" })).toHaveCount(0);
  });

  test("menus: invalid links are rejected", async ({ page }) => {
    await page.goto("/admin/storefront/navigation");
    const menu = page.locator("form").filter({ has: page.getByRole("button", { name: "Save menu" }) });
    await menu.getByLabel("Link 1", { exact: true }).fill("javascript:alert(1)");
    await page.getByRole("button", { name: "Save menu" }).click();
    await expect(menu.getByText("Enter a path like /shop or a full URL").first()).toBeVisible();
  });

  test("policies: customise the return policy with placeholders, then reset it", async ({ page }) => {
    autoConfirm(page);
    await db.page.deleteMany({ where: { slug: "return-policy" } });
    await page.goto("/admin/pages");
    await page.getByRole("button", { name: "Customise Return & Refund Policy" }).click();
    await expect(page).toHaveURL(/\/admin\/pages\/(?!new)[a-z0-9]+$/);
    await expect(page.getByLabel("Title", { exact: true })).toHaveValue("Return & Refund Policy");
    await page.locator('textarea[name="body"]').fill("## Easy returns\n\nReturn anything within {returnDays} days — just message {storeName} on WhatsApp.");
    await save(page, "Save page", /Page saved/);

    await page.goto("/policies/return-policy");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Return & Refund Policy");
    await expect(page.getByRole("heading", { name: "Easy returns" })).toBeVisible();
    await expect(page.getByText("Return anything within 7 days — just message Carsappo on WhatsApp.")).toBeVisible();

    await page.goto("/admin/pages");
    await page.getByRole("link", { name: "Edit Return & Refund Policy" }).click();
    await page.getByRole("button", { name: "Reset to default text" }).click();
    await expect(page).toHaveURL(/\/admin\/pages$/);
    await expect(page.getByRole("button", { name: "Customise Return & Refund Policy" })).toBeVisible();
    await page.goto("/policies/return-policy");
    await expect(page.getByRole("heading", { name: "Easy returns" })).toHaveCount(0);
    await expect(page.getByText(/7 days/).first()).toBeVisible();
  });

  test("custom page: create, show in the footer, then delete", async ({ page }) => {
    autoConfirm(page);
    const title = `Warranty ${unique("")}`;
    await page.goto("/admin/pages");
    await page.getByRole("link", { name: "New page" }).click();
    await page.getByLabel("Title", { exact: true }).fill(title);
    const slug = await page.getByLabel("URL slug").inputValue();
    await page.locator('textarea[name="body"]').fill("## 1-year warranty\n\nAll electronics from {storeName} carry a 1-year replacement warranty.");
    await page.getByRole("button", { name: "Create page" }).click();
    await expect(page).toHaveURL(/\/admin\/pages\/(?!new)[a-z0-9]+$/);

    await page.goto(`/pages/${slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.getByText("All electronics from Carsappo carry a 1-year replacement warranty.")).toBeVisible();
    await expect(page.getByRole("contentinfo").getByRole("link", { name: title })).toHaveAttribute("href", `/pages/${slug}`);

    await page.goto("/admin/pages");
    await page.getByRole("link", { name: `Edit ${title}` }).click();
    await page.getByRole("button", { name: "Delete page" }).click();
    await expect(page).toHaveURL(/\/admin\/pages$/);
    const res = await page.goto(`/pages/${slug}`);
    expect(res?.status()).toBe(404);
  });

  test("About and Contact pages are editable", async ({ page }) => {
    await page.goto("/admin/pages/about");
    const original = await page.locator("#heading").inputValue();
    const heading = `Built for Indian roads ${unique("")}`;
    try {
      await page.locator("#heading").fill(heading);
      await save(page, "Save About page", /About page saved/);
      await page.goto("/about");
      await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
    } finally {
      await page.goto("/admin/pages/about");
      await page.locator("#heading").fill(original);
      await save(page, "Save About page", /About page saved/);
    }

    await page.goto("/admin/pages/contact");
    const hours = await page.getByLabel("Support hours").inputValue();
    try {
      await page.getByLabel("Support hours").fill("Every day, 8 AM – 9 PM");
      await save(page, "Save Contact page", /Contact page saved/);
      await page.goto("/contact");
      await expect(page.getByText("Every day, 8 AM – 9 PM")).toBeVisible();
    } finally {
      await page.goto("/admin/pages/contact");
      await page.getByLabel("Support hours").fill(hours);
      await save(page, "Save Contact page", /Contact page saved/);
    }
  });
});

test.describe("Admin — services, delivery, team and bulk updates", () => {
  test("service content: rename, hide a service and add a time slot", async ({ page }) => {
    const open = async () => {
      await page.goto("/admin/services?tab=content");
      return {
        tyre: page.getByRole("group", { name: "TYRE_POLISH" }),
        dash: page.getByRole("group", { name: "DASHBOARD_POLISH" }),
      };
    };
    let { tyre, dash } = await open();
    const slots = await page.getByRole("textbox", { name: /^e\.g\. 6:00 AM – 8:00 AM \d+$/ }).count();
    await tyre.getByLabel("Service name").fill("Tyre Shine & Protect");
    await dash.getByText("Offer this service").click();
    await page.getByRole("button", { name: "Add time slot" }).click();
    await page.getByLabel(`e.g. 6:00 AM – 8:00 AM ${slots + 1}`, { exact: true }).fill("5:00 PM – 7:00 PM");
    await save(page, "Save service content", /Service content saved/);

    try {
      await page.goto("/services");
      await expect(
        page.getByRole("heading", {
          name: "Tyre Shine & Protect",
          exact: true,
        }),
      ).toBeVisible();
      await expect(page.getByRole("heading", { name: "Dashboard Polish", exact: true })).toHaveCount(0);
      await page.goto("/services/book");
      await expect(page.getByLabel("Service").locator('option[value="DASHBOARD_POLISH"]')).toHaveCount(0);
      await expect(page.getByLabel("Service").locator('option[value="TYRE_POLISH"]')).toHaveText("Tyre Shine & Protect");
      await expect(page.getByLabel("Preferred time slot").locator("option", { hasText: "5:00 PM – 7:00 PM" })).toHaveCount(1);
    } finally {
      ({ tyre, dash } = await open());
      await tyre.getByLabel("Service name").fill("Tyre Polish");
      await dash.getByText("Offer this service").click();
      const added = page.getByLabel(`e.g. 6:00 AM – 8:00 AM ${slots + 1}`, {
        exact: true,
      });
      await expect(added).toHaveValue("5:00 PM – 7:00 PM");
      await added.locator("..").getByRole("button", { name: "Remove", exact: true }).click();
      await save(page, "Save service content", /Service content saved/);
    }
    await page.goto("/services/book");
    await expect(page.getByLabel("Service").locator('option[value="DASHBOARD_POLISH"]')).toHaveCount(1);
    await expect(page.getByLabel("Preferred time slot").locator("option", { hasText: "5:00 PM – 7:00 PM" })).toHaveCount(0);
  });

  test("service content: at least one service must stay visible", async ({ page }) => {
    await page.goto("/admin/services?tab=content");
    for (const type of ["DAILY_EXTERIOR", "INTERIOR", "TYRE_POLISH", "DASHBOARD_POLISH"]) {
      await page.getByRole("group", { name: type }).getByText("Offer this service").click();
    }
    await page.getByRole("button", { name: "Save service content" }).click();
    await expect(page.getByText("Keep at least one service visible").first()).toBeVisible();
  });

  test("delivery zones drive the estimates on product pages and the shipping policy", async ({ page }) => {
    const product = "/product/7d-premium-car-mats-custom-fit";
    await page.goto("/admin/shipping");
    const zones = page.locator("#zones");
    const count = await zones.getByRole("textbox", { name: /^Zone name \d+$/ }).count();
    await zones.getByRole("button", { name: "Add zone" }).click();
    await zones.getByLabel(`Zone name ${count + 1}`, { exact: true }).fill("Noida Express");
    await zones.getByLabel(`Pincode prefixes ${count + 1}`, { exact: true }).fill("2013, 2014");
    await zones.getByLabel(`Min days ${count + 1}`, { exact: true }).fill("1");
    await zones.getByLabel(`Max days ${count + 1}`, { exact: true }).fill("1");
    await save(page, "Save delivery zones", /Delivery zones saved/);

    try {
      await page.goto(product);
      await expect(page.getByText(/Noida Express 1 day/)).toBeAttached();
      await page.goto("/policies/shipping-policy");
      await expect(page.getByRole("row", { name: /Noida Express\s+1 day/ })).toBeVisible();
    } finally {
      await page.goto("/admin/shipping");
      await zones.getByRole("button", { name: "Remove row" }).nth(count).click();
      await save(page, "Save delivery zones", /Delivery zones saved/);
    }
    await page.goto(product);
    await expect(page.getByText(/Noida Express/)).toHaveCount(0);

    // Validation: min can't exceed max.
    await page.goto("/admin/shipping");
    await zones.getByLabel("Min days 1", { exact: true }).fill("9");
    await zones.getByLabel("Max days 1", { exact: true }).fill("2");
    await page.getByRole("button", { name: "Save delivery zones" }).click();
    await expect(zones.getByText("Minimum days can't exceed maximum days").first()).toBeVisible();
  });

  test("team: create a new admin who can sign in, promote a customer, remove access", async ({ page, browser }) => {
    autoConfirm(page);
    const email = `${unique("ops.")}@example.com`;
    const opsName = `Ops Manager ${unique("")}`;
    const promotedName = `Promoted Priya ${unique("")}`;
    await page.goto("/admin/team");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByRole("button", { name: "Add admin" }).click();
    await expect(page.getByText("Set a starting password (at least 8 characters)")).toBeVisible();
    await page.getByLabel("Name", { exact: true }).fill(opsName);
    await page.getByLabel("Starting password").fill("Ops-Admin-Pass-1");
    await page.getByRole("button", { name: "Add admin" }).click();
    await expect(page.getByText(`Admin account created for ${email}`).first()).toBeVisible();
    await expect(page.getByRole("cell", { name: email })).toBeVisible();

    const ctx = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const other = await ctx.newPage();
    await other.goto("/login?next=/admin");
    await other.fill("#email", email);
    await other.fill("#password", "Ops-Admin-Pass-1");
    await other.getByRole("button", { name: "Log in" }).click();
    await other.waitForURL((u) => u.pathname === "/admin");

    const customerEmail = `${unique("promote.")}@example.com`;
    await db.user.create({
      data: { name: promotedName, email: customerEmail, passwordHash: "-" },
    });
    await page.getByLabel("Email", { exact: true }).fill(customerEmail);
    await page.getByRole("button", { name: "Add admin" }).click();
    await expect(page.getByText(`${promotedName} is now an admin`).first()).toBeVisible();

    for (const name of [opsName, promotedName]) {
      await page.getByRole("button", { name: `Remove admin access for ${name}` }).click();
      await expect(page.getByRole("button", { name: `Remove admin access for ${name}` })).toHaveCount(0);
    }
    expect((await db.user.findUniqueOrThrow({ where: { email } })).role).toBe("CUSTOMER");
    expect((await db.user.findUniqueOrThrow({ where: { email: customerEmail } })).role).toBe("CUSTOMER");
    // Removing access signs them out of the admin at once.
    await other.goto("/admin");
    await expect(other).toHaveURL(/\/login/);
    await ctx.close();
  });

  test("inventory: bulk update prices and stock from a CSV", async ({ page }) => {
    const category = await db.category.findFirstOrThrow();
    const sku = unique("E2E-CSV-").toUpperCase();
    const product = await db.product.create({
      data: {
        name: `CSV Test Wax ${sku}`,
        slug: sku.toLowerCase(),
        sku,
        price: 149900,
        mrp: 179900,
        stock: 5,
        categoryId: category.id,
        features: [],
        tags: [],
      },
    });
    const upload = (csv: string) =>
      page.getByLabel("CSV file").setInputFiles({
        name: "inventory.csv",
        mimeType: "text/csv",
        buffer: Buffer.from(csv),
      });
    try {
      await page.goto("/admin/inventory");
      await page.getByRole("link", { name: "Bulk update" }).click();
      await expect(page).toHaveURL(/\/admin\/inventory\/import$/);

      await upload(`SKU,Price (INR),Stock\n${sku},abc,3`);
      await page.getByRole("button", { name: "Apply changes" }).click();
      await expect(page.getByText("Problems — fix these and upload again (1)")).toBeVisible();
      await expect(page.getByText(`Row 2 (${sku}): Price “abc” is not a number`)).toBeVisible();
      expect((await db.product.findUniqueOrThrow({ where: { id: product.id } })).price).toBe(149900);

      await upload(`﻿SKU,Product,Price (INR),MRP (INR),Stock\n${sku.toLowerCase()},ignored,"1,299.00",1999,42\nNO-SUCH-SKU,x,10,,1`);
      await page.getByRole("button", { name: "Check file" }).click();
      await expect(page.getByText(/File checked: 1 to update, 0 unchanged, 1 unknown SKU/).first()).toBeVisible();
      await expect(page.getByText(`${sku}: price ₹1,499 → ₹1,299, MRP ₹1,799 → ₹1,999, stock 5 → 42`)).toBeVisible();
      await expect(page.getByText("SKUs not found (skipped) (1)")).toBeVisible();
      expect((await db.product.findUniqueOrThrow({ where: { id: product.id } })).stock).toBe(5);

      await page.getByRole("button", { name: "Apply changes" }).click();
      await expect(page.getByText("Updated 1 product").first()).toBeVisible();
      const updated = await db.product.findUniqueOrThrow({
        where: { id: product.id },
      });
      expect({
        price: updated.price,
        mrp: updated.mrp,
        stock: updated.stock,
        discountPercent: updated.discountPercent,
      }).toEqual({
        price: 129900,
        mrp: 199900,
        stock: 42,
        discountPercent: 35,
      });
    } finally {
      await db.product.delete({ where: { id: product.id } });
    }
  });
});

test("every admin screen fits on a phone without sideways scrolling", async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 390, height: 844 });
  const [order, customer, booking] = await Promise.all([
    db.order.findFirstOrThrow({ select: { id: true } }),
    db.user.findFirstOrThrow({ where: { role: "CUSTOMER" }, select: { id: true } }),
    db.serviceBooking.findFirst({ select: { id: true } }),
  ]);
  const overflowing: string[] = [];
  for (const path of [
    "/admin",
    "/admin/analytics",
    "/admin/orders",
    `/admin/orders/${order.id}`,
    "/admin/returns",
    "/admin/invoices",
    "/admin/customers",
    `/admin/customers/${customer.id}`,
    "/admin/coupons",
    "/admin/products",
    "/admin/products/new",
    "/admin/categories",
    "/admin/inventory",
    "/admin/inventory/import",
    "/admin/vehicles",
    "/admin/reviews",
    "/admin/storefront/home",
    "/admin/storefront/navigation",
    "/admin/pages",
    "/admin/pages/about",
    "/admin/pages/contact",
    "/admin/pages/new",
    "/admin/banners",
    "/admin/blog",
    "/admin/blog/new",
    "/admin/testimonials",
    "/admin/faqs",
    "/admin/services",
    "/admin/services?tab=plans",
    "/admin/services?tab=content",
    "/admin/services?tab=area",
    ...(booking ? [`/admin/services/bookings/${booking.id}`] : []),
    "/admin/shipping",
    "/admin/seo",
    "/admin/messages",
    "/admin/team",
    "/admin/settings",
  ]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    if (width > 391) overflowing.push(`${path} (${width}px)`);
  }
  expect(overflowing).toEqual([]);
});
