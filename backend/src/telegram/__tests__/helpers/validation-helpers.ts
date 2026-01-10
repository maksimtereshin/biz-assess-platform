/**
 * Validation helper functions for JWT tokens and AdminJS state
 *
 * These utilities verify that authentication and authorization
 * work correctly in E2E tests.
 */

import { Page, expect } from "@playwright/test";
import { JwtService } from "@nestjs/jwt";

/**
 * Validate JWT token structure and payload
 *
 * Checks:
 * - Token has valid JWT structure (3 parts: header.payload.signature)
 * - Token can be decoded and verified
 * - Payload contains required fields (username, role)
 * - Token expiration is reasonable (~15 minutes)
 *
 * @param token - JWT token string
 * @param expectedUsername - Expected username in token payload (optional)
 * @throws Error if validation fails
 */
export function validateJwtToken(
  token: string,
  expectedUsername?: string,
): void {
  // Check JWT structure: header.payload.signature
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error(
      `Invalid JWT structure. Expected 3 parts (header.payload.signature), got ${parts.length}`,
    );
  }

  // Verify token using JwtService
  const jwtSecret =
    process.env.JWT_SECRET || "dev-jwt-secret-key-not-for-production";
  const jwtService = new JwtService({
    secret: jwtSecret,
  } as any);

  let payload: any;
  try {
    payload = jwtService.verify(token);
  } catch (error) {
    throw new Error(`JWT verification failed: ${error.message}`);
  }

  // Validate payload fields
  if (!payload.username) {
    throw new Error(`JWT payload missing required field: username`);
  }

  if (!payload.role || payload.role !== "admin") {
    throw new Error(
      `JWT payload has invalid role: ${payload.role}. Expected: admin`,
    );
  }

  // Validate username if provided
  if (expectedUsername && payload.username !== expectedUsername) {
    throw new Error(
      `JWT username mismatch. Expected: ${expectedUsername}, got: ${payload.username}`,
    );
  }

  // Validate expiration (~15 minutes from now)
  if (!payload.exp) {
    throw new Error(`JWT payload missing expiration (exp) field`);
  }

  const expiresAt = new Date(payload.exp * 1000);
  const now = new Date();
  const diffMinutes = (expiresAt.getTime() - now.getTime()) / 1000 / 60;

  // Token should expire between 14 and 16 minutes from now
  if (diffMinutes < 14 || diffMinutes > 16) {
    throw new Error(
      `JWT expiration time unexpected. Expected ~15 minutes, got ${diffMinutes.toFixed(1)} minutes`,
    );
  }
}

/**
 * Verify that AdminJS is loaded and user is authenticated
 *
 * Checks:
 * - AdminJS UI has loaded (no error page)
 * - Navigation groups are visible ("Администрирование", "Опросы")
 * - No access denied messages
 *
 * @param page - Playwright Page object
 */
export async function verifyAdminAuthenticated(page: Page): Promise<void> {
  // Wait for AdminJS to load
  await page.waitForLoadState("networkidle");

  // Get page content
  const bodyText = await page.textContent("body");

  if (!bodyText) {
    throw new Error("Page body is empty. AdminJS may not have loaded.");
  }

  // Verify navigation groups are visible
  const hasAdminGroup = bodyText.includes("Администрирование");
  const hasSurveysGroup = bodyText.includes("Опросы");

  if (!hasAdminGroup) {
    throw new Error(
      'AdminJS navigation group "Администрирование" not found. User may not be authenticated.',
    );
  }

  if (!hasSurveysGroup) {
    throw new Error(
      'AdminJS navigation group "Опросы" not found. User may not have access to surveys.',
    );
  }

  // Verify no access denied messages
  const hasAccessDenied =
    bodyText.includes("Доступ запрещен") || bodyText.includes("Access Denied");

  if (hasAccessDenied) {
    throw new Error(
      "Access denied message found. User authentication may have failed.",
    );
  }

  // Verify AdminJS branding is present (confirms page loaded)
  const hasAdminJSBranding =
    bodyText.includes("Made with") || bodyText.includes("AdminJS");

  if (!hasAdminJSBranding) {
    throw new Error(
      "AdminJS branding not found. Page may not have loaded correctly.",
    );
  }
}

/**
 * Verify that admin can access resources in AdminJS
 *
 * Checks:
 * - Resource links are visible and clickable
 * - Can navigate to specific resources
 *
 * @param page - Playwright Page object
 * @param resourceName - Name of resource to check (e.g., "SurveyVersion", "Admin")
 */
export async function verifyResourceAccess(
  page: Page,
  resourceName: string,
): Promise<void> {
  // Look for resource link in navigation
  const resourceLink = page
    .locator(`a[href*="/resources/${resourceName}"]`)
    .first();

  // Verify link is visible
  await expect(resourceLink).toBeVisible({
    timeout: 10000,
  });

  // Verify link is clickable (not disabled)
  const isEnabled = await resourceLink.isEnabled();
  if (!isEnabled) {
    throw new Error(`Resource link for ${resourceName} is disabled`);
  }
}

/**
 * Verify that a specific admin username is visible in Admin resource
 *
 * @param page - Playwright Page object
 * @param username - Expected admin username
 */
export async function verifyAdminUsernameVisible(
  page: Page,
  username: string,
): Promise<void> {
  // Wait for content to load
  await page.waitForLoadState("networkidle");

  // Get page content
  const bodyText = await page.textContent("body");

  if (!bodyText) {
    throw new Error("Page body is empty");
  }

  // Check if username is visible
  if (!bodyText.includes(username)) {
    throw new Error(
      `Admin username "${username}" not found in Admin resource page`,
    );
  }
}
