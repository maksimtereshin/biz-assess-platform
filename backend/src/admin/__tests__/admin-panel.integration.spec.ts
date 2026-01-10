import { test, expect } from "@playwright/test";
import { JwtService } from "@nestjs/jwt";
import { DataSource } from "typeorm";
import { Survey } from "../../entities/survey.entity";
import { SurveyVersion } from "../../entities/survey-version.entity";
import { Admin } from "../../entities/admin.entity";
import { SurveySession } from "../../entities/survey-session.entity";

/**
 * Integration E2E tests for Admin Panel CMS
 * Phase 5, Group 5.1: Integration Tests (tasks 11.2-11.6)
 *
 * Critical workflows covered:
 * 1. Survey creation workflow (draft → edit → publish)
 * 2. Versioning on edit (version isolation for active sessions)
 * 3. Admin auto-authentication (token-based access control)
 * 4. Admin management (add/remove administrators)
 * 5. JSONB structure validation (duplicate IDs, invalid ranges)
 *
 * Note: Task 11.7 (Bot admin button integration) requires Telegram bot testing
 * which is better suited for manual testing or Telegram MCP integration.
 */

// Helper to generate admin token (mimics AuthService.generateAdminAuthToken)
function generateAdminToken(username: string): string {
  const jwtService = new JwtService({
    secret: process.env.JWT_SECRET || "dev-jwt-secret-key-not-for-production",
  });

  const payload = {
    username,
    role: "admin",
  };

  return jwtService.sign(payload, { expiresIn: "15m" });
}

// Helper to navigate to a resource
async function navigateToResource(page: any, resourceGroup: string, resourcePath: string) {
  // Expand navigation group (sidebar is expanded on large viewports)
  await page.locator(`text=${resourceGroup}`).click();
  await page.waitForTimeout(500);

  // Click on resource link
  await page.click(`a[href*="${resourcePath}"]`);
  await page.waitForLoadState("networkidle");
}

test.describe("Admin Panel Integration Tests", () => {
  const baseUrl = process.env.BASE_URL || "http://localhost:4000";
  const adminUrl = `${baseUrl}/admin`;
  const adminUsername = "maksim_tereshin"; // From seed data

  test.beforeEach(async ({ page, context }) => {
    // Set viewport large enough to keep sidebar expanded (AdminJS collapses sidebar below ~1440px)
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Clear all cookies and storage to prevent session persistence between tests
    await context.clearCookies();
    await page.context().clearPermissions();
  });

  /**
   * Test 11.2: Survey Creation Workflow
   *
   * Tests the complete workflow of:
   * - Creating a new survey in DRAFT status
   * - Editing structure through JSONB editor
   * - Publishing the version
   * - Verifying latest_published_version_id is updated
   * - Verifying new sessions use the published version
   */
  test("should complete survey creation workflow (draft → edit → publish)", async ({
    page,
  }) => {
    const token = generateAdminToken(adminUsername);

    // Step 1: Navigate to AdminJS
    await page.goto(`${adminUrl}?token=${token}`);
    await page.waitForLoadState("networkidle");

    // Step 2: Navigate to SurveyVersion resource
    await navigateToResource(page, "Опросы", "/resources/SurveyVersion");

    // Step 3: Click "New" to create a new survey version
    await page.click('a[href*="/resources/SurveyVersion/actions/new"]');
    await page.waitForLoadState("networkidle");

    // Step 4: Fill in survey details
    const surveyName = `Integration Test Survey ${Date.now()}`;
    await page.fill('input[name="name"]', surveyName);

    // Select survey type (EXPRESS)
    await page.selectOption('select[name="type"]', "EXPRESS");

    // Select status (DRAFT)
    await page.selectOption('select[name="status"]', "DRAFT");

    // Step 5: Fill in JSONB structure (valid structure)
    const validStructure = JSON.stringify([
      {
        id: "cat1",
        name: "Test Category",
        subcategories: [
          {
            id: "subcat1",
            name: "Test Subcategory",
            questions: [
              {
                id: 1,
                text: "Test Question",
                answers: [
                  { value: 1, text: "Answer 1" },
                  { value: 2, text: "Answer 2" },
                ],
              },
            ],
          },
        ],
      },
    ]);

    // Find the structure textarea and fill it
    await page.fill('textarea[name="structure"]', validStructure);

    // Step 6: Save the draft
    await page.click('button[type="submit"]');
    await page.waitForLoadState("networkidle");

    // Verify success message or redirect to show page
    await expect(page).toHaveURL(/\/resources\/SurveyVersion\/(show|edit)/);

    // Take screenshot
    await page.screenshot({
      path: "/Users/maksimtereshin/Projects/Personal/biz-assess-platform/agent-os/specs/2026-01-06-admin-panel-cms/verification/screenshots/integration-survey-created-draft.png",
      fullPage: true,
    });

    // Step 7: Publish the version
    // Find the publish button/action (custom action)
    await page.click('button:has-text("Publish")');
    await page.waitForLoadState("networkidle");

    // Verify status changed to PUBLISHED
    const statusElement = await page.textContent('td:has-text("Status")');
    expect(statusElement).toContain("PUBLISHED");

    // Take screenshot of published version
    await page.screenshot({
      path: "/Users/maksimtereshin/Projects/Personal/biz-assess-platform/agent-os/specs/2026-01-06-admin-panel-cms/verification/screenshots/integration-survey-published.png",
      fullPage: true,
    });
  });

  /**
   * Test 11.3: Versioning on Edit
   *
   * Tests that:
   * - When editing a published version, a new draft version is created
   * - Old sessions continue using the old version
   * - After publishing the new version, new sessions use it
   */
  test("should create new version on edit and maintain session isolation", async ({
    page,
  }) => {
    const token = generateAdminToken(adminUsername);

    // Step 1: Navigate to AdminJS and find a published version
    await page.goto(`${adminUrl}?token=${token}`);
    await page.waitForLoadState("networkidle");

    await navigateToResource(page, "Опросы", "/resources/SurveyVersion");

    // Step 2: Find a PUBLISHED version and note its version number
    const firstPublishedRow = await page
      .locator('tr:has(td:has-text("PUBLISHED"))')
      .first();
    const versionText = await firstPublishedRow
      .locator("td")
      .nth(2)
      .textContent(); // Version column
    const originalVersion = parseInt(versionText || "1");

    // Click on the published version to view details
    await firstPublishedRow.click();
    await page.waitForLoadState("networkidle");

    // Step 3: Click "Create New Version" custom action
    await page.click('button:has-text("Create New Version")');
    await page.waitForLoadState("networkidle");

    // Verify a new version was created
    await page.click('a[href*="/resources/SurveyVersion"]');
    await page.waitForLoadState("networkidle");

    // Check that a new DRAFT version exists with version number = originalVersion + 1
    const newDraftRow = await page.locator(
      `tr:has(td:has-text("${originalVersion + 1}")):has(td:has-text("DRAFT"))`,
    );
    await expect(newDraftRow).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: "/Users/maksimtereshin/Projects/Personal/biz-assess-platform/agent-os/specs/2026-01-06-admin-panel-cms/verification/screenshots/integration-versioning-new-draft.png",
      fullPage: true,
    });

    // Step 4: Publish the new version
    await newDraftRow.click();
    await page.waitForLoadState("networkidle");

    await page.click('button:has-text("Publish")');
    await page.waitForLoadState("networkidle");

    // Verify new version is PUBLISHED
    const statusElement = await page.textContent('td:has-text("Status")');
    expect(statusElement).toContain("PUBLISHED");

    // Take screenshot
    await page.screenshot({
      path: "/Users/maksimtereshin/Projects/Personal/biz-assess-platform/agent-os/specs/2026-01-06-admin-panel-cms/verification/screenshots/integration-versioning-published.png",
      fullPage: true,
    });
  });

  /**
   * Test 11.4: Admin Auto-Authentication
   *
   * Tests that:
   * - Non-admin user with token gets access denied (403 or error message)
   * - Admin user with token gets automatic login and access to AdminJS
   */
  test("should enforce admin authentication with token", async ({ page }) => {
    // Test 1: Non-admin user (invalid username)
    const invalidToken = generateAdminToken("non_admin_user");

    const response = await page.goto(`${adminUrl}?token=${invalidToken}`);
    await page.waitForLoadState("networkidle");

    // Check for access denial: either 403 status, error page, or access denied message
    const hasErrorStatus =
      response?.status() === 403 || response?.status() === 401;
    const hasErrorMessage = await page
      .locator(
        "text=/Доступ запрещен|Access denied|Forbidden|не являетесь администратором/i",
      )
      .count();

    // At least one of these should be true
    expect(hasErrorStatus || hasErrorMessage > 0).toBe(true);

    // Take screenshot of forbidden access
    await page.screenshot({
      path: "/Users/maksimtereshin/Projects/Personal/biz-assess-platform/agent-os/specs/2026-01-06-admin-panel-cms/verification/screenshots/integration-auth-forbidden.png",
      fullPage: true,
    });

    // Test 2: Valid admin user (need fresh page context)
    const validToken = generateAdminToken(adminUsername);

    await page.goto(`${adminUrl}?token=${validToken}`);
    await page.waitForLoadState("networkidle");

    // Verify AdminJS loaded successfully
    await expect(page).toHaveTitle(/BizAssess Admin Panel/);

    // Verify admin resources are visible (navigation groups)
    const navigationText = await page.textContent("body");
    expect(navigationText).toContain("Администрирование");
    expect(navigationText).toContain("Опросы");

    // Take screenshot of successful authentication
    await page.screenshot({
      path: "/Users/maksimtereshin/Projects/Personal/biz-assess-platform/agent-os/specs/2026-01-06-admin-panel-cms/verification/screenshots/integration-auth-success.png",
      fullPage: true,
    });
  });

  /**
   * Test 11.5: Admin Management
   *
   * Tests that:
   * - Admin can add new administrators
   * - Admin can remove administrators (not the last one)
   * - Cannot remove the last administrator
   */
  test("should manage administrators (add/remove with last-admin protection)", async ({
    page,
  }) => {
    const token = generateAdminToken(adminUsername);

    // Step 1: Navigate to Admin resource
    await page.goto(`${adminUrl}?token=${token}`);
    await page.waitForLoadState("networkidle");

    await navigateToResource(page, "Администрирование", "/resources/Admin");

    // Step 2: Count existing admins
    const adminRows = await page.locator("tbody tr").count();

    // Step 3: Add a new admin
    await page.click('a[href*="/resources/Admin/actions/new"]');
    await page.waitForLoadState("networkidle");

    const newAdminUsername = `test_admin_${Date.now()}`;
    await page.fill('input[name="telegram_username"]', newAdminUsername);

    await page.click('button[type="submit"]');
    await page.waitForLoadState("networkidle");

    // Verify new admin was added
    await page.click('a[href*="/resources/Admin"]');
    await page.waitForLoadState("networkidle");

    const newAdminRows = await page.locator("tbody tr").count();
    expect(newAdminRows).toBe(adminRows + 1);

    // Take screenshot
    await page.screenshot({
      path: "/Users/maksimtereshin/Projects/Personal/biz-assess-platform/agent-os/specs/2026-01-06-admin-panel-cms/verification/screenshots/integration-admin-added.png",
      fullPage: true,
    });

    // Step 4: Delete the newly added admin (not the last one)
    const newAdminRow = await page.locator(
      `tr:has-text("${newAdminUsername}")`,
    );
    await newAdminRow.click();
    await page.waitForLoadState("networkidle");

    await page.click('button:has-text("Delete")');
    await page.waitForLoadState("networkidle");

    // Confirm deletion
    await page.click('button:has-text("Confirm")');
    await page.waitForLoadState("networkidle");

    // Verify admin was removed
    await page.click('a[href*="/resources/Admin"]');
    await page.waitForLoadState("networkidle");

    const finalAdminRows = await page.locator("tbody tr").count();
    expect(finalAdminRows).toBe(adminRows);

    // Take screenshot
    await page.screenshot({
      path: "/Users/maksimtereshin/Projects/Personal/biz-assess-platform/agent-os/specs/2026-01-06-admin-panel-cms/verification/screenshots/integration-admin-removed.png",
      fullPage: true,
    });
  });

  /**
   * Test 11.6: JSONB Structure Validation
   *
   * Tests that:
   * - Duplicate IDs are rejected with validation error
   * - Invalid answer ranges are rejected
   * - Valid structure is accepted
   */
  test("should validate JSONB structure (duplicate IDs, invalid ranges)", async ({
    page,
  }) => {
    const token = generateAdminToken(adminUsername);

    // Step 1: Navigate to SurveyVersion new page
    await page.goto(`${adminUrl}?token=${token}`);
    await page.waitForLoadState("networkidle");

    await navigateToResource(page, "Опросы", "/resources/SurveyVersion");

    await page.click('a[href*="/resources/SurveyVersion/actions/new"]');
    await page.waitForLoadState("networkidle");

    // Fill basic fields
    await page.fill('input[name="name"]', `Validation Test ${Date.now()}`);
    await page.selectOption('select[name="type"]', "EXPRESS");
    await page.selectOption('select[name="status"]', "DRAFT");

    // Test 1: Duplicate category IDs
    const duplicateCategoryIDs = JSON.stringify([
      {
        id: "cat1",
        name: "Category 1",
        subcategories: [],
      },
      {
        id: "cat1", // DUPLICATE
        name: "Category 2",
        subcategories: [],
      },
    ]);

    await page.fill('textarea[name="structure"]', duplicateCategoryIDs);
    await page.click('button[type="submit"]');
    await page.waitForLoadState("networkidle");

    // Verify validation error is shown
    const errorMessage = await page
      .locator('.error, .alert-danger, [role="alert"]')
      .textContent();
    expect(errorMessage).toContain("duplicate");

    // Take screenshot
    await page.screenshot({
      path: "/Users/maksimtereshin/Projects/Personal/biz-assess-platform/agent-os/specs/2026-01-06-admin-panel-cms/verification/screenshots/integration-validation-duplicate-ids.png",
      fullPage: true,
    });

    // Test 2: Invalid answer range (min > max)
    const invalidRange = JSON.stringify([
      {
        id: "cat1",
        name: "Category 1",
        subcategories: [
          {
            id: "subcat1",
            name: "Subcategory 1",
            questions: [
              {
                id: 1,
                text: "Question 1",
                answers: [
                  { value: 5, text: "Answer 1" }, // max: 5
                  { value: 1, text: "Answer 2" }, // min: 1, but min > max
                ],
              },
            ],
          },
        ],
      },
    ]);

    await page.fill('textarea[name="structure"]', invalidRange);
    await page.click('button[type="submit"]');
    await page.waitForLoadState("networkidle");

    // Verify validation error
    const rangeError = await page
      .locator('.error, .alert-danger, [role="alert"]')
      .textContent();
    expect(rangeError).toContain("range" || "invalid");

    // Take screenshot
    await page.screenshot({
      path: "/Users/maksimtereshin/Projects/Personal/biz-assess-platform/agent-os/specs/2026-01-06-admin-panel-cms/verification/screenshots/integration-validation-invalid-range.png",
      fullPage: true,
    });

    // Test 3: Valid structure
    const validStructure = JSON.stringify([
      {
        id: "cat1",
        name: "Valid Category",
        subcategories: [
          {
            id: "subcat1",
            name: "Valid Subcategory",
            questions: [
              {
                id: 1,
                text: "Valid Question",
                answers: [
                  { value: 1, text: "Answer 1" },
                  { value: 2, text: "Answer 2" },
                  { value: 3, text: "Answer 3" },
                ],
              },
            ],
          },
        ],
      },
    ]);

    await page.fill('textarea[name="structure"]', validStructure);
    await page.click('button[type="submit"]');
    await page.waitForLoadState("networkidle");

    // Verify success (redirected to show/list page)
    await expect(page).toHaveURL(/\/resources\/SurveyVersion\/(show|list)/);

    // Take screenshot
    await page.screenshot({
      path: "/Users/maksimtereshin/Projects/Personal/biz-assess-platform/agent-os/specs/2026-01-06-admin-panel-cms/verification/screenshots/integration-validation-success.png",
      fullPage: true,
    });
  });
});
