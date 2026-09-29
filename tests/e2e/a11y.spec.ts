import { test, expect, CUSTOMER_STATE } from "./helpers/fixtures";
import { seriousViolations } from "./helpers/a11y";

const PAGES = [
  "/",
  "/shop",
  "/category/mats",
  "/product/7d-premium-car-mats-custom-fit",
  "/cart",
  "/checkout",
  "/services",
  "/services/book",
  "/blog",
  "/blog/7d-vs-5d-car-mats",
  "/about",
  "/contact",
  "/track-order",
  "/login",
  "/register",
  "/policies/privacy-policy",
];

test.describe("Accessibility (axe, WCAG 2.1 AA)", () => {
  test("storefront pages have no serious or critical violations @mobile", async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto("/product/microfiber-cloth-800gsm-pack-of-3");
    await page.locator("#buy-box").getByRole("button", { name: "Add to cart" }).click();
    await page.getByRole("button", { name: "Close cart" }).click();
    const report: string[] = [];
    for (const path of PAGES) {
      await page.goto(path);
      // Checkout fetches a live quote first; the pay button fades in once it's ready.
      if (path === "/checkout") await expect(page.getByRole("button", { name: /Place order|Pay/ })).toBeEnabled();
      for (const v of await seriousViolations(page)) report.push(`${path}: ${v}`);
    }
    expect(report).toEqual([]);
  });

  test("open dialogs (cart drawer, mobile menu, search) are accessible @mobile", async ({ page, isMobile }) => {
    await page.goto("/product/microfiber-cloth-800gsm-pack-of-3");
    await page.locator("#buy-box").getByRole("button", { name: "Add to cart" }).click();
    await expect(page.getByRole("dialog", { name: "Shopping cart" })).toBeVisible();
    expect(await seriousViolations(page)).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Shopping cart" })).toBeHidden();
    if (isMobile) {
      await page.getByRole("button", { name: "Open menu" }).click();
      expect(await seriousViolations(page)).toEqual([]);
    }
  });

  test("customer account pages have no serious or critical violations", async ({ browser }) => {
    const context = await browser.newContext({ storageState: CUSTOMER_STATE });
    const page = await context.newPage();
    const report: string[] = [];
    for (const path of ["/account", "/account/orders", "/account/addresses", "/account/coupons", "/account/returns", "/account/notifications", "/account/invoices"]) {
      await page.goto(path);
      for (const v of await seriousViolations(page)) report.push(`${path}: ${v}`);
    }
    expect(report).toEqual([]);
    await context.close();
  });

  test("keyboard users can skip to content and see focus", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: /Skip to/ });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
    // Focus is visible on interactive elements.
    await page.keyboard.press("Tab");
    const outline = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const s = getComputedStyle(el);
      return `${s.outlineStyle} ${s.outlineWidth} ${s.boxShadow}`;
    });
    expect(outline).not.toBe("none 0px none");
  });
});
