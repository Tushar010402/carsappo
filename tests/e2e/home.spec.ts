import { test, expect, hasHorizontalOverflow } from "./helpers/fixtures";

test.describe("Homepage — every section from the brief", () => {
  test("hero banner: headline, sub-headings and both buttons @mobile", async ({ page }) => {
    await page.goto("/");
    const hero = page.locator("section").first();
    await expect(hero.getByRole("heading", { level: 1 })).toHaveText("Everything Your Car Needs.");
    await expect(hero.getByText("Premium Car Accessories Delivered Across India.")).toBeVisible();
    await expect(hero.getByText("Daily Car Cleaning Services Available in Greater Noida.")).toBeVisible();
    await expect(hero.getByRole("link", { name: "Shop Accessories" })).toHaveAttribute("href", "/shop");
    await expect(hero.getByRole("link", { name: "Explore Services" })).toHaveAttribute("href", "/services");
    await hero.getByRole("link", { name: "Shop Accessories" }).click();
    await expect(page).toHaveURL(/\/shop$/);
    await page.goBack();
    await page.locator("section").first().getByRole("link", { name: "Explore Services" }).click();
    await expect(page).toHaveURL(/\/services$/);
  });

  test("smart search suggests while typing and covers every term in the brief @mobile", async ({ page, request }) => {
    await page.goto("/");
    const search = page.locator("section").first().getByRole("combobox", { name: "Search products" });
    await search.click();
    await search.fill("tyr");
    await expect(page.getByRole("option", { name: /Tyre Polish — Deep Black Shine/ })).toBeVisible();
    await search.fill("perfu");
    await expect(page.getByRole("option", { name: /Car Perfume — Ocean Breeze/ })).toBeVisible();
    await search.press("Enter");
    await expect(page).toHaveURL(/\/shop\?q=perfu/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("perfu");

    for (const term of ["Mats", "Seat Covers", "Tyre Polish", "Dashboard Polish", "Microfiber", "Vacuum Cleaner", "Perfume"]) {
      const res = await request.get(`/api/search/suggest?q=${encodeURIComponent(term)}`);
      const data = await res.json();
      expect(data.products.length, `suggestions for "${term}"`).toBeGreaterThan(0);
    }
  });

  test("shop by vehicle: Brand → Model → Year → Fuel → compatible products @mobile", async ({ page }) => {
    await page.goto("/#shop-by-vehicle");
    const section = page.locator("#shop-by-vehicle");
    await section.getByLabel("Brand").selectOption({ label: "Hyundai" });
    await section.getByLabel("Model").selectOption({ label: "Creta" });
    await section.getByLabel("Year").selectOption("2024");
    await section.getByLabel("Fuel type").selectOption({ label: "Petrol" });
    await section.getByRole("button", { name: /Find parts/ }).click();
    await expect(page).toHaveURL(/make=hyundai&model=creta&year=2024&fuel=PETROL/);
    await expect(page.getByText("Showing products compatible with")).toBeVisible();
    await expect(page.getByText(/^\d+ products$/)).toBeVisible();
    // The brief's example: 7D Mats, Seat Covers, Dashboard Cover, Organizers — browse each category with the car kept selected.
    const expectations: [string, string][] = [
      ["Mats", "7D Premium Car Mats — Custom Fit"],
      ["Seat Covers", "Premium Leatherette Seat Covers — Custom Fit"],
      ["Interior Accessories", "Dashboard Cover — Custom Fit (Anti-Glare)"],
      ["Interior Accessories", "Backseat Organizer with Tablet Holder"],
    ];
    const shopUrl = page.url();
    for (const [category, product] of expectations) {
      await page.goto(shopUrl);
      await page.locator("main").getByRole("link", { name: category, exact: true }).first().click();
      await expect(page).toHaveURL(/make=hyundai&model=creta/);
      await expect(page.getByText("Showing products compatible with")).toBeVisible();
      await expect(page.getByRole("link", { name: product, exact: true }).first()).toBeVisible();
    }
    await page.goto(shopUrl);
    // Bike-only products are excluded for a car.
    await expect(page.getByRole("link", { name: "Waterproof Bike Cover", exact: true })).toHaveCount(0);
  });

  test("shop by category lists all eight categories", async ({ page }) => {
    await page.goto("/");
    for (const name of ["Mats", "Seat Covers", "Car Care", "Interior Accessories", "Exterior Accessories", "Electronics", "Bike Accessories", "Cleaning Essentials"]) {
      await expect(page.locator("main").getByRole("heading", { name, exact: true })).toBeVisible();
    }
    await page.locator("main").getByRole("link", { name: /Electronics/ }).first().click();
    await expect(page).toHaveURL(/\/category\/electronics/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Electronics");
  });

  test("best sellers slider, featured tabs, why Carsappo", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Best Sellers", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Scroll right" }).first()).toBeVisible();

    for (const tab of ["Latest Products", "Premium Collection", "Trending Products"]) {
      await page.getByRole("tab", { name: tab }).click();
      await expect(page.getByRole("tab", { name: tab })).toHaveAttribute("aria-selected", "true");
      await expect(page.getByRole("tabpanel").filter({ visible: true }).locator("article").first()).toBeVisible();
    }
    await page.getByRole("tab", { name: "Premium Collection" }).click();
    await expect(page.getByRole("tabpanel").filter({ visible: true }).getByText("Nappa Leather Seat Covers — Luxe Series")).toBeVisible();

    for (const point of ["Genuine Products", "Wholesale Prices", "Fast Shipping", "Quality Checked", "Secure Payments", "Customer Support"]) {
      await expect(page.getByRole("heading", { name: `✔ ${point}` })).toBeVisible();
    }
  });

  test("customer reviews, daily car cleaning section and Instagram feed", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("tab", { name: "Image Reviews" })).toBeVisible();
    await page.getByRole("tab", { name: "Google Reviews" }).click();
    await expect(page.getByText("Vikas Sharma")).toBeVisible();

    const cleaning = page.locator("section").filter({ hasText: "Daily Car Cleaning, at your doorstep." });
    await expect(cleaning.getByText("Available only in Greater Noida")).toBeVisible();
    for (const s of ["Daily Exterior Cleaning", "Interior Cleaning", "Tyre Polish", "Dashboard Polish"]) {
      await expect(cleaning.getByRole("heading", { name: s })).toBeVisible();
    }
    await expect(cleaning.getByText(/Plans from ₹699/)).toBeVisible();
    await cleaning.getByRole("link", { name: /Book Service/ }).click();
    await expect(page).toHaveURL(/\/services\/book/);

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Follow the Carsappo garage" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Follow on Instagram" })).toHaveAttribute("href", /instagram\.com\/carsappo/);
  });

  test("navigation has every item from the brief", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header");
    await expect(header.getByRole("link", { name: "Carsappo home" })).toBeVisible();
    for (const item of ["Home", "Shop", "Services", "Blog", "About", "Contact"]) {
      await expect(header.getByRole("navigation", { name: "Main" }).getByRole("link", { name: item, exact: true })).toBeVisible();
    }
    await expect(header.getByRole("button", { name: "Search" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Wishlist" })).toBeVisible();
    await expect(header.getByRole("button", { name: /Cart/ })).toBeVisible();
    await expect(header.getByRole("link", { name: "Login" })).toBeVisible();

    // Shop mega menu
    await header.getByRole("link", { name: "Shop", exact: true }).hover();
    await expect(page.getByRole("link", { name: "Select your car" })).toBeVisible();
    // Header search overlay
    await header.getByRole("button", { name: "Search" }).click();
    await expect(header.getByRole("combobox", { name: "Search products" })).toBeFocused();
  });

  test("mobile menu opens, navigates and closes @mobile", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile only");
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog", { name: "Menu" });
    await expect(menu).toBeVisible();
    await menu.getByRole("link", { name: "Blog", exact: true }).click();
    await expect(page).toHaveURL(/\/blog$/);
    await expect(page.getByRole("dialog", { name: "Menu" })).toHaveCount(0);
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });

  test("footer: quick links, policies, categories, services, contact, newsletter, social", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    for (const heading of ["Quick links", "Categories", "Services", "Policies", "Contact", "Join the Carsappo club"]) {
      await expect(footer.getByText(heading, { exact: true })).toBeVisible();
    }
    for (const policy of ["Shipping Policy", "Return & Refund Policy", "Privacy Policy", "Terms & Conditions", "Cancellation Policy"]) {
      await expect(footer.getByRole("link", { name: policy })).toBeVisible();
    }
    await expect(footer.getByRole("link", { name: "Instagram" })).toBeVisible();
    await footer.getByLabel("Email address").fill(`fan-${Date.now()}@example.com`);
    await footer.getByRole("button", { name: "Subscribe" }).click();
    await expect(footer.getByText(/You're in!/)).toBeVisible();
    // WhatsApp support button uses the configured number.
    await expect(page.getByRole("link", { name: "Chat with us on WhatsApp" })).toHaveAttribute("href", /wa\.me\/919876543210/);
  });
});
