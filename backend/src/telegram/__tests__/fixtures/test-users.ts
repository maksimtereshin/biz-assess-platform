/**
 * Test user data fixtures for Telegram E2E tests
 *
 * These constants are used across test files to ensure consistency.
 * Values are read from .env.test file for flexibility.
 */

export const TEST_ADMIN_USER = {
  username: process.env.TEST_ADMIN_USERNAME || "maksim_tereshin",
  chatId: parseInt(process.env.TEST_ADMIN_CHAT_ID || "123456789"),
  userId: parseInt(process.env.TEST_ADMIN_CHAT_ID || "123456789"), // Telegram uses same ID for chat and user
};

export const TEST_NONADMIN_USER = {
  username: process.env.TEST_NONADMIN_USERNAME || "test_user_123",
  chatId: parseInt(process.env.TEST_NONADMIN_CHAT_ID || "987654321"),
  userId: parseInt(process.env.TEST_NONADMIN_CHAT_ID || "987654321"),
};

/**
 * Expected admin button text from telegram.constants.ts
 */
export const ADMIN_BUTTON_TEXT = "🔧 Админ панель";

/**
 * Expected callback data for admin panel button
 */
export const ADMIN_BUTTON_CALLBACK_DATA = "admin_panel";
