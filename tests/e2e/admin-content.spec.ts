import { readFileSync } from "node:fs";
import { test, expect, ADMIN_STATE, CUSTOMER_STATE, autoConfirm, unique } from "./helpers/fixtures";
import { db } from "./helpers/db";

test.use({ storageState: ADMIN_STATE });

const PNG = readFileSync("public/images/brand/icon-512.png");

test.describe("Admin — content, settings and SEO", () => {
  test("homepage hero banner can be replaced and removed", async ({ page }) => {
    autoConfirm(page);
    await db.banner.deleteMany({ where: { title: { startsWith: "Monsoon Mega Sale" } } });
    const title = `Monsoon Mega Sale ${unique("")}`;
    await page.goto("/admin/banners");
    await page.getByRole("button", { name: "New banner" }).click();
    const dialog = page.getByRole("dialog", { name: "New banner" });
    await dialog.getByLabel("Placement").selectOption("HOME_HERO");
    await dialog.getByLabel("Sort order").fill("-100");
    await dialog.getByLabel("Title", { exact: true }).fill(title);
    await dialog.getByLabel("Subtitle").fill("Up to 40% off rain-ready accessories.");
    await dialog.getByLabel("Button label").fill("Shop the sale");
    await dialog.getByLabel("Button link").fill("/shop?offers=1");
    await dialog.getByRole("button", { name: /Save|Create/ }).click();
    await expect(dialog).toBeHidden();

    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    const hero = page.locator("section").filter({ has: page.getByRole("heading", { level: 1 }) });
    await expect(hero.getByRole("link", { name: "Shop the sale" })).toHaveAttribute("href", "/shop?offers=1");

    await page.goto("/admin/banners");
    const row = page.locator("li").filter({ hasText: title });
    await expect(row.getByText("Live")).toBeVisible();
    await row.getByRole("button", { name: "Delete banner" }).click();
    await expect(page.locator("li").filter({ hasText: title })).toHaveCount(0);
    expect(await db.banner.count({ where: { title } })).toBe(0);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Everything Your Car Needs.");
  });

  test("video testimonial appears under Video Reviews on the homepage", async ({ page }) => {
    await page.route(/example\.com/, (r) => r.fulfill({ status: 404, body: "" }));
    const name = `Video Vikram ${unique("")}`;
    await page.goto("/admin/testimonials");
    await page.getByRole("button", { name: "Add testimonial" }).click();
    const dialog = page.getByRole("dialog", { name: "New testimonial" });
    await dialog.getByText("Video review", { exact: true }).click();
    await dialog.getByLabel("Customer name").fill(name);
    await dialog.getByLabel("Location / car").fill("Noida · Nexon EV");
    await dialog.getByLabel("Review", { exact: true }).fill("The 7D mats fit perfectly and look factory-fitted.");
    await dialog.locator('input[name="mediaUrl"]').fill("https://example.com/our-story");
    await dialog.getByRole("button", { name: /Save|Add|Create/ }).click();
    await expect(dialog.getByText("Add a YouTube link or upload an MP4 video", { exact: true })).toBeVisible();
    await dialog.locator('input[name="mediaUrl"]').fill("https://youtu.be/dQw4w9WgXcQ");
    await dialog.getByRole("button", { name: /Save|Add|Create/ }).click();
    await expect(dialog).toBeHidden();

    await page.goto("/");
    await page.getByRole("tab", { name: "Video Reviews" }).click();
    await expect(page.getByRole("button", { name: `Play video: Review by ${name}` })).toBeVisible();
    await db.testimonial.deleteMany({ where: { name } });
  });

  test("blog post: create, publish and read on the storefront", async ({ page }) => {
    const title = `Winter Car Care Guide ${unique("")}`;
    await page.goto("/admin/blog/new");
    await page.getByLabel("Title", { exact: true }).fill(title);
    const slug = await page.getByLabel("URL slug").inputValue();
    await page.getByLabel("Excerpt").fill("Keep your battery, wipers and tyres ready for foggy mornings.");
    await page.locator("textarea#content").fill("## Battery\n\nCold mornings are hard on batteries.\n\n## Wipers\n\nReplace worn blades before the fog season.");
    await page.getByLabel("Category").selectOption({ label: "Maintenance Tips" });
    await page.getByText("Published", { exact: true }).click();
    await page.getByRole("button", { name: "Create post" }).click();
    await expect(page).toHaveURL(/\/admin\/blog\/(?!new)[a-z0-9]+$/);

    await page.goto(`/blog/${slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.getByRole("heading", { name: "Wipers" })).toBeVisible();
    await page.goto("/blog/category/maintenance-tips");
    await expect(page.getByRole("link", { name: new RegExp(title) }).first()).toBeVisible();
    await db.post.deleteMany({ where: { slug } });
  });

  test("store settings: WhatsApp number and announcement bar update the storefront", async ({ page }) => {
    await page.goto("/admin/settings");
    const original = { whatsapp: await page.getByLabel("WhatsApp number").inputValue(), announcement: await page.getByLabel("Announcement bar").inputValue() };
    const saveStore = async (whatsapp: string, announcement: string) => {
      await page.goto("/admin/settings");
      await page.getByLabel("WhatsApp number").fill(whatsapp);
      await page.getByLabel("Announcement bar").fill(announcement);
      await page.getByRole("button", { name: "Save store details" }).click();
      await expect(page.getByText(/saved/i).first()).toBeVisible();
    };
    try {
      await saveStore("9123456780", "Diwali sale: extra 10% off with code DIWALI10");
      await page.goto("/product/7d-premium-car-mats-custom-fit");
      await expect(page.getByText("Diwali sale: extra 10% off with code DIWALI10")).toBeVisible();
      await expect(page.locator("#buy-box").getByRole("link", { name: "WhatsApp Enquiry" })).toHaveAttribute("href", /wa\.me\/919123456780/);
    } finally {
      await saveStore(original.whatsapp, original.announcement);
    }
  });

  test("SEO & tracking: invalid IDs are rejected; GA4, GTM and Meta Pixel load on the storefront", async ({ page }) => {
    await page.goto("/admin/seo");
    await page.getByLabel(/Google Analytics 4/).fill("UA-12345-1");
    await page.getByRole("button", { name: "Save tracking IDs" }).click();
    await expect(page.getByText("GA4 Measurement ID looks like G-XXXXXXXXXX", { exact: true })).toBeVisible();
    await expect(page.getByLabel(/Google Analytics 4/)).toHaveValue("UA-12345-1");

    await page.getByLabel(/Google Analytics 4/).fill("G-E2ETEST123");
    await page.getByLabel(/Google Tag Manager/).fill("GTM-E2ETEST");
    await page.getByLabel(/Meta \(Facebook\) Pixel ID/).fill("123456789012345");
    await page.getByRole("button", { name: "Save tracking IDs" }).click();
    await expect(page.getByText(/saved/i).first()).toBeVisible();
    try {
      const requested: string[] = [];
      page.on("request", (r) => requested.push(r.url()));
      await page.goto("/");
      await expect.poll(() => requested.some((u) => u.includes("gtag/js?id=G-E2ETEST123"))).toBe(true);
      await expect.poll(() => requested.some((u) => u.includes("gtm.js?id=GTM-E2ETEST"))).toBe(true);
      await expect.poll(() => requested.some((u) => u.includes("connect.facebook.net/en_US/fbevents.js"))).toBe(true);
      await expect.poll(() => page.evaluate(() => typeof (window as unknown as { fbq?: unknown }).fbq)).toBe("function");
      await expect.poll(() => page.evaluate(() => JSON.stringify((window as unknown as { dataLayer?: unknown[] }).dataLayer ?? []))).toContain("G-E2ETEST123");

      // Staff activity is never tracked.
      requested.length = 0;
      await page.goto("/admin");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      // A negative check has no event to wait for; "networkidle" is unreliable here because link
      // prefetches cancelled by the navigation never report completion. Give client scripts a moment.
      await page.waitForTimeout(1500);
      expect(requested.filter((u) => /googletagmanager|facebook\.net/.test(u))).toEqual([]);
      expect(await page.evaluate(() => typeof (window as unknown as { fbq?: unknown }).fbq)).toBe("undefined");
      await expect(page.locator('script[src*="googletagmanager"], script[src*="fbevents"]')).toHaveCount(0);
    } finally {
      await page.goto("/admin/seo");
      await page.getByLabel(/Google Analytics 4/).fill("");
      await page.getByLabel(/Google Tag Manager/).fill("");
      await page.getByLabel(/Meta \(Facebook\) Pixel ID/).fill("");
      await page.getByRole("button", { name: "Save tracking IDs" }).click();
      await expect(page.getByText(/saved/i).first()).toBeVisible();
    }
  });

  test("admin is on mobile too: the sidebar opens from the menu button", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/admin/orders");
    await page.getByRole("button", { name: "Open menu" }).click();
    const nav = page.getByRole("navigation", { name: "Admin navigation" });
    await nav.getByRole("link", { name: "Products" }).click();
    await expect(page).toHaveURL(/\/admin\/products/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });
});

test.describe("Admin access control", () => {
  test("guests are sent to login and customers are kept out", async ({ browser }) => {
    const guest = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const gp = await guest.newPage();
    await gp.goto("/admin/orders");
    await expect(gp).toHaveURL(/\/login\?next=%2Fadmin%2Forders/);
    await guest.close();

    const customer = await browser.newContext({ storageState: CUSTOMER_STATE });
    const cp = await customer.newPage();
    await cp.goto("/admin");
    await expect(cp).toHaveURL(/\/$/);
    for (const url of ["/admin/inventory/export", "/admin/invoices/export"]) {
      const res = await cp.request.get(url, { maxRedirects: 0 });
      expect([302, 307, 401], url).toContain(res.status());
    }
    const upload = await cp.request.post("/api/admin/upload", { multipart: { file: { name: "x.png", mimeType: "image/png", buffer: PNG } } });
    expect(upload.status()).toBe(401);
    await customer.close();
  });
});
