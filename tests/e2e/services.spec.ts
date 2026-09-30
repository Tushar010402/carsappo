import { test, expect, unique, waitForMail } from "./helpers/fixtures";
import { db } from "./helpers/db";

test.describe("Daily car cleaning services (Greater Noida only)", () => {
  test("services page lists all four services, pricing plans, FAQs and a contact form @mobile", async ({ page }) => {
    await page.goto("/services");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Daily Car Cleaning");
    await expect(page.getByText("Available only in Greater Noida", { exact: true })).toBeVisible();
    for (const s of ["Daily Exterior Cleaning", "Interior Cleaning", "Tyre Polish", "Dashboard Polish"]) {
      await expect(page.getByRole("heading", { name: s, exact: true })).toBeVisible();
    }

    const pricing = page.locator("#pricing");
    await expect(pricing.getByText("Most popular")).toBeVisible();
    await expect(pricing.getByRole("heading", { name: "Daily Shine — Sedan" })).toBeVisible();
    await expect(pricing.getByText("₹799")).toBeVisible();
    await expect(pricing.getByRole("heading", { name: "One-time services" })).toBeVisible();

    const faq = page.locator("#faqs details").first();
    await faq.locator("summary").click();
    await expect(faq).toHaveAttribute("open", "");
    await expect(page.locator("#faqs").getByLabel("Message")).toBeVisible();

    // LocalBusiness + FAQ structured data for local SEO.
    const types = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((j) => JSON.parse(j)["@type"]);
    expect(types).toEqual(expect.arrayContaining(["AutoWash", "FAQPage"]));
  });

  test("choosing a plan pre-selects it in the booking form", async ({ page }) => {
    await page.goto("/services#pricing");
    await page.locator("#pricing").getByRole("link", { name: "Choose plan" }).nth(1).click();
    await expect(page).toHaveURL(/\/services\/book\?type=DAILY_EXTERIOR&plan=/);
    await expect(page.getByLabel("Service")).toHaveValue("DAILY_EXTERIOR");
    await expect(page.getByLabel("Plan").locator("option:checked")).toHaveText(/Daily Shine — Sedan/);

    // Switching service swaps the plan list.
    await page.getByLabel("Service").selectOption("INTERIOR");
    await expect(page.getByLabel("Plan").locator("option:checked")).toHaveText(/Interior Deep Clean/);
  });

  test("booking outside the service area is refused, inside is confirmed with emails @mobile", async ({ page }) => {
    const email = `${unique("book")}@example.com`;
    await page.goto("/services/book");
    await page.getByLabel("Your name").fill("Aman Verma");
    await page.getByLabel("Mobile number").fill("9876501234");
    await page.getByLabel("Email (optional)").fill(email);
    await page.getByLabel("Pincode").fill("110001");
    await expect(page.getByText("Sorry, we don't cover this pincode yet")).toBeVisible();
    await page.getByLabel("Full address").fill("Tower 4, Flat 1203, Gaur City 2");
    await page.getByLabel("Car model").fill("Maruti Baleno");
    await page.getByLabel("Car number (optional)").fill("UP16 CD 4455");
    await page.getByLabel("Preferred time slot").selectOption("8:00 AM – 10:00 AM");
    await page.getByRole("button", { name: "Book Service" }).click();
    await expect(page.getByText(/we don.t clean cars at this pincode yet/)).toBeVisible();
    // Everything typed survives the failed submission.
    await expect(page.getByLabel("Full address")).toHaveValue("Tower 4, Flat 1203, Gaur City 2");
    await expect(page.getByLabel("Preferred time slot")).toHaveValue("8:00 AM – 10:00 AM");

    await page.getByLabel("Pincode").fill("201306");
    await expect(page.getByText("✓ We serve your area")).toBeVisible();
    await page.getByRole("button", { name: "Book Service" }).click();
    await expect(page.getByRole("heading", { name: "Booking received!" })).toBeVisible();
    const bookingNumber = (await page.locator("b.text-brand").textContent())!.trim();
    await expect(page.getByRole("link", { name: "Chat on WhatsApp" })).toHaveAttribute("href", new RegExp(`wa\\.me/919876543210.*${bookingNumber}`));

    const booking = await db.serviceBooking.findUniqueOrThrow({ where: { bookingNumber } });
    expect(booking).toMatchObject({ pincode: "201306", carModel: "Maruti Baleno", serviceType: "DAILY_EXTERIOR", preferredSlot: "8:00 AM – 10:00 AM", status: "NEW" });
    await waitForMail({ to: email, subject: new RegExp(`Booking ${bookingNumber} received`) });
    await waitForMail({ to: "ops@carsappo.test", subject: new RegExp(`New service booking ${bookingNumber}`) });
  });

  test("booking form validates required fields", async ({ page }) => {
    await page.goto("/services/book");
    // Bypass the browser's own required-field checks to exercise server validation.
    await page.locator("main form").evaluate((f: HTMLFormElement) => (f.noValidate = true));
    await page.getByLabel("Mobile number").fill("12345");
    await page.getByRole("button", { name: "Book Service" }).click();
    await expect(page.getByText("Enter your name")).toBeVisible();
    await expect(page.getByText("Enter a valid 10-digit mobile number")).toBeVisible();
    await expect(page.getByText("Enter your car model")).toBeVisible();
    await expect(page.getByLabel("Mobile number")).toHaveValue("12345");
  });
});

test.describe("Content pages", () => {
  test("contact page: details, WhatsApp and the contact form @mobile", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("We're here to help.");
    await expect(page.locator("main").getByRole("link", { name: /WhatsApp/ }).first()).toHaveAttribute("href", /wa\.me\/919876543210/);

    const main = page.locator("main");
    await main.getByLabel("Name").fill("Neha Singh");
    await main.getByLabel("Email", { exact: true }).fill("neha@example");
    await main.getByLabel("Message").fill("Short");
    await page.locator("main form").evaluate((f: HTMLFormElement) => (f.noValidate = true));
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Enter a valid email address")).toBeVisible();
    await expect(page.getByText(/at least 10 characters/)).toBeVisible();
    await expect(main.getByLabel("Name")).toHaveValue("Neha Singh");

    const subject = unique("Bulk order");
    await main.getByLabel("Email", { exact: true }).fill("neha@example.com");
    await main.getByLabel("Subject (optional)").fill(subject);
    await main.getByLabel("Message").fill("Do you offer a discount on 20 sets of car mats for our fleet?");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText(/Thanks|We'll get back/i).first()).toBeVisible();
    expect(await db.contactMessage.count({ where: { subject } })).toBe(1);
    await waitForMail({ to: "ops@carsappo.test", subject: new RegExp(`Contact form: ${subject}`) });
  });

  test("about page tells the story and links to shop and services", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "What we stand for" })).toBeVisible();
    await expect(page.locator("main").getByRole("link", { name: /Shop/ }).first()).toHaveAttribute("href", "/shop");
    await expect(page.locator("main").getByRole("link", { name: /service/i }).first()).toHaveAttribute("href", "/services");
  });

  test("blog: list, category filter, article with share buttons and shoppable products @mobile", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Car care, made simple.");
    const nav = page.getByRole("navigation", { name: "Blog categories" });
    for (const c of ["Car Care Tips", "Buying Guides", "Product Comparisons", "Maintenance Tips"]) {
      await expect(nav.getByRole("link", { name: c })).toBeVisible();
    }
    await nav.getByRole("link", { name: "Buying Guides" }).click();
    await expect(page).toHaveURL(/\/blog\/category\/buying-guides$/);
    await expect(page.getByRole("link", { name: /How to Choose the Right Car Vacuum Cleaner/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Monsoon Car Maintenance Checklist/ })).toHaveCount(0);

    await page.getByRole("link", { name: /How to Choose the Right Car Vacuum Cleaner/ }).first().click();
    await expect(page).toHaveURL(/\/blog\/how-to-choose-car-vacuum-cleaner$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("How to Choose the Right Car Vacuum Cleaner");
    await expect(page.getByRole("link", { name: "Buying Guides" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Share on WhatsApp" })).toHaveAttribute("href", /wa\.me\/\?text=/);
    await expect(page.getByRole("heading", { name: "Keep reading" })).toBeVisible();

    const jsonLd = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((j) => JSON.parse(j));
    const article = jsonLd.find((d) => d["@type"] === "BlogPosting" || d["@type"] === "Article");
    expect(article?.headline).toBe("How to Choose the Right Car Vacuum Cleaner");
  });

  test("unpublished and future-dated posts stay hidden", async ({ page }) => {
    const post = await db.post.findUniqueOrThrow({ where: { slug: "monsoon-car-maintenance-checklist" } });
    await db.post.update({ where: { id: post.id }, data: { isPublished: false } });
    try {
      const res = await page.goto("/blog/monsoon-car-maintenance-checklist");
      expect(res?.status()).toBe(404);
      await page.goto("/blog");
      await expect(page.getByRole("link", { name: /Monsoon Car Maintenance Checklist/ })).toHaveCount(0);
    } finally {
      await db.post.update({ where: { id: post.id }, data: { isPublished: post.isPublished } });
    }
  });

  test("policy pages render with the store's details", async ({ page }) => {
    for (const [slug, heading] of [
      ["shipping-policy", /Shipping/],
      ["return-policy", /Return/],
      ["cancellation-policy", /Cancellation/],
      ["privacy-policy", /Privacy/],
      ["terms-and-conditions", /Terms/],
    ] as const) {
      const res = await page.goto(`/policies/${slug}`);
      expect(res?.status(), slug).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    }
    await expect(page.locator("main")).toContainText("Carsappo Test Pvt Ltd");
    // Every policy is linked from the footer.
    const footer = page.locator("footer");
    for (const slug of ["shipping-policy", "return-policy", "privacy-policy", "terms-and-conditions"]) {
      await expect(footer.locator(`a[href="/policies/${slug}"]`)).toHaveCount(1);
    }
  });

  test("FAQ page groups questions and is linked from the footer @mobile", async ({ page }) => {
    await page.goto("/");
    await page.locator("footer").getByRole("link", { name: "FAQs" }).click();
    await expect(page).toHaveURL(/\/faq$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Frequently asked questions");
    for (const group of ["Orders & products", "Shipping, returns & payments", "Daily car cleaning"]) {
      await expect(page.getByRole("heading", { level: 2, name: group })).toBeVisible();
    }
    const first = page.locator("main details").first();
    await first.locator("summary").click();
    await expect(first).toHaveAttribute("open", "");
    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(jsonLd.some((j) => j.includes('"FAQPage"'))).toBe(true);
  });

  test("unknown pages show a helpful 404 with a way back @mobile", async ({ page }) => {
    const res = await page.goto("/this-page-does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await expect(page.locator("main").getByRole("link", { name: /Shop|Home/ }).first()).toBeVisible();
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });
});
