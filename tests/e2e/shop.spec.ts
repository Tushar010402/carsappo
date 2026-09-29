import type { Page } from "@playwright/test";
import { test, expect } from "./helpers/fixtures";
import { db } from "./helpers/db";

async function cardPrices(page: Page) {
  const texts = await page.locator("main article").allInnerTexts();
  return texts.map((t) => Number((t.match(/₹([\d,]+)/)?.[1] ?? "0").replace(/,/g, "")));
}

async function resultCount(page: Page) {
  const text = await page.getByText(/^\d+ products?$/).innerText();
  return Number(text.split(" ")[0]);
}

test.describe("Shop page — search, categories, filters, sort", () => {
  test("search from the header overlay shows suggestions and results", async ({ page }) => {
    await page.goto("/shop");
    await page.locator("header").getByRole("button", { name: "Search" }).click();
    const box = page.locator("header").getByRole("combobox", { name: "Search products" });
    await box.fill("vacuum");
    await expect(page.getByRole("option", { name: /Portable Car Vacuum Cleaner — 120W/ })).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/product\/portable-car-vacuum-cleaner-120w/);
  });

  test("category, price, brand, offers, availability and rating filters", async ({ page }) => {
    await page.goto("/shop");
    const all = await resultCount(page);
    expect(all).toBe(await db.product.count({ where: { isActive: true } }));

    // Category
    await page.getByRole("radio", { name: /^Mats/ }).check();
    await expect(page).toHaveURL(/category=mats/);
    await expect.poll(() => resultCount(page)).toBe(await db.product.count({ where: { isActive: true, category: { slug: "mats" } } }));
    await page.getByRole("link", { name: "Clear all" }).click();
    await expect(page).toHaveURL(/\/shop$/);

    // Price preset
    await page.getByRole("link", { name: "Under ₹500" }).click();
    await expect(page).toHaveURL(/max=500/);
    for (const p of await cardPrices(page)) expect(p).toBeLessThanOrEqual(500);

    // Brand
    await page.goto("/shop");
    await page.getByRole("checkbox", { name: "Carsappo Tech" }).check();
    await expect(page).toHaveURL(/brand=carsappo-tech/);
    const brandTexts = await page.locator("main article").allInnerTexts();
    expect(brandTexts.length).toBeGreaterThan(0);
    for (const t of brandTexts) expect(t.toUpperCase()).toContain("CARSAPPO TECH");

    // Offers
    await page.goto("/shop");
    await page.getByRole("checkbox", { name: "On sale / discounted" }).check();
    await expect(page).toHaveURL(/offers=1/);
    await expect(page.getByText("On sale", { exact: true })).toBeVisible();

    // Availability: an out-of-stock product disappears with "In stock only".
    await db.product.update({ where: { slug: "chrome-window-garnish" }, data: { stock: 0 } });
    await page.goto("/shop?q=chrome");
    await expect(page.getByText("Out of stock").first()).toBeVisible();
    await page.getByRole("checkbox", { name: "In stock only" }).check();
    await expect(page).toHaveURL(/inStock=1/);
    await expect(page.getByRole("link", { name: "Chrome Window Garnish", exact: true })).toHaveCount(0);
    await db.product.update({ where: { slug: "chrome-window-garnish" }, data: { stock: 45 } });

    // Rating
    await page.goto("/shop");
    await page.getByRole("radio", { name: "4 & up" }).check();
    await expect(page).toHaveURL(/rating=4/);
    expect(await resultCount(page)).toBe(await db.product.count({ where: { isActive: true, ratingAvg: { gte: 4 } } }));
  });

  test("compatibility filter inside the shop sidebar", async ({ page }) => {
    await page.goto("/shop?category=bike-accessories");
    const aside = page.locator("aside");
    await aside.getByLabel("Brand", { exact: true }).selectOption({ label: "Royal Enfield" });
    await aside.getByLabel("Model").selectOption({ label: "Classic 350" });
    await aside.getByRole("button", { name: /Find parts/ }).click();
    await expect(page).toHaveURL(/make=royal-enfield&model=classic-350/);
    await expect(page).toHaveURL(/category=bike-accessories/);
    await expect(page.getByText("Showing products compatible with")).toBeVisible();
    await expect(page.getByRole("link", { name: "Waterproof Bike Cover", exact: true }).first()).toBeVisible();
    await page.getByRole("link", { name: "Show all products" }).click();
    await expect(page).not.toHaveURL(/make=/);
  });

  test("sort by price, newest and pagination", async ({ page }) => {
    await page.goto("/shop");
    await page.getByLabel("Sort products").selectOption("price-asc");
    await expect(page).toHaveURL(/sort=price-asc/);
    const asc = await cardPrices(page);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));

    await page.getByLabel("Sort products").selectOption("price-desc");
    await expect(page).toHaveURL(/sort=price-desc/);
    const desc = await cardPrices(page);
    expect(desc).toEqual([...desc].sort((a, b) => b - a));

    await page.getByLabel("Sort products").selectOption("newest");
    await expect(page).toHaveURL(/sort=newest/);
    const newest = await db.product.findFirst({ where: { isActive: true }, orderBy: { createdAt: "desc" } });
    await expect(page.locator("main article").first()).toContainText(newest!.name);

    // 38 products at 24 per page → page 2 exists and keeps the sort.
    await page.getByRole("navigation", { name: "Pagination" }).getByRole("link", { name: "2", exact: true }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page).toHaveURL(/sort=newest/);
    expect(await page.locator("main article").count()).toBeGreaterThan(0);
  });

  test("category landing pages have breadcrumbs, description and SEO title", async ({ page }) => {
    await page.goto("/category/seat-covers");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Seat Covers");
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("Seat Covers");
    await expect(page).toHaveTitle(/Seat Covers/);
    await expect(page.getByText("Premium leatherette, Nappa and breathable mesh seat covers.")).toBeVisible();
  });

  test("no-results state offers help", async ({ page }) => {
    await page.goto("/shop?q=spaceship");
    await expect(page.getByRole("heading", { name: "No products found" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Clear filters" })).toBeVisible();
  });

  test("mobile filter sheet opens and applies @mobile", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile only");
    await page.goto("/shop");
    await page.getByRole("button", { name: /Filters/ }).click();
    const sheet = page.getByRole("dialog", { name: "Filters" });
    await expect(sheet).toBeVisible();
    await sheet.getByRole("radio", { name: /^Car Care/ }).check();
    await expect(page).toHaveURL(/category=car-care/);
    await expect(page.getByRole("dialog", { name: "Filters" })).toHaveCount(0);
  });
});
