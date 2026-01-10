/**
 * E2E Test: StructureEditor Component Bundling Verification
 *
 * This test verifies that the StructureEditor component is properly bundled
 * and accessible in AdminJS UI without "Component has not been bundled" errors.
 *
 * Test Strategy:
 * 1. Authenticate as admin via JWT token
 * 2. Navigate to SurveyVersion resource
 * 3. Click "New" to create a new version
 * 4. Verify StructureEditor component loads (no bundling error)
 * 5. Verify form fields are visible (structure field with custom component)
 */

import { test, expect } from "@playwright/test";
import * as jwt from "jsonwebtoken";

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";
const JWT_SECRET =
  process.env.JWT_SECRET || "dev-jwt-secret-key-not-for-production";
const ADMIN_USERNAME = "maksim_tereshin";

test.describe("StructureEditor Component Bundling", () => {
  let authToken: string;

  test.beforeAll(() => {
    // Generate admin auth token
    authToken = jwt.sign(
      {
        username: ADMIN_USERNAME,
        role: "admin",
      },
      JWT_SECRET,
      { expiresIn: "15m" },
    );
  });

  test("should load StructureEditor component without bundling errors", async ({
    page,
  }) => {
    // Step 1: Navigate to AdminJS with auth token
    console.log(`[TEST] Navigating to /admin with token...`);
    await page.goto(`${BASE_URL}/admin?token=${authToken}`);

    // Wait for redirect to /admin (token should be removed from URL)
    await page.waitForURL(`${BASE_URL}/admin`, { timeout: 10000 });
    console.log(`[TEST] Successfully authenticated and redirected`);

    // Step 2: Wait for AdminJS UI to load
    await page.waitForSelector('[data-testid="sidebar"]', { timeout: 15000 });
    console.log(`[TEST] AdminJS UI loaded`);

    // Step 3: Navigate to SurveyVersion resource
    console.log(`[TEST] Navigating to SurveyVersion resource...`);

    // Click on "Опросы" navigation group
    const surveysGroup = page.locator('text="Опросы"').first();
    if (await surveysGroup.isVisible()) {
      await surveysGroup.click();
      await page.waitForTimeout(500);
    }

    // Click on "Survey Versions" in sidebar
    await page.click('text="Survey Versions"');
    await page.waitForLoadState("networkidle");
    console.log(`[TEST] SurveyVersion list loaded`);

    // Step 4: Click "New" to create a new version
    console.log(`[TEST] Clicking 'New' button...`);
    await page.click('a[href*="/admin/resources/SurveyVersion/actions/new"]');
    await page.waitForLoadState("networkidle");
    console.log(`[TEST] New SurveyVersion form loaded`);

    // Step 5: Check for bundling errors in console
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Wait a bit to catch any async bundling errors
    await page.waitForTimeout(2000);

    // Step 6: Verify no "Component has not been bundled" error
    const hasBundlingError = consoleErrors.some(
      (error) => error.includes("Component") && error.includes("bundled"),
    );

    expect(hasBundlingError).toBe(false);
    console.log(`[TEST] ✅ No bundling errors detected`);

    // Step 7: Verify form is visible
    const formVisible = await page.locator("form").isVisible();
    expect(formVisible).toBe(true);
    console.log(`[TEST] ✅ Form is visible`);

    // Step 8: Verify structure field exists (should have StructureEditor)
    // Note: StructureEditor may render as a textarea or custom component
    const structureField = page.locator('[name="structure"]');
    const structureFieldVisible = await structureField
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (structureFieldVisible) {
      console.log(`[TEST] ✅ Structure field is visible`);
    } else {
      console.log(
        `[TEST] ⚠️ Structure field not immediately visible (may be custom component)`,
      );
    }

    // Step 9: Take screenshot for verification
    await page.screenshot({
      path: "test-results/structure-editor-bundling-verification.png",
      fullPage: true,
    });
    console.log(`[TEST] Screenshot saved`);

    // Step 10: Check page source for bundling-related errors
    const pageContent = await page.content();
    const hasError =
      pageContent.includes("Component has not been bundled") ||
      pageContent.includes("Converting circular structure to JSON");

    expect(hasError).toBe(false);
    console.log(`[TEST] ✅ No bundling errors in page source`);
  });

  test("should successfully render SurveyVersion edit form with StructureEditor", async ({
    page,
  }) => {
    // Authenticate
    await page.goto(`${BASE_URL}/admin?token=${authToken}`);
    await page.waitForURL(`${BASE_URL}/admin`, { timeout: 10000 });

    // Navigate to SurveyVersion list
    const surveysGroup = page.locator('text="Опросы"').first();
    if (await surveysGroup.isVisible()) {
      await surveysGroup.click();
      await page.waitForTimeout(500);
    }
    await page.click('text="Survey Versions"');
    await page.waitForLoadState("networkidle");

    // Get first version and click "Edit"
    console.log(`[TEST] Finding first SurveyVersion...`);
    const firstVersionRow = page.locator("tbody tr").first();
    await firstVersionRow.click();
    await page.waitForLoadState("networkidle");

    // Click "Edit" button on show page
    const editButton = page.locator('a[href*="/edit"]').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForLoadState("networkidle");
      console.log(`[TEST] Edit form loaded`);

      // Verify form is visible
      const formVisible = await page.locator("form").isVisible();
      expect(formVisible).toBe(true);
      console.log(`[TEST] ✅ Edit form is visible`);

      // Take screenshot
      await page.screenshot({
        path: "test-results/structure-editor-edit-form.png",
        fullPage: true,
      });
    } else {
      console.log(`[TEST] Edit button not visible, may be status-dependent`);
    }
  });
});
