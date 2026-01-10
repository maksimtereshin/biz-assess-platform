/**
 * Telegram bot configuration constants
 */

/**
 * @deprecated This hardcoded list is no longer used. Admin status is now managed via the admins table.
 * Use AdminService.isAdmin() to check admin status instead.
 *
 * Legacy list of authorized admin usernames (without @ symbol)
 * Kept for backward compatibility only.
 */
export const ADMIN_USERNAMES: string[] = [
  'maksim_tereshin',
  'magistratus_pro',
];

/**
 * Admin panel menu texts
 */
export const ADMIN_PANEL = {
  BUTTON_TEXT: '🔧 Админ панель',
  MENU_TITLE: '👨‍💼 *Админ Панель*\n\nВыберите действие:',
  ALL_TIME_ANALYTICS: '📊 Аналитика за весь период',
  CUSTOM_ANALYTICS: '📅 Аналитика за период',
  BACK_TO_MAIN: '⬅️ Назад в главное меню',
} as const;
