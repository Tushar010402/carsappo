import { test, expect, ADMIN_STATE } from "./helpers/fixtures";
import { seriousViolations } from "./helpers/a11y";

test.use({ storageState: ADMIN_STATE });

test("admin pages have no serious or critical accessibility violations", async ({ page }) => {
  test.setTimeout(300_000);
  const report: string[] = [];
  for (const path of [
    "/admin",
    "/admin/orders",
    "/admin/products",
    "/admin/products/new",
    "/admin/inventory",
    "/admin/coupons",
    "/admin/reviews",
    "/admin/banners",
    "/admin/services",
    "/admin/services?tab=content",
    "/admin/shipping",
    "/admin/storefront/home",
    "/admin/storefront/navigation",
    "/admin/pages",
    "/admin/pages/about",
    "/admin/pages/contact",
    "/admin/pages/new",
    "/admin/team",
    "/admin/inventory/import",
    "/admin/seo",
    "/admin/settings",
  ]) {
    await page.goto(path);
    for (const v of await seriousViolations(page)) report.push(`${path}: ${v}`);
  }
  expect(report).toEqual([]);
});
