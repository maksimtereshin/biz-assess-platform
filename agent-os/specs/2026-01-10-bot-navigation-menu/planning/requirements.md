# Spec Requirements: Bot Navigation Menu

## Initial Description

Implement a comprehensive navigation menu system for the Telegram bot with:
- Welcome screen with greeting message and "Start" button (avoiding manual /start command)
- Main menu with 6 buttons: Чекап, Запись на старт сессию, О проекте, FAQ, Реферальная программа, Админ панель
- "Чекап" submenu with 3 buttons: Начать Чекап, Мои результаты, Реферальная программа
- Back buttons on all menus except the start screen
- Menu button next to the Telegram search bar with the same navigation structure
- All menus should use inline keyboards with callback_data
- "Work in progress" messages for features under development
- Admin panel button visible only to admins (checked via admins table)
- **All content (texts, messages) should be configurable via admin panel** (stored in database for future admin panel integration)

## Requirements Discussion

### First Round Questions

**Q1:** Should users see a welcome message with a Start button when they first open the bot, or should they continue to use the /start command?
**Answer:** Show welcome message + Start button on first bot open. Users don't know slash commands, so this improves UX. Research best practices for bot usability.

**Q2:** What should happen when users click on "Запись на старт сессию", "О проекте", "FAQ", and "Реферальная программа" buttons that are not yet implemented?
**Answer:** Show system message "Эта функция находится в разработке. Скоро будет доступна!" for items: "Запись на старт сессию", "О проекте", "FAQ", "Реферальная программа".

**Q3:** For the Menu button next to the search bar, should this be a separate menu button or should we use Telegram's BotCommandScopeDefault?
**Answer:** Use Telegram "Menu Button" (BotCommandScopeDefault) with bot commands.

**Q4:** The existing "ЧЕК АП" functionality has callback handlers (start_checkup, my_results, referral). Should we keep these handlers or create new ones?
**Answer:** Keep existing callback handlers (start_checkup, my_results, referral), just reorganize menu structure.

**Q5:** Should the "Админ панель" button be visible to all users or only to admins?
**Answer:** Button only visible to admins (check admins table).

**Q6:** What should the welcome message text be? "Добро пожаловать, {firstName}!" or something else?
**Answer:** "Добро пожаловать, {firstName}!" is OK.

**Q7:** For the back button navigation, should it use a breadcrumb-style (remember navigation path) or just go back to the previous menu?
**Answer:** Use breadcrumb-style (remember navigation path).

**Q8:** Should all keyboards be inline keyboards (current approach with callback_data) or reply keyboards?
**Answer:** Inline keyboards (current approach with callback_data).

**Q9:** Should all menu texts and messages be configurable via admin panel?
**Answer:** Yes, all content (texts) should be configurable through admin panel. For now, store as static data in database without admin panel UI (will be added in future Phase 2 admin panel implementation).

### Existing Code to Reference

**Similar Features Identified:**
- Feature: Telegram inline keyboard navigation - Path: `backend/src/telegram/telegram.service.ts`
- Components to potentially reuse:
  - `getMainKeyboard()` method (lines 99-120)
  - `getSurveyTypeKeyboard()` method (lines 122-152)
  - `handleCallbackQuery()` method (lines 232-301)
  - `handleStartCommand()` method (lines 303-334)
  - `handleStartCheckup()` method (lines 336-358)
  - `isAdmin()` method (lines 84-97)
- Backend logic to reference:
  - Inline keyboard structure using `InlineKeyboardMarkup` interface (lines 20-29)
  - Callback query routing pattern (lines 232-301)
  - Admin checking logic using `AdminService.isAdmin()` (lines 84-97)
  - Dynamic keyboard generation based on user role (lines 320-327)

**Database:**
- Admin table: `backend/src/entities/admin.entity.ts`
  - Contains `telegram_username` field (unique)
  - Used for admin authorization checking

**Constants:**
- Admin panel constants: `backend/src/telegram/telegram.constants.ts`
  - `ADMIN_PANEL.BUTTON_TEXT`, `ADMIN_PANEL.MENU_TITLE`, etc.

**Future Integration:**
- Phase 2 Admin Panel CMS (from roadmap) will provide UI for editing bot content
- For now, content stored in database as static data without admin UI

## Visual Assets

### Files Provided:
- `start-screen-mockup.png`: Shows the initial welcome screen design with greeting message and main menu structure
- `go-to-admin-flow.png`: Illustrates the complete navigation flow from start screen → main menu → "Чекап" submenu with back button navigation

### Visual Insights:

**start-screen-mockup.png:**
- Design shows a welcome message bubble at the top: "Добро пожаловать в мастерскую Спроси у Богданова, {имя юзера}!"
- Main menu with 6 vertically stacked buttons:
  1. "Чекап"
  2. "Запись на старт сессию"
  3. "О проекте"
  4. "FAQ"
  5. "Админ панель"
- Bottom UI shows "Menu" button (Telegram menu button) and "Write a message" input
- Admin panel button links to WebApp /admin
- Fidelity level: Low-fidelity wireframe (hand-drawn style)

**go-to-admin-flow.png:**
- Three-screen flow diagram showing navigation hierarchy:

  **Screen 1 (Start):**
  - Welcome message in speech bubble
  - Main menu buttons (same as start-screen-mockup.png)
  - "Админ" and "write a message" at bottom

  **Screen 2 (Чекап submenu):**
  - Title: "Выберите действие" or similar
  - Buttons:
    - Начать ЧЕК АП (with emoji, appears to be 🚀)
    - Результаты (with visual indicator for viewing reports)
    - Реферальная программа (with description)
  - "Назад" button at bottom
  - "write a message" at bottom

  **Screen 3 (Same as Screen 2, showing "Back" returns to main):**
  - Shows that "Назад" button navigates back to main menu

- Navigation arrows show:
  - Start → Чекап submenu → Back to start
  - Start → Admin panel → WebApp /admin
  - Start → FAQ → WebApp /faq

- Fidelity level: Low-fidelity wireframe (hand-drawn style)

**Key Design Patterns:**
- All menus use inline keyboard buttons (rectangular, full-width)
- Navigation is hierarchical: Main menu → Submenu → Back to main
- Back buttons ("Назад") appear on submenus, not on main start screen
- Admin-specific buttons conditionally rendered based on user role
- WebApp integration for admin panel (opens /admin URL)

**UI Components Shown:**
- Inline keyboard buttons with text and emojis
- Speech bubble for welcome message
- Menu button at bottom left (Telegram's native menu button)
- Message input field at bottom

## Requirements Summary

### Functional Requirements

**1. Welcome Screen (First Bot Open)**
- When user first opens the bot (before sending /start), show:
  - Welcome message: "Добро пожаловать, {firstName}!" (using user's Telegram first name)
  - This may require setting up a bot menu button or using Telegram's onboarding flow
  - Research Telegram Bot API best practices for first-time user experience
- **Content stored in database** for future admin panel editing

**2. Main Menu Structure**
- Display 6 buttons (vertically stacked inline keyboard):
  1. 🎯 Чекап (callback_data: "main_checkup")
  2. 📅 Запись на старт сессию (callback_data: "main_booking") - WIP
  3. ℹ️ О проекте (callback_data: "main_about") - WIP
  4. ❓ FAQ (callback_data: "main_faq") - WIP
  5. 👥 Реферальная программа (callback_data: "main_referral")
  6. 🔧 Админ панель (callback_data: "main_admin") - **Visible only to admins**
- **All button texts, emojis, and messages stored in database**

**3. "Чекап" Submenu**
- When user clicks "Чекап" button on main menu, show submenu with:
  1. 🚀 Начать Чекап (callback_data: "start_checkup") - **Existing handler**
  2. 📊 Мои результаты (callback_data: "my_results") - **Existing handler**
  3. 👥 Реферальная программа (callback_data: "referral") - **Existing handler**
  4. ⬅️ Назад (callback_data: "back_to_main") - **Existing handler**
- **Submenu message and button texts stored in database**

**4. Work-in-Progress (WIP) Handlers**
- For buttons: "Запись на старт сессию", "О проекте", "FAQ"
- When clicked, show message: "Эта функция находится в разработке. Скоро будет доступна!"
- Do not navigate away from current menu
- **WIP message text stored in database**

**5. Admin Panel Access**
- "Админ панель" button visible only to users in `admins` table
- Check using `AdminService.isAdmin(username)` method (existing)
- When clicked, use existing `handleAdminPanelButton()` flow (lines 364-409)

**6. Telegram Menu Button**
- Configure Telegram bot commands using BotCommandScopeDefault
- Commands should mirror main menu structure:
  - /start - Show main menu
  - /checkup - Go to Чекап submenu
  - /results - Show Мои результаты
  - /referral - Show реферальная программа
  - /about - Show О проекте (WIP message)
  - /faq - Show FAQ (WIP message)
  - /admin - Admin panel (admin only)
- **Command descriptions stored in database**

**7. Navigation Flow**
- Main menu is the "root" - no back button
- All submenus have "⬅️ Назад" button that returns to main menu
- Breadcrumb-style navigation: track where user came from
- Existing "back_to_main" callback handler should work (line 249-250)

**8. Existing Functionality Preservation**
- Keep all existing callback handlers:
  - `start_checkup` (line 239)
  - `my_results` (line 241)
  - `referral` (line 243)
  - `about` (line 245) - Update to WIP
  - `help` (line 247) - Update to WIP
  - `back_to_main` (line 249)
  - `admin_panel` (line 251)
- Do not break existing flows for:
  - Survey selection (express/full)
  - Report downloads
  - Payment flow
  - Admin analytics

**9. Content Management (Database)**
- **NEW REQUIREMENT:** All user-facing content must be stored in database:
  - Welcome message template ("Добро пожаловать, {firstName}!")
  - Main menu button texts and emojis
  - Submenu button texts and emojis
  - WIP message text
  - Bot command descriptions
  - Menu navigation messages (e.g., "Выберите действие:")
- **Database Table Structure:**
  - Create `bot_content` table with columns:
    - `id` (primary key)
    - `content_key` (unique string identifier, e.g., "welcome_message", "main_menu_checkup")
    - `content_value` (text content)
    - `content_type` (enum: "message", "button_text", "command_description")
    - `language` (default: "ru", for future multilingual support)
    - `created_at`, `updated_at`
- **Content Loading Pattern:**
  - Service method: `ContentService.getContent(key: string): Promise<string>`
  - Cache content in memory to avoid database queries on every request
  - Fallback to hardcoded defaults if database content not found
- **Future Admin Panel Integration:**
  - Phase 2 will add admin UI for editing `bot_content` table
  - For now, content seeded via migration or manual SQL INSERT

### Reusability Opportunities

**Existing Methods to Reuse:**
1. `getMainKeyboard(user)` (lines 99-120)
   - Modify to return new main menu structure
   - Keep admin button conditional logic
   - Load button texts from database

2. `getSurveyTypeKeyboard(telegramId)` (lines 122-152)
   - Rename or create new method: `getCheckupSubmenu(telegramId)`
   - Use for "Чекап" submenu
   - Load button texts from database

3. `handleCallbackQuery(callbackQuery)` (lines 232-301)
   - Add new callback handlers: `main_checkup`, `main_booking`, `main_about`, `main_faq`, `main_referral`
   - Keep existing handlers

4. `isAdmin(username)` (lines 84-97)
   - Use for conditional admin button rendering

5. `handleStartCommand(chatId, user)` (lines 303-334)
   - Modify to show new main menu structure
   - Load welcome message from database

**Similar Patterns to Follow:**
- Inline keyboard structure (lines 20-29)
- Callback data routing (lines 232-301)
- Dynamic keyboard based on user role (lines 320-327)
- Message sending with keyboard (lines 1400-1433)

**New Patterns to Create:**
- Content loading service (ContentService)
- Content caching mechanism
- Database migration for bot_content table
- Content seeding pattern

### Scope Boundaries

**In Scope:**
- Welcome message on bot first open (research Telegram API)
- New main menu with 6 buttons
- "Чекап" submenu with 3 buttons + back button
- WIP messages for unimplemented features
- Admin panel button visibility control
- Telegram menu button commands (BotCommandScopeDefault)
- Navigation flow and back button handling
- Integration with existing callback handlers
- **Database table for bot content (bot_content)**
- **ContentService for loading content from database**
- **Database migration to seed initial content**
- **Caching mechanism for content**

**Out of Scope:**
- Implementation of "Запись на старт сессию" feature (show WIP message only)
- Implementation of "О проекте" content (show WIP message only)
- Implementation of "FAQ" content (show WIP message only)
- Changes to existing survey flow (express/full)
- Changes to existing report generation
- Changes to existing payment flow
- Changes to existing admin analytics
- **Admin panel UI for editing bot content** (Phase 2 - future work)
- **Multilingual support** (language field exists for future, but only "ru" used now)

**Future Enhancements:**
- Replace WIP messages with actual implementations
- Add more submenus if needed
- Enhance navigation with inline query support
- Add menu analytics tracking
- **Phase 2 Admin Panel CMS for editing bot_content table**
- **Multilingual content support**

### Technical Considerations

**Integration Points:**
1. **TelegramService.ts** (main implementation file)
   - Modify `getMainKeyboard()` to return new structure with database content
   - Create `getCheckupSubmenu()` method with database content
   - Add new callback handlers in `handleCallbackQuery()`
   - Update `handleStartCommand()` to show new welcome message from database

2. **New: ContentService.ts** (content management service)
   - Method: `getContent(key: string): Promise<string>`
   - Method: `getCachedContent(key: string): string` (with fallback)
   - Content caching in memory (Map or object)
   - Fallback to hardcoded defaults if database fails
   - Example usage:
     ```typescript
     const welcomeMsg = await contentService.getContent('welcome_message');
     const formattedMsg = welcomeMsg.replace('{firstName}', user.first_name);
     ```

3. **New: bot_content.entity.ts** (TypeORM entity)
   - Entity for `bot_content` table
   - Fields: id, content_key, content_value, content_type, language, created_at, updated_at
   - Indexed on: content_key (unique), language

4. **New: Migration file** (TypeORM migration)
   - Create `bot_content` table
   - Seed initial content:
     - Welcome message
     - Main menu button texts (6 buttons)
     - Submenu button texts (4 buttons)
     - WIP message
     - Bot command descriptions (7 commands)
     - Navigation messages

5. **telegram.constants.ts**
   - Keep constants for callback_data values (not stored in DB)
   - Remove hardcoded message texts (moved to database)
   - Example:
     ```typescript
     export const CALLBACK_DATA = {
       MAIN_CHECKUP: 'main_checkup',
       MAIN_BOOKING: 'main_booking',
       MAIN_ABOUT: 'main_about',
       MAIN_FAQ: 'main_faq',
       MAIN_REFERRAL: 'main_referral',
       MAIN_ADMIN: 'main_admin',
     } as const;

     // Hardcoded fallback defaults (if database fails)
     export const CONTENT_FALLBACKS = {
       WELCOME_MESSAGE: 'Добро пожаловать, {firstName}!',
       WIP_MESSAGE: 'Эта функция находится в разработке. Скоро будет доступна!',
       // ... other fallbacks
     } as const;
     ```

6. **Admin Authorization**
   - Use existing `AdminService.isAdmin(username)` method
   - Check before rendering admin button in `getMainKeyboard()`

7. **Telegram Bot Commands (BotCommandScopeDefault)**
   - Configure via Telegram Bot API `setMyCommands` method
   - May require TelegramService initialization method or separate endpoint
   - Command descriptions loaded from database

8. **Callback Data Naming Convention**
   - Main menu: `main_*` (e.g., `main_checkup`, `main_booking`)
   - Submenu: Keep existing (`start_checkup`, `my_results`, `referral`)
   - Navigation: Keep existing (`back_to_main`)

9. **Welcome Message on First Open**
   - Research: Can Telegram show message before /start command?
   - Option 1: Set bot description with call-to-action
   - Option 2: Use Telegram menu button with /start command
   - Option 3: Detect first user interaction and show welcome

**Database Schema (bot_content table):**
```typescript
// Example TypeORM entity
@Entity('bot_content')
export class BotContent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  content_key: string;

  @Column({ type: 'text' })
  content_value: string;

  @Column({ type: 'enum', enum: ['message', 'button_text', 'command_description'] })
  content_type: string;

  @Column({ default: 'ru' })
  language: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

**Content Keys Convention:**
- Welcome message: `welcome_message`
- Main menu buttons: `main_button_checkup`, `main_button_booking`, `main_button_about`, `main_button_faq`, `main_button_referral`, `main_button_admin`
- Submenu buttons: `checkup_submenu_start`, `checkup_submenu_results`, `checkup_submenu_referral`, `checkup_submenu_back`
- Messages: `wip_message`, `checkup_submenu_title`
- Bot commands: `command_start_desc`, `command_checkup_desc`, etc.

**Existing System Constraints:**
- Must work with existing webhook handler (TelegramController)
- Must maintain backward compatibility with existing inline keyboards
- Must not break existing user flows (surveys, reports, payments)
- Admin checking relies on `admins` table (telegram_username unique)
- **Content loading must be fast** (cache in memory, avoid DB query on every request)

**Technology Patterns:**
- NestJS service pattern for TelegramService and ContentService
- TypeORM for admin table queries and bot_content queries
- Telegram Bot API via fetch (not node-telegram-bot-api library)
- Inline keyboards with callback_data (not reply keyboards)
- **Content caching pattern** (load once, refresh on update)

**Similar Code Patterns to Follow:**
1. Keyboard generation pattern (lines 99-152)
2. Callback routing pattern (lines 232-301)
3. Admin checking pattern (lines 84-97, 320-327)
4. Message sending pattern (lines 1400-1433)
5. **Service injection pattern** (ContentService injected into TelegramService)
6. **Database entity pattern** (similar to Admin, User entities)
