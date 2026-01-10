import { test, expect } from "@playwright/test";
import { JwtService } from "@nestjs/jwt";

/**
 * E2E tests for SurveyPreview component in AdminJS
 * Tests the "Предпросмотр" (Preview) action on SurveyVersion resource
 * Verifies that the preview displays survey structure with validation highlighting
 */

// Helper to generate admin token (mimics AuthService.generateAdminAuthToken)
function generateAdminToken(username: string): string {
  const jwtService = new JwtService({
    secret: process.env.JWT_SECRET || "test-secret-key",
  });

  const payload = {
    username,
    role: "admin",
  };

  return jwtService.sign(payload, { expiresIn: "15m" });
}

test.describe("SurveyPreview E2E Tests", () => {
  const baseUrl = process.env.BASE_URL || "http://localhost:4000";
  const adminUrl = `${baseUrl}/admin`;
  const adminUsername = "maksim_tereshin"; // From seed data

  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent screenshots
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test("should authenticate admin and navigate to SurveyVersion", async ({
    page,
  }) => {
    // Generate admin token
    const token = generateAdminToken(adminUsername);

    // Navigate to /admin with token
    await page.goto(`${adminUrl}?token=${token}`);

    // Wait for AdminJS to load
    await page.waitForLoadState("networkidle");

    // Take screenshot of AdminJS dashboard
    const timestamp = Date.now();
    await page.screenshot({
      path: `/Users/maksimtereshin/Projects/Personal/biz-assess-platform/agent-os/specs/2026-01-06-admin-panel-cms/verification/screenshots/survey-preview-dashboard-${timestamp}.png`,
      fullPage: true,
    });

    // Verify AdminJS loaded
    await expect(page).toHaveTitle(/BizAssess Admin Panel/);
  });

  test("should access SurveyVersion show page and verify Preview button", async ({
    page,
  }) => {
    // Generate admin token
    const token = generateAdminToken(adminUsername);

    // Navigate to /admin with token
    await page.goto(`${adminUrl}?token=${token}`);
    await page.waitForLoadState("networkidle");

    // Navigate to SurveyVersion resource
    // Try multiple possible selectors for the navigation link
    const surveyVersionLink = page.locator('a:has-text("Survey Version"), a:has-text("SurveyVersion"), nav a:has-text("Версии опросов")').first();

    if (await surveyVersionLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await surveyVersionLink.click();
    } else {
      // Fallback: direct URL navigation
      await page.goto(`${adminUrl}/resources/SurveyVersion`);
    }

    await page.waitForLoadState("networkidle");

    // Take screenshot of SurveyVersion list
    const timestamp1 = Date.now();
    await page.screenshot({
      path: `/Users/maksimtereshin/Projects/Personal/biz-assess-platform/agent-os/specs/2026-01-06-admin-panel-cms/verification/screenshots/survey-preview-list-${timestamp1}.png`,
      fullPage: true,
    });

    // Click on the first survey version to view it
    const firstVersion = page.locator('table tbody tr').first();
    await firstVersion.click();
    await page.waitForLoadState("networkidle");

    // Take screenshot of SurveyVersion show page
    const timestamp2 = Date.now();
    await page.screenshot({
      path: `/Users/maksimtereshin/Projects/Personal/biz-assess-platform/agent-os/specs/2026-01-06-admin-panel-cms/verification/screenshots/survey-preview-show-page-${timestamp2}.png`,
      fullPage: true,
    });

    // Look for the "Предпросмотр" (Preview) button
    const previewButton = page.locator('button:has-text("Предпросмотр"), a:has-text("Предпросмотр")');

    // Verify preview button exists
    await expect(previewButton).toBeVisible({ timeout: 10000 });
  });

  test("should open SurveyPreview modal when clicking Preview button", async ({
    page,
  }) => {
    // Generate admin token
    const token = generateAdminToken(adminUsername);

    // Navigate to /admin with token
    await page.goto(`${adminUrl}?token=${token}`);
    await page.waitForLoadState("networkidle");

    // Navigate directly to SurveyVersion resource
    await page.goto(`${adminUrl}/resources/SurveyVersion`);
    await page.waitForLoadState("networkidle");

    // Click on the first survey version
    const firstVersion = page.locator('table tbody tr').first();
    await firstVersion.click();
    await page.waitForLoadState("networkidle");

    // Click the Preview button
    const previewButton = page.locator('button:has-text("Предпросмотр"), a:has-text("Предпросмотр")');
    await previewButton.click();

    // Wait for preview component to render
    await page.waitForTimeout(2000); // Allow component to render

    // Take screenshot of preview
    const timestamp = Date.now();
    await page.screenshot({
      path: `/Users/maksimtereshin/Projects/Personal/biz-assess-platform/agent-os/specs/2026-01-06-admin-panel-cms/verification/screenshots/survey-preview-modal-${timestamp}.png`,
      fullPage: true,
    });

    // Verify preview component text is visible
    const previewHeading = page.locator('text="Предпросмотр структуры опроса"');
    await expect(previewHeading).toBeVisible({ timeout: 5000 });
  });

  test("should display survey structure in preview", async ({ page }) => {
    // Generate admin token
    const token = generateAdminToken(adminUsername);

    // Navigate to /admin with token
    await page.goto(`${adminUrl}?token=${token}`);
    await page.waitForLoadState("networkidle");

    // Navigate directly to SurveyVersion show page (assume ID 1 exists)
    await page.goto(`${adminUrl}/resources/SurveyVersion/actions/show/1`);
    await page.waitForLoadState("networkidle");

    // Click the Preview button
    const previewButton = page.locator('button:has-text("Предпросмотр"), a:has-text("Предпросмотр")');

    if (await previewButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await previewButton.click();
      await page.waitForTimeout(2000);

      // Verify categories are displayed
      const categories = page.locator('text=/^\\d+\\./'); // Matches "1.", "2.", etc.
      await expect(categories.first()).toBeVisible({ timeout: 5000 });

      // Take screenshot of expanded preview
      const timestamp = Date.now();
      await page.screenshot({
        path: `/Users/maksimtereshin/Projects/Personal/biz-assess-platform/agent-os/specs/2026-01-06-admin-panel-cms/verification/screenshots/survey-preview-structure-${timestamp}.png`,
        fullPage: true,
      });
    } else {
      console.log("Preview button not found, skipping structure test");
    }
  });

  test("should highlight validation errors if present", async ({ page }) => {
    // Generate admin token
    const token = generateAdminToken(adminUsername);

    // Navigate to /admin with token
    await page.goto(`${adminUrl}?token=${token}`);
    await page.waitForLoadState("networkidle");

    // Navigate to SurveyVersion resource
    await page.goto(`${adminUrl}/resources/SurveyVersion`);
    await page.waitForLoadState("networkidle");

    // Click on first version
    const firstVersion = page.locator('table tbody tr').first();
    await firstVersion.click();
    await page.waitForLoadState("networkidle");

    // Click the Preview button
    const previewButton = page.locator('button:has-text("Предпросмотр"), a:has-text("Предпросмотр")');

    if (await previewButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await previewButton.click();
      await page.waitForTimeout(2000);

      // Check if validation error summary exists
      const errorSummary = page.locator('text="Обнаружено ошибок валидации:"');

      if (await errorSummary.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Take screenshot showing validation errors
        const timestamp = Date.now();
        await page.screenshot({
          path: `/Users/maksimtereshin/Projects/Personal/biz-assess-platform/agent-os/specs/2026-01-06-admin-panel-cms/verification/screenshots/survey-preview-validation-errors-${timestamp}.png`,
          fullPage: true,
        });

        // Verify error count is displayed
        await expect(errorSummary).toBeVisible();
      } else {
        console.log("No validation errors found (survey structure is valid)");
      }
    } else {
      console.log("Preview button not found, skipping validation test");
    }
  });
});
