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
export const ADMIN_USERNAMES: string[] = ["maksim_tereshin", "magistratus_pro"];

/**
 * Admin panel menu texts
 */
export const ADMIN_PANEL = {
  BUTTON_TEXT: "🔧 Админ панель",
  MENU_TITLE: "👨‍💼 *Админ Панель*\n\nВыберите действие:",
  ALL_TIME_ANALYTICS: "📊 Аналитика за весь период",
  CUSTOM_ANALYTICS: "📅 Аналитика за период",
  BACK_TO_MAIN: "⬅️ Назад в главное меню",
} as const;

/**
 * Content fallbacks for bot_content table
 * Used when database content not available
 * All content keys must have fallback values
 */
export const CONTENT_FALLBACKS: Record<string, string> = {
  // Welcome message
  welcome_message:
    "Добро пожаловать в мастерскую Спроси у Богданова, {firstName}!",

  // Main menu buttons
  main_button_checkup: "🔍 Чекап",
  main_button_booking: "📅 Запись на старт сессию",
  main_button_about: "ℹ️ О проекте",
  main_button_faq: "❓ FAQ",
  main_button_referral: "🎁 Реферальная программа",
  main_button_admin: "🔧 Админ панель",

  // Checkup submenu
  checkup_submenu_title: "Выберите действие:",
  checkup_submenu_start: "🚀 Начать Чекап",
  checkup_submenu_results: "📊 Мои результаты",
  checkup_submenu_referral: "🎁 Реферальная программа",
  checkup_submenu_back: "⬅️ Назад",

  // System messages
  wip_message: "Эта функция находится в разработке. Скоро будет доступна!",

  // Command descriptions
  command_start_desc: "Главное меню бота",
  command_checkup_desc: "Начать чекап-опрос",
  command_results_desc: "Посмотреть результаты опросов",
  command_referral_desc: "Реферальная программа",
  command_about_desc: "О проекте",
  command_faq_desc: "Часто задаваемые вопросы",
  command_admin_desc: "Админ панель",
} as const;
