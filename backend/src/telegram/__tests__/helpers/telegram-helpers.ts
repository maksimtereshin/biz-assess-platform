/**
 * Telegram Bot API helper functions for E2E testing
 *
 * These utilities provide a clean interface for interacting with
 * Telegram Bot API during automated tests.
 */

import TelegramBot from "node-telegram-bot-api";

/**
 * Create a configured Telegram Bot client for testing
 *
 * @returns TelegramBot instance configured with test bot token
 * @throws Error if TELEGRAM_TEST_BOT_TOKEN is not set
 */
export function createTestBotClient(): TelegramBot {
  const token = process.env.TELEGRAM_TEST_BOT_TOKEN;

  if (!token || token === "your_test_bot_token_here") {
    throw new Error(
      "TELEGRAM_TEST_BOT_TOKEN not set in .env.test file. " +
        "Please create a test bot via @BotFather and add the token to .env.test"
    );
  }

  // Create bot with polling disabled (we'll use getUpdates manually)
  return new TelegramBot(token, { polling: false });
}

/**
 * Send a command or message to a chat
 *
 * @param bot - TelegramBot instance
 * @param chatId - Target chat ID
 * @param text - Message text or command (e.g., "/start")
 */
export async function sendCommand(
  bot: TelegramBot,
  chatId: number,
  text: string
): Promise<TelegramBot.Message> {
  return await bot.sendMessage(chatId, text);
}

/**
 * Wait for a bot update from a specific chat
 *
 * This function polls getUpdates() until it receives an update
 * from the specified chat ID, or times out.
 *
 * @param bot - TelegramBot instance
 * @param chatId - Expected chat ID to filter updates
 * @param timeoutMs - Maximum wait time in milliseconds (default: 5000)
 * @returns The received message
 * @throws Error if timeout is reached
 */
export async function waitForBotUpdate(
  bot: TelegramBot,
  chatId: number,
  timeoutMs: number = 5000
): Promise<TelegramBot.Message> {
  const startTime = Date.now();
  let lastUpdateId: number | undefined;

  while (Date.now() - startTime < timeoutMs) {
    // Get latest updates
    const updates = await bot.getUpdates({
      timeout: 1,
      offset: lastUpdateId ? lastUpdateId + 1 : undefined,
    });

    for (const update of updates) {
      // Update offset for next iteration
      lastUpdateId = Math.max(lastUpdateId || 0, update.update_id);

      // Check if this update is from the target chat
      if (update.message?.chat.id === chatId) {
        // Acknowledge this update so it won't be retrieved again
        await bot.getUpdates({ offset: update.update_id + 1, timeout: 0 });
        return update.message;
      }
    }

    // Wait a bit before next poll
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(
    `No update received for chat ${chatId} within ${timeoutMs}ms. ` +
      `Make sure the bot is running and the chat ID is correct.`
  );
}

/**
 * Extract JWT token from WebApp URL
 *
 * @param webAppUrl - WebApp URL containing token parameter
 * @returns Extracted JWT token
 * @throws Error if token parameter not found
 *
 * @example
 * const url = "http://localhost:4000/admin?token=eyJhbGciOi...";
 * const token = extractJwtToken(url);
 * // Returns: "eyJhbGciOi..."
 */
export function extractJwtToken(webAppUrl: string): string {
  const url = new URL(webAppUrl);
  const token = url.searchParams.get("token");

  if (!token) {
    throw new Error(
      `No token parameter found in WebApp URL: ${webAppUrl}. ` +
        `Expected format: ${url.origin}${url.pathname}?token=<JWT>`
    );
  }

  return token;
}

/**
 * Find a button in inline keyboard by callback_data
 *
 * @param keyboard - Telegram inline keyboard markup
 * @param callbackData - Expected callback_data value
 * @returns Found button or undefined
 */
export function findButtonByCallbackData(
  keyboard: TelegramBot.InlineKeyboardButton[][] | undefined,
  callbackData: string
): TelegramBot.InlineKeyboardButton | undefined {
  if (!keyboard) return undefined;

  return keyboard.flat().find((btn) => btn.callback_data === callbackData);
}

/**
 * Find a button in inline keyboard with WebApp URL
 *
 * @param keyboard - Telegram inline keyboard markup
 * @returns Found button with WebApp URL or undefined
 */
export function findWebAppButton(
  keyboard: TelegramBot.InlineKeyboardButton[][] | undefined
): TelegramBot.InlineKeyboardButton | undefined {
  if (!keyboard) return undefined;

  return keyboard.flat().find((btn) => btn.web_app?.url);
}

/**
 * Clear all pending updates for a bot
 *
 * This is useful in beforeEach hooks to ensure a clean state.
 *
 * @param bot - TelegramBot instance
 */
export async function clearPendingUpdates(bot: TelegramBot): Promise<void> {
  const updates = await bot.getUpdates({ timeout: 0 });

  if (updates.length > 0) {
    const lastUpdate = updates[updates.length - 1];
    await bot.getUpdates({ offset: lastUpdate.update_id + 1, timeout: 0 });
  }
}
