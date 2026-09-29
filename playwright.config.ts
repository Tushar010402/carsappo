import { defineConfig, devices } from "@playwright/test";
import { BASE_URL, E2E_PORT, MOCK_PORT, serverEnv } from "./tests/e2e/env";

/**
 * End-to-end tests against a production build (`npm run test:e2e`).
 * Desktop runs the storefront specs; the mobile project re-runs specs tagged @mobile on a phone viewport;
 * admin specs run last.
 */
export default defineConfig({
  testDir: "tests/e2e",
  outputDir: "test-results/artifacts",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: !!process.env.CI,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "en-IN",
    timezoneId: "Asia/Kolkata",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }, dependencies: ["setup"], testIgnore: [/auth\.setup\.ts/, /admin-.*\.spec\.ts/] },
    { name: "mobile", use: { ...devices["Pixel 7"] }, dependencies: ["setup"], grep: /@mobile/, testIgnore: [/auth\.setup\.ts/, /admin-.*\.spec\.ts/] },
    // Admin specs change store-wide settings (banners, tracking IDs, announcement), so they run after the storefront specs.
    { name: "admin", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }, dependencies: ["desktop", "mobile"], testMatch: /admin-.*\.spec\.ts/ },
  ],
  webServer: [
    {
      command: "npx tsx tests/e2e/mocks/server.ts",
      url: `http://localhost:${MOCK_PORT}/health`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npx next start -p ${E2E_PORT}`,
      url: `${BASE_URL}/robots.txt`,
      env: serverEnv,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
