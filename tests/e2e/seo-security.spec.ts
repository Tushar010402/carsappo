import crypto from "node:crypto";
import { test, expect, CUSTOMER_STATE, unique } from "./helpers/fixtures";
import { db } from "./helpers/db";
import { BASE_URL, CUSTOMER, RAZORPAY_TEST_WEBHOOK_SECRET, SHIPROCKET_TEST_WEBHOOK_TOKEN } from "./env";

const PUBLIC_PAGES = [
  "/",
  "/shop",
  "/category/mats",
  "/product/7d-premium-car-mats-custom-fit",
  "/services",
  "/services/book",
  "/blog",
  "/blog/7d-vs-5d-car-mats",
  "/about",
  "/contact",
  "/track-order",
  "/policies/return-policy",
];

async function jsonLdTypes(page: import("@playwright/test").Page) {
  const blocks = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((j) => JSON.parse(j));
  return blocks.flatMap((b) => (Array.isArray(b["@graph"]) ? b["@graph"] : [b])).map((b) => b["@type"]);
}

test.describe("SEO", () => {
  test("every public page has a unique title and description, a canonical URL, Open Graph tags and one H1", async ({ page }) => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    for (const path of PUBLIC_PAGES) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(200);
      const title = await page.title();
      expect(title.length, `${path} title`).toBeGreaterThan(10);
      expect(title.length, `${path} title "${title}"`).toBeLessThanOrEqual(70);
      titles.add(title);
      const description = await page.locator('meta[name="description"]').getAttribute("content");
      expect(description?.length ?? 0, `${path} description`).toBeGreaterThan(50);
      descriptions.add(description!);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect([`${BASE_URL}${path}`, `${BASE_URL}${path}`.replace(/\/$/, "")], `${path} canonical`).toContain(canonical);
      await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
      await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute("content", /^https?:\/\//);
      await expect(page.locator("h1"), `${path} h1`).toHaveCount(1);
      await expect(page.locator("html")).toHaveAttribute("lang", "en-IN");
      await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0);
    }
    expect(titles.size).toBe(PUBLIC_PAGES.length);
    expect(descriptions.size).toBe(PUBLIC_PAGES.length);
  });

  test("structured data: Organization, WebSite search, Product, Breadcrumbs, Article, FAQ and LocalBusiness", async ({ page }) => {
    await page.goto("/");
    expect(await jsonLdTypes(page)).toEqual(expect.arrayContaining(["Organization", "WebSite"]));
    const website = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((j) => JSON.parse(j)).find((d) => d["@type"] === "WebSite");
    expect(website.potentialAction?.target?.urlTemplate ?? website.potentialAction?.target).toContain("/shop?q=");

    await page.goto("/product/7d-premium-car-mats-custom-fit");
    expect(await jsonLdTypes(page)).toEqual(expect.arrayContaining(["Product", "BreadcrumbList"]));
    await page.goto("/category/mats");
    expect(await jsonLdTypes(page)).toEqual(expect.arrayContaining(["BreadcrumbList"]));
    await page.goto("/blog/7d-vs-5d-car-mats");
    expect(await jsonLdTypes(page)).toEqual(expect.arrayContaining([expect.stringMatching(/Article|BlogPosting/)]));
    await page.goto("/services");
    expect(await jsonLdTypes(page)).toEqual(expect.arrayContaining(["AutoWash", "FAQPage"]));
  });

  test("sitemap lists products, categories, posts and policies; robots.txt keeps private areas out", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    for (const path of ["/shop", "/services", "/product/7d-premium-car-mats-custom-fit", "/category/mats", "/blog/7d-vs-5d-car-mats", "/policies/privacy-policy", "/faq"]) {
      expect(sitemap, path).toContain(`<loc>${BASE_URL}${path}</loc>`);
    }
    expect(sitemap).toContain("<image:loc>");
    const hidden = await db.product.create({
      data: {
        name: "Hidden draft",
        slug: unique("hidden-draft"),
        sku: unique("HID").toUpperCase(),
        description: "",
        price: 10_000,
        gstRate: 18,
        stock: 1,
        isActive: false,
        category: { connect: { slug: "mats" } },
      },
    });
    expect(await (await request.get("/sitemap.xml")).text()).not.toContain(hidden.slug);
    await db.product.delete({ where: { id: hidden.id } });

    const robots = await (await request.get("/robots.txt")).text();
    for (const path of ["/admin", "/account", "/api/", "/checkout", "/order/", "/invoice/"]) expect(robots).toContain(`Disallow: ${path}`);
    expect(robots).toContain(`Sitemap: ${BASE_URL}/sitemap.xml`);
  });

  test("private pages are marked noindex", async ({ page }) => {
    for (const path of ["/cart", "/checkout", "/login", "/register", "/wishlist"]) {
      await page.goto(path);
      await expect(page.locator('meta[name="robots"]'), path).toHaveAttribute("content", /noindex/);
    }
  });

  test("category pages paginate with crawlable links", async ({ page }) => {
    await page.goto("/shop");
    const next = page.getByRole("link", { name: /Next/ }).first();
    await expect(next).toHaveAttribute("href", /page=2/);
  });
});

test.describe("Security", () => {
  test("security headers are sent and the framework isn't advertised", async ({ request }) => {
    for (const path of ["/", "/product/7d-premium-car-mats-custom-fit", "/api/search/suggest?q=mat"]) {
      const res = await request.get(path);
      const h = res.headers();
      expect(h["x-content-type-options"], path).toBe("nosniff");
      expect(h["x-frame-options"], path).toBe("SAMEORIGIN");
      expect(h["referrer-policy"], path).toBe("strict-origin-when-cross-origin");
      expect(h["strict-transport-security"], path).toContain("max-age=");
      expect(h["permissions-policy"], path).toContain("camera=()");
      expect(h["x-powered-by"], path).toBeUndefined();
    }
  });

  test("session cookie is HttpOnly and SameSite", async ({ browser }) => {
    const context = await browser.newContext({ storageState: CUSTOMER_STATE });
    const session = (await context.cookies()).find((c) => c.name === "cs_session");
    expect(session).toMatchObject({ httpOnly: true, sameSite: "Lax", secure: true });
    await context.close();
  });

  test("login ignores off-site ?next= redirects", async ({ page }) => {
    for (const next of ["https://evil.example/steal", "//evil.example", "/\\evil.example", "/\t/evil.example"]) {
      await page.context().clearCookies();
      await page.goto(`/login?next=${encodeURIComponent(next)}`);
      await page.fill("#email", CUSTOMER.email);
      await page.fill("#password", CUSTOMER.password);
      await page.getByRole("button", { name: "Log in" }).click();
      await page.waitForURL((u) => u.origin === BASE_URL && u.pathname === "/account");
    }
  });

  test("user-generated content is escaped, never executed", async ({ page }) => {
    let dialogs = 0;
    page.on("dialog", (d) => {
      dialogs++;
      void d.dismiss();
    });
    const product = await db.product.findUniqueOrThrow({ where: { slug: "leather-steering-wheel-cover" } });
    const payload = `<img src=x onerror=alert(1)><script>alert(2)</script> ${unique("xss")}`;
    await db.review.create({ data: { productId: product.id, name: "<b>Mallory</b>", rating: 3, body: payload, isApproved: true } });
    await page.goto(`/product/${product.slug}`);
    await expect(page.getByText(payload)).toBeVisible();
    await expect(page.getByText("<b>Mallory</b>")).toBeVisible();
    expect(dialogs).toBe(0);
    await db.review.deleteMany({ where: { body: payload } });
  });

  test("the server decides prices and quantities, not the browser", async ({ request }) => {
    const product = await db.product.findUniqueOrThrow({ where: { slug: "leather-steering-wheel-cover" } });
    const base = {
      email: "tamper@example.com",
      phone: "9811100011",
      address: { name: "Tamper Test", phone: "9811100011", line1: "12, MG Road, Sector 14", city: "Greater Noida", state: "Uttar Pradesh", pincode: "201310" },
      paymentMethod: "COD",
    };
    const tooMany = await request.post("/api/checkout", { data: { ...base, items: [{ productId: product.id, quantity: 500 }] } });
    expect(tooMany.status()).toBe(400);
    const cheap = await request.post("/api/checkout", { data: { ...base, items: [{ productId: product.id, quantity: 1, price: 1 }], total: 1 } });
    expect(cheap.status()).toBe(200);
    const order = await db.order.findUniqueOrThrow({ where: { orderNumber: (await cheap.json()).orderNumber } });
    expect(order.subtotal).toBe(product.price);
  });

  test("admin APIs, orders and invoices are private", async ({ request }) => {
    expect((await request.post("/api/admin/upload", { multipart: { folder: "x" } })).status()).toBe(401);
    expect((await request.get("/api/admin/products/search?q=mat")).status()).toBe(401);
    const order = await db.order.findFirstOrThrow({ where: { invoiceNumber: { not: null } } });
    expect((await request.get(`/order/${order.orderNumber}`)).status()).toBe(404);
    expect((await request.get(`/invoice/${order.orderNumber}`)).status()).toBe(404);
    expect((await request.get(`/invoice/${order.orderNumber}?t=wrong-token`)).status()).toBe(404);
  });

  test("payment and shipping webhooks reject bad signatures and apply genuine updates", async ({ request }) => {
    const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_fake", order_id: "order_fake" } } } });
    const forged = await request.post("/api/webhooks/razorpay", { data: body, headers: { "content-type": "application/json", "x-razorpay-signature": "0".repeat(64) } });
    expect([400, 401]).toContain(forged.status());
    const signed = crypto.createHmac("sha256", RAZORPAY_TEST_WEBHOOK_SECRET).update(body).digest("hex");
    const unknown = await request.post("/api/webhooks/razorpay", { data: body, headers: { "content-type": "application/json", "x-razorpay-signature": signed } });
    expect(unknown.status()).toBe(200);

    expect((await request.post("/api/webhooks/shipping", { data: { awb: "X", current_status: "DELIVERED" } })).status()).toBe(401);
    const order = await db.order.findFirstOrThrow({ where: { status: "CONFIRMED", paymentMethod: "COD" }, orderBy: { createdAt: "desc" } });
    const awb = unique("AWB").toUpperCase();
    await db.order.update({ where: { id: order.id }, data: { status: "SHIPPED", awbCode: awb } });
    const ok = await request.post("/api/webhooks/shipping", { data: { awb, current_status: "DELIVERED" }, headers: { "x-api-key": SHIPROCKET_TEST_WEBHOOK_TOKEN } });
    expect(ok.status()).toBe(200);
    await expect.poll(async () => (await db.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("DELIVERED");
  });
});
