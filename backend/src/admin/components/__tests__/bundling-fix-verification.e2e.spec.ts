/**
 * E2E Test: AdminJS Bundling Fix Verification
 *
 * Simple test to verify that AdminJS loads without "Converting circular structure to JSON"
 * or "Component has not been bundled" errors after applying the fix.
 */

import { test, expect } from "@playwright/test";
import * as jwt from "jsonwebtoken";

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";
const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret-key-not-for-production";
const ADMIN_USERNAME = "maksim_tereshin";

test.describe("AdminJS Bundling Fix Verification", () => {
  let authToken: string;

  test.beforeAll(() => {
    authToken = jwt.sign(
      { username: ADMIN_USERNAME, role: "admin" },
      JWT_SECRET,
      { expiresIn: "15m" }
    );
  });

  test("should load AdminJS without bundling errors", async ({ page }) => {
    // Collect console errors
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      } else if (msg.type() === "warning") {
        consoleWarnings.push(msg.text());
      }
    });

    // Navigate to AdminJS
    console.log(`[TEST] Navigating to /admin with token...`);
    await page.goto(`${BASE_URL}/admin?token=${authToken}`);

    // Wait for redirect
    await page.waitForURL(`${BASE_URL}/admin`, { timeout: 10000 });
    console.log(`[TEST] Successfully redirected to /admin`);

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Wait a bit for any async errors
    await page.waitForTimeout(3000);

    // Check for critical errors
    const hasBundlingError = consoleErrors.some(
      (error) =>
        error.includes("Component has not been bundled") ||
        error.includes("Converting circular structure to JSON")
    );

    const hasCircularError = consoleErrors.some((error) =>
      error.includes("Converting circular structure")
    );

    // Log errors for debugging
    if (consoleErrors.length > 0) {
      console.log(`[TEST] Console errors (${consoleErrors.length}):`);
      consoleErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.substring(0, 200)}`);
      });
    }

    // Verify no bundling errors
    expect(hasBundlingError).toBe(false);
    console.log(`[TEST] ✅ No bundling errors in console`);

    expect(hasCircularError).toBe(false);
    console.log(`[TEST] ✅ No circular structure errors in console`);

    // Verify page loaded successfully
    const titleElement = await page.title();
    console.log(`[TEST] Page title: ${titleElement}`);

    // Verify navigation is visible (any nav element)
    const navVisible = await page.locator("text=Навигация").isVisible({ timeout: 5000 });
    expect(navVisible).toBe(true);
    console.log(`[TEST] ✅ Navigation is visible`);

    // Verify user is authenticated (email should be visible)
    const userEmail = await page
      .locator("text=maksim_tereshin@telegram.user")
      .isVisible({ timeout: 5000 });
    expect(userEmail).toBe(true);
    console.log(`[TEST] ✅ User authenticated (email visible)`);

    // Verify resources are listed in sidebar
    const adminGroup = await page.locator("text=Администрирование").isVisible();
    const surveysGroup = await page.locator("text=Опросы").isVisible();
    expect(adminGroup).toBe(true);
    expect(surveysGroup).toBe(true);
    console.log(`[TEST] ✅ Resource groups visible in sidebar`);

    // Take screenshot
    await page.screenshot({
      path: "test-results/bundling-fix-verification.png",
      fullPage: true,
    });
    console.log(`[TEST] ✅ Screenshot saved`);

    // Final verification: check page source
    const pageContent = await page.content();
    const hasErrorInSource =
      pageContent.includes("Component has not been bundled") ||
      pageContent.includes("Converting circular structure to JSON");

    expect(hasErrorInSource).toBe(false);
    console.log(`[TEST] ✅ No bundling errors in page source`);
  });

  test("should navigate to SurveyVersion resource without errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Authenticate
    await page.goto(`${BASE_URL}/admin?token=${authToken}`);
    await page.waitForURL(`${BASE_URL}/admin`, { timeout: 10000 });
    await page.waitForLoadState("networkidle");

    // Click on SurveyVersion resource (direct navigation)
    console.log(`[TEST] Navigating to SurveyVersion resource...`);
    await page.goto(`${BASE_URL}/admin/resources/SurveyVersion`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Check for errors
    const hasBundlingError = consoleErrors.some(
      (error) =>
        error.includes("Component has not been bundled") ||
        error.includes("Converting circular structure")
    );

    expect(hasBundlingError).toBe(false);
    console.log(`[TEST] ✅ SurveyVersion resource loaded without errors`);

    // Verify list is visible
    const listVisible = await page.locator("tbody").isVisible({ timeout: 5000 });
    expect(listVisible).toBe(true);
    console.log(`[TEST] ✅ SurveyVersion list is visible`);

    // Take screenshot
    await page.screenshot({
      path: "test-results/bundling-fix-survey-version-list.png",
      fullPage: true,
    });
  });
});
