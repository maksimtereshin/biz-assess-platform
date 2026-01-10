import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for AdminJS E2E tests
 * Tests run against local development server
 */
export default defineConfig({
  testDir: "./src", // Changed from "./src/admin" to include telegram tests
  testMatch: [
    "**/__tests__/**/*.e2e.spec.ts",
    "**/__tests__/**/*.integration.spec.ts",
  ],
  fullyParallel: false, // Run tests sequentially for stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for sequential execution
  reporter: "html",
  timeout: 60000, // 60s timeout for Telegram Bot API delays
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:4000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Do not start server automatically - assume backend is already running
  // To run tests: npm run start:dev (in one terminal) + npx playwright test (in another)
});
