/**
 * Telegram bot configuration constants
 */

/**
 * List of authorized admin usernames (without @ symbol)
 * Admin users have access to:
 * - Analytics dashboard
 * - Report generation
 * - User statistics
 * - Platform metrics
 *
 * To add/remove admins, update this array and redeploy
 */
export const ADMIN_USERNAMES: string[] = [
  'maksim_tereshin',
  'magistratus_pro',
];

/**
 * Admin panel menu texts
 */
export const ADMIN_PANEL = {
  BUTTON_TEXT: '👨‍💼 Админ',
  MENU_TITLE: '👨‍💼 *Админ Панель*\n\nВыберите действие:',
  ALL_TIME_ANALYTICS: '📊 Аналитика за весь период',
  CUSTOM_ANALYTICS: '📅 Аналитика за период',
  BACK_TO_MAIN: '⬅️ Назад в главное меню',
} as const;
