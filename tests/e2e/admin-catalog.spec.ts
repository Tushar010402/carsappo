import { test, expect, ADMIN_STATE, autoConfirm, unique } from "./helpers/fixtures";
import { db } from "./helpers/db";

test.use({ storageState: ADMIN_STATE });

test.describe("Admin — catalogue, inventory, coupons and reviews", () => {
  test("create a product with an uploaded image, edit it, then hide it", async ({ page }) => {
    autoConfirm(page);
    const name = `E2E Magnetic Sunshade ${unique("")}`;
    const sku = `E2E-${unique("")}`.toUpperCase();

    await page.goto("/admin/products");
    await page.getByRole("link", { name: "Add product" }).click();
    await expect(page).toHaveURL(/\/admin\/products\/new/);

    await page.getByLabel("Name", { exact: true }).fill(name);
    const slug = await page.getByLabel("URL slug").inputValue();
    expect(slug).toMatch(/^e2e-magnetic-sunshade-/);
    await page.getByLabel("SKU").fill(sku);
    await page.getByLabel("Short description").fill("Blocks 99% UV; snaps on in seconds.");
    await page.locator("textarea#description").fill("## Stay cool\n\nMagnetic sunshades for side windows.");

    await page.locator('input[type="file"][accept*="image/png"]').setInputFiles("public/images/brand/icon-512.png");
    await expect(page.getByLabel("Alt text for image 1")).toBeVisible();
    await page.getByLabel("Alt text for image 1").fill("Sunshade fitted on a rear window");

    await page.getByText("Universal fit", { exact: true }).click();
    await page.getByLabel("Selling price").fill("899");
    await page.getByLabel("MRP").fill("1299");
    await page.getByLabel("GST rate").selectOption("18");
    await page.getByLabel("HSN code").fill("8708");
    await page.getByLabel("Stock", { exact: true }).fill("25");
    await page.getByLabel("Package weight (grams)").fill("400");
    await page.getByLabel("Category").selectOption({ label: "Exterior Accessories" });
    await page.getByLabel("Brand").selectOption({ label: "Carsappo" });
    await page.getByRole("button", { name: "Create product" }).click();

    await expect(page).toHaveURL(/\/admin\/products\/(?!new)[a-z0-9]+$/);
    await expect(page.getByText("Product created")).toBeVisible();
    const product = await db.product.findUniqueOrThrow({ where: { slug }, include: { images: { orderBy: { sortOrder: "asc" } } } });
    expect(product).toMatchObject({ sku, price: 89_900, mrp: 129_900, gstRate: 18, stock: 25, isUniversal: true, isActive: true });
    const images = product.images;
    expect(images[0].url).toMatch(/^\/uploads\/products\/.+\.png$/);
    expect((await page.request.get(images[0].url)).headers()["content-type"]).toBe("image/png");

    // Live on the storefront, with the uploaded image and the discount.
    await page.goto(`/product/${slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
    await expect(page.locator("main")).toContainText("₹899");
    await expect(page.locator("main")).toContainText("31% off");
    await expect(page.getByRole("img", { name: "Sunshade fitted on a rear window" }).first()).toBeVisible();
    await page.goto("/shop?q=magnetic%20sunshade");
    await expect(page.getByRole("link", { name: new RegExp(name) }).first()).toBeVisible();

    // Edit the price.
    await page.goto(`/admin/products/${product.id}`);
    await page.getByLabel("Selling price").fill("849");
    await page.getByRole("button", { name: "Save product" }).click();
    await expect(page.getByText("Product saved")).toBeVisible();
    await page.goto(`/product/${slug}`);
    await expect(page.locator("main")).toContainText("₹849");

    // No orders yet, so it's deleted outright; the page then 404s.
    await page.goto(`/admin/products/${product.id}`);
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/products$/);
    expect(await db.product.count({ where: { slug } })).toBe(0);
    expect((await page.goto(`/product/${slug}`))?.status()).toBe(404);
  });

  test("product form shows validation errors without losing input", async ({ page }) => {
    await page.goto("/admin/products/new");
    await page.getByLabel("Name", { exact: true }).fill("Incomplete product");
    await page.getByLabel("SKU").fill("E2E-INCOMPLETE");
    await page.getByLabel("Selling price").fill("499");
    await page.getByLabel("HSN code").fill("12");
    await page.getByLabel("Category").selectOption({ label: "Car Care" });
    await page.getByRole("button", { name: "Create product" }).click();
    await expect(page.getByText("HSN is 4–8 digits", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Incomplete product");
    await expect(page.getByLabel("SKU")).toHaveValue("E2E-INCOMPLETE");
    expect(await db.product.count({ where: { sku: "E2E-INCOMPLETE" } })).toBe(0);
  });

  test("inventory: adjust stock and export CSV", async ({ page }) => {
    const slug = "portable-car-vacuum-cleaner-120w";
    const p = await db.product.update({ where: { slug }, data: { stock: 30 } });
    await page.goto(`/admin/inventory?q=${encodeURIComponent(p.sku)}`);
    await page.getByRole("button", { name: `Increase stock of ${p.name}` }).click();
    await page.getByRole("button", { name: `Increase stock of ${p.name}` }).click();
    await expect(page.getByLabel(`Stock for ${p.name}`)).toHaveValue("32");
    await page.getByRole("row").filter({ hasText: p.name }).getByRole("button", { name: "Save stock" }).click();
    await expect.poll(async () => (await db.product.findUniqueOrThrow({ where: { slug } })).stock).toBe(32);

    const href = await page.getByRole("link", { name: /Export CSV/ }).getAttribute("href");
    const res = await page.request.get(href!);
    expect(res.headers()["content-type"]).toContain("text/csv");
    const csv = await res.text();
    expect(csv.split("\n")[0]).toContain("SKU");
    expect(csv).toContain(p.sku);
  });

  test("coupons: create one and use it in the cart; deactivating it stops it working", async ({ page, browser }) => {
    const code = `E2E${unique("").toUpperCase().slice(0, 8)}`;
    await page.goto("/admin/coupons");
    await page.getByRole("button", { name: "New coupon" }).click();
    const dialog = page.getByRole("dialog", { name: "New coupon" });
    await dialog.getByLabel("Code").fill(code);
    await dialog.getByLabel("Discount type").selectOption("FLAT");
    await dialog.getByLabel("Amount off").fill("150");
    await dialog.getByLabel("Minimum order").fill("500");
    await dialog.getByLabel("Description").fill("₹150 off orders above ₹500");
    await dialog.getByRole("button", { name: "Create coupon" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText(code, { exact: true })).toBeVisible();

    // A shopper (fresh context, not the admin) applies it.
    const shopper = await (await browser.newContext({ storageState: { cookies: [], origins: [] } })).newPage();
    await shopper.goto("/product/portable-car-vacuum-cleaner-120w");
    await shopper.locator("#buy-box").getByRole("button", { name: "Add to cart" }).click();
    await shopper.goto("/cart");
    await shopper.getByLabel("Coupon code").fill(code);
    await shopper.getByRole("button", { name: "Apply", exact: true }).click();
    await expect(shopper.getByText(`${code} applied`)).toBeVisible();
    await expect(shopper.getByText(`Coupon (${code})`)).toBeVisible();

    await page.getByRole("button", { name: `Edit ${code}` }).click();
    const edit = page.getByRole("dialog", { name: `Edit ${code}` });
    await edit.getByText("Active", { exact: true }).click();
    await edit.getByRole("button", { name: "Save coupon" }).click();
    await expect(edit).toBeHidden();
    expect((await db.coupon.findUniqueOrThrow({ where: { code } })).isActive).toBe(false);

    await shopper.reload();
    await expect(shopper.getByText(/not valid|no longer|expired/i).first()).toBeVisible();
    await shopper.context().close();
  });

  test("reviews: approving a pending review publishes it on the product page", async ({ page }) => {
    const product = await db.product.findUniqueOrThrow({ where: { slug: "portable-car-vacuum-cleaner-120w" } });
    const body = `Strong suction and the cable is long enough for the boot. ${unique("")}`;
    await db.review.create({ data: { productId: product.id, name: "Pending Pete", rating: 5, title: "Great buy", body, isApproved: false } });

    await page.goto(`/product/${product.slug}`);
    await expect(page.getByText(body)).toHaveCount(0);

    await page.goto("/admin/reviews");
    const card = page.locator("li").filter({ hasText: body });
    await card.getByRole("button", { name: "Approve" }).click();
    await expect(page.locator("li").filter({ hasText: body })).toHaveCount(0);

    await page.goto(`/product/${product.slug}`);
    await expect(page.getByText(body)).toBeVisible();
  });

  test("categories: edit a category's SEO text and see it on the storefront", async ({ page }) => {
    const cat = await db.category.findUniqueOrThrow({ where: { slug: "electronics" } });
    await page.goto(`/admin/categories/${cat.id}`);
    const description = `Dash cams, vacuums and chargers — ${unique("")}`;
    await page.getByLabel("Description", { exact: true }).fill(description);
    await page.getByRole("button", { name: /Save/ }).click();
    await expect(page.getByText(/saved/i).first()).toBeVisible();
    await page.goto("/category/electronics");
    await expect(page.getByText(description)).toBeVisible();
    await db.category.update({ where: { id: cat.id }, data: { description: cat.description } });
  });
});
