import { test, expect, CUSTOMER_STATE, hasHorizontalOverflow } from "./helpers/fixtures";

/** Phone (small + large), tablet portrait/landscape, laptop and desktop. */
const WIDTHS = [360, 390, 768, 1024, 1280, 1920];

const PAGES = [
  "/",
  "/shop",
  "/shop?category=mats&sort=price-asc",
  "/category/car-care",
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
  "/policies/return-policy",
  "/does-not-exist",
];

test.describe("Responsive layout", () => {
  test("no page scrolls sideways at any common screen width", async ({ page }) => {
    test.setTimeout(240_000);
    // A cart item makes the cart and checkout pages render their full layout.
    await page.goto("/product/microfiber-cloth-800gsm-pack-of-3");
    await page.locator("#buy-box").getByRole("button", { name: "Add to cart" }).click();
    const failures: string[] = [];
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: width < 768 ? 800 : 900 });
      for (const path of PAGES) {
        await page.goto(path);
        await page.waitForTimeout(150);
        if (await hasHorizontalOverflow(page)) {
          const culprit = await page.evaluate(() => {
            const vw = window.innerWidth;
            const el = [...document.querySelectorAll<HTMLElement>("body *")].find((e) => e.getBoundingClientRect().right > vw + 1 && getComputedStyle(e).position !== "fixed");
            return el ? `${el.tagName.toLowerCase()}.${el.className.toString().slice(0, 80)}` : "?";
          });
          failures.push(`${width}px ${path} → ${culprit}`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  test("account pages fit on phones and tablets", async ({ browser }) => {
    const context = await browser.newContext({ storageState: CUSTOMER_STATE });
    const page = await context.newPage();
    for (const width of [360, 390, 768]) {
      await page.setViewportSize({ width, height: 800 });
      for (const path of ["/account", "/account/orders", "/account/addresses", "/account/wishlist", "/account/notifications"]) {
        await page.goto(path);
        expect(await hasHorizontalOverflow(page), `${width}px ${path}`).toBe(false);
      }
    }
    await context.close();
  });

  test("phone: header, menu and sticky buy bar are usable with a thumb @mobile", async ({ page, isMobile }) => {
    test.skip(!isMobile, "phone layout");
    await page.goto("/product/7d-premium-car-mats-custom-fit");
    // Tap targets are at least 40px.
    for (const name of ["Open menu", "Search", "Cart"]) {
      const box = await page.getByRole("button", { name, exact: false }).first().boundingBox();
      expect(box?.height, name).toBeGreaterThanOrEqual(40);
      expect(box?.width, name).toBeGreaterThanOrEqual(40);
    }
    // The main buy buttons keep a full-size tap target when stacked on a phone.
    for (const name of ["Add to cart", "Buy now", "Wishlist", "WhatsApp Enquiry"]) {
      const box = await page.locator("#buy-box").getByRole(name === "WhatsApp Enquiry" ? "link" : "button", { name }).boundingBox();
      expect(box?.height, name).toBeGreaterThanOrEqual(44);
    }
    // Scroll past the buy box: the sticky bar appears and nothing covers its button.
    await page.locator("#specifications").scrollIntoViewIfNeeded();
    const add = page.locator("div.fixed.bottom-0").getByRole("button", { name: "Add to cart" });
    await expect(add).toBeVisible();
    const covered = await add.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width - 8, r.top + r.height / 2);
      return !el.contains(top);
    });
    expect(covered, "WhatsApp button must not cover Add to cart").toBe(false);
    await add.click();
    await expect(page.getByRole("dialog", { name: "Shopping cart" })).toBeVisible();
  });

  test("screenshots of key pages on phone and desktop", async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    for (const [label, width, height] of [
      ["phone", 390, 844],
      ["desktop", 1440, 900],
    ] as const) {
      await page.setViewportSize({ width, height });
      for (const path of ["/", "/shop", "/product/7d-premium-car-mats-custom-fit", "/services", "/blog"]) {
        await page.goto(path);
        await page.waitForLoadState("load");
        const name = `${label}${path === "/" ? "-home" : path.replace(/\//g, "-")}.png`;
        await testInfo.attach(name, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
      }
    }
  });
});
