import { mkdirSync } from "node:fs";
import { test as setup, expect } from "@playwright/test";
import { ADMIN, CUSTOMER } from "./env";
import { ADMIN_STATE, CUSTOMER_STATE } from "./helpers/fixtures";

mkdirSync("test-results/.auth", { recursive: true });

setup("sign in as admin", async ({ page }) => {
  await page.goto("/login?next=/admin");
  await page.fill("#email", ADMIN.email);
  await page.fill("#password", ADMIN.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL((u) => u.pathname === "/admin");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.context().storageState({ path: ADMIN_STATE });
});

setup("register a customer", async ({ page }) => {
  await page.goto("/register");
  await page.fill("#name", CUSTOMER.name);
  await page.fill("#email", CUSTOMER.email);
  await page.fill("#phone", CUSTOMER.phone);
  await page.fill("#password", CUSTOMER.password);
  await page.getByRole("button", { name: "Create account" }).click();
  const exists = page.getByText("An account with this email already exists");
  await Promise.race([page.waitForURL((u) => u.pathname === "/account"), exists.waitFor()]);
  if (await exists.isVisible()) {
    // Re-run against the same database: sign in instead.
    await page.goto("/login");
    await page.fill("#email", CUSTOMER.email);
    await page.fill("#password", CUSTOMER.password);
    await page.getByRole("button", { name: "Log in" }).click();
    await page.waitForURL((u) => u.pathname === "/account");
  }
  await expect(page.getByRole("heading", { name: /Hi, Riya/ })).toBeVisible();
  await page.context().storageState({ path: CUSTOMER_STATE });
});
