import { test, expect } from "./helpers/fixtures";
import { db } from "./helpers/db";

const SLUG = "7d-premium-car-mats-custom-fit";

test.describe("Product page — every element from the brief", () => {
  test("gallery with zoom and lightbox, plus product video @mobile", async ({ page, isMobile }) => {
    await db.product.update({ where: { slug: SLUG }, data: { videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" } });
    await page.goto(`/product/${SLUG}`);
    const main = page.locator("main");
    const mainImage = main.locator(".cursor-zoom-in img").first();
    const first = await mainImage.getAttribute("src");
    await main.getByRole("button", { name: "View image 2" }).click();
    await expect.poll(() => mainImage.getAttribute("src")).not.toBe(first);

    if (!isMobile) {
      // Hover zoom scales the image under the cursor.
      await main.locator(".cursor-zoom-in").hover({ position: { x: 100, y: 100 } });
      await expect(mainImage).toHaveCSS("transform", /matrix\(2, 0, 0, 2/);
    }
    await main.locator(".cursor-zoom-in").click();
    const viewer = page.getByRole("dialog", { name: "Image viewer" });
    await expect(viewer).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(viewer).toHaveCount(0);

    await main.getByRole("button", { name: "Play product video" }).click();
    await main.getByRole("button", { name: /Play video/ }).click();
    await expect(main.locator('iframe[src*="youtube-nocookie.com/embed/dQw4w9WgXcQ"]')).toBeVisible();
    await db.product.update({ where: { slug: SLUG }, data: { videoUrl: null } });
  });

  test("description, specifications, compatibility, features, FAQs, shipping and return info", async ({ page }) => {
    await page.goto(`/product/${SLUG}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("7D Premium Car Mats — Custom Fit");
    await expect(page.getByText("Inclusive of all taxes (GST 12%)")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Description" })).toBeVisible();
    await expect(page.locator("#specifications dl")).toContainText("HSN code");
    await expect(page.locator("#compatibility")).toContainText("Hyundai");
    await expect(page.locator("#compatibility")).toContainText("Creta");
    await expect(page.getByRole("heading", { name: "Key features" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Key features" }).locator("..").getByText("Custom-fit for your exact model — full floor coverage")).toBeVisible();

    const faq = page.locator("#faqs details").first();
    await faq.locator("summary").click();
    await expect(faq).toHaveAttribute("open", "");

    await expect(page.getByRole("heading", { name: "Shipping information" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Return policy" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Related products" })).toBeVisible();

    // Structured data for Google Shopping / rich results.
    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    const product = jsonLd.map((j) => JSON.parse(j)).find((d) => d["@type"] === "Product");
    expect(product.offers.priceCurrency).toBe("INR");
    expect(product.offers.price).toBe("3499.00");
    expect(product.aggregateRating).toBeTruthy();
  });

  test("add to cart, buy now, wishlist and WhatsApp enquiry @mobile", async ({ page }) => {
    await page.goto(`/product/${SLUG}`);
    const buyBox = page.locator("#buy-box");
    await expect(buyBox.getByRole("link", { name: "WhatsApp Enquiry" })).toHaveAttribute("href", /wa\.me\/919876543210\?text=.*7D%20Premium%20Car%20Mats/);

    await buyBox.getByRole("button", { name: "Increase quantity" }).click();
    await buyBox.getByRole("button", { name: "Add to cart" }).click();
    const drawer = page.getByRole("dialog", { name: "Shopping cart" });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText("7D Premium Car Mats — Custom Fit")).toBeVisible();
    await expect(drawer.locator("span", { hasText: /^2$/ })).toBeVisible();
    await drawer.getByRole("button", { name: "Close cart" }).click();

    await buyBox.getByRole("button", { name: "Wishlist" }).click();
    await expect(page.getByText("Saved to your wishlist")).toBeVisible();
    await expect(buyBox.getByRole("button", { name: "Wishlisted" })).toBeVisible();

    await buyBox.getByRole("button", { name: "Buy now" }).click();
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByRole("heading", { name: "Order summary" })).toBeVisible();
  });

  test("frequently bought together adds the bundle", async ({ page }) => {
    await page.goto(`/product/${SLUG}`);
    const fbt = page.locator("section").filter({ has: page.getByRole("heading", { name: "Frequently bought together" }) });
    await expect(fbt.getByText("This item: 7D Premium Car Mats — Custom Fit")).toBeVisible();
    await fbt.getByRole("button", { name: "Add selected to cart" }).click();
    const drawer = page.getByRole("dialog", { name: "Shopping cart" });
    await expect(drawer.locator("li")).toHaveCount(3);
  });

  test("pincode delivery estimate uses courier serviceability", async ({ page }) => {
    await page.goto(`/product/${SLUG}`);
    await page.getByLabel("Delivery pincode").fill("201310");
    await page.getByRole("button", { name: "Check", exact: true }).click();
    await expect(page.getByText(/Delivery by/)).toBeVisible();
    await expect(page.getByText("Cash on delivery available", { exact: true })).toBeVisible();
    await page.getByLabel("Delivery pincode").fill("999999");
    await page.getByRole("button", { name: "Check", exact: true }).click();
    await expect(page.getByText("Sorry, we don't deliver to this pincode yet.")).toBeVisible();
    await page.getByLabel("Delivery pincode").fill("12");
    await page.getByRole("button", { name: "Check", exact: true }).click();
    await expect(page.getByText("Enter a valid 6-digit pincode")).toBeVisible();
  });

  test("fit check against the car saved in My Garage", async ({ page }) => {
    await page.goto("/#shop-by-vehicle");
    const section = page.locator("#shop-by-vehicle");
    await section.getByLabel("Brand").selectOption({ label: "Tata" });
    await section.getByLabel("Model").selectOption({ label: "Nexon" });
    await section.getByRole("button", { name: /Find parts/ }).click();
    await page.waitForURL(/make=tata/);
    await page.goto(`/product/${SLUG}`);
    await expect(page.getByText("Fits your Tata Nexon")).toBeVisible();
    await page.goto("/product/waterproof-bike-cover");
    await expect(page.getByText(/May not fit your Tata Nexon/)).toBeVisible();
    await page.goto("/product/microfiber-cloth-800gsm-pack-of-3");
    await expect(page.getByText("Universal fit — works with all cars")).toBeVisible();
  });

  test("customer review is submitted for moderation", async ({ page }) => {
    await page.goto("/product/dashboard-polish-matte-300ml");
    await page.getByText("Write a review").click();
    await page.getByRole("radio", { name: "4 stars" }).click();
    await page.fill("#rv-name", "E2E Reviewer");
    await page.fill("#rv-body", "Leaves a clean matte finish and keeps dust away for days.");
    await page.getByRole("button", { name: "Submit review" }).click();
    await expect(page.getByText(/will appear once it's approved/)).toBeVisible();
    const review = await db.review.findFirst({ where: { name: "E2E Reviewer" } });
    expect(review?.isApproved).toBe(false);
    expect(review?.rating).toBe(4);
  });

  test("out-of-stock products cannot be bought", async ({ page }) => {
    await db.product.update({ where: { slug: "2k-dash-cam-night-vision" }, data: { stock: 0 } });
    await page.goto("/product/2k-dash-cam-night-vision");
    await expect(page.getByText("Currently out of stock")).toBeVisible();
    await expect(page.locator("#buy-box").getByRole("button", { name: "Out of stock" })).toBeDisabled();
    await db.product.update({ where: { slug: "2k-dash-cam-night-vision" }, data: { stock: 40 } });
  });

  test("unknown products, categories, posts and policies return a real 404", async ({ page }) => {
    for (const url of ["/product/does-not-exist", "/category/nope", "/blog/nope", "/blog/category/nope", "/policies/nope"]) {
      const res = await page.goto(url);
      expect(res?.status(), url).toBe(404);
      await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    }
  });
});
