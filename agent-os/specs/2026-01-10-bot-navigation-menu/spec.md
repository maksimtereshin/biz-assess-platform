# Specification: Bot Navigation Menu System

## Goal
Implement a comprehensive, database-driven navigation menu system for the Telegram bot that provides intuitive access to all bot features through hierarchical inline keyboards, with configurable content stored in database for future admin panel integration.

## User Stories
- As a first-time user, I want to see a friendly welcome message when I open the bot so that I understand I'm in the right place without knowing slash commands
- As a bot user, I want to navigate through menus using inline keyboard buttons so that I can access different features easily
- As an admin user, I want to see an "Админ панель" button that regular users cannot see so that I can access admin-only features

## Specific Requirements

**Welcome Screen on First Bot Open**
- When user first opens the bot or sends `/start`, show personalized welcome message: "Добро пожаловать в мастерскую Спроси у Богданова, {firstName}!"
- Welcome message text stored in `bot_content` table with key `welcome_message`
- Display main menu with 6 inline keyboard buttons immediately after welcome message
- No manual `/start` command required for first-time users

**Main Menu Structure with 6 Buttons**
- Display vertically-stacked inline keyboard with 6 buttons: Чекап, Запись на старт сессию, О проекте, FAQ, Реферальная программа, Админ панель
- Admin panel button visible only to users in `admins` table (checked via `AdminService.isAdmin()`)
- All button texts and emojis stored in `bot_content` table (keys: `main_button_checkup`, `main_button_booking`, etc.)
- Callback data follows naming convention: `main_checkup`, `main_booking`, `main_about`, `main_faq`, `main_referral`, `main_admin`
- Main menu has no back button (root level of navigation)

**"Чекап" Submenu with 3 Options**
- When user clicks "Чекап" button, display submenu with 3 buttons: Начать Чекап, Мои результаты, Реферальная программа
- Submenu includes "Назад" back button that returns to main menu
- Reuse existing callback handlers: `start_checkup`, `my_results`, `referral`, `back_to_main`
- Submenu title message and button texts stored in `bot_content` table
- Back button uses existing `back_to_main` callback handler

**Work-in-Progress Messages for Unimplemented Features**
- Buttons "Запись на старт сессию", "О проекте", "FAQ" show system message when clicked
- WIP message text: "Эта функция находится в разработке. Скоро будет доступна!"
- Message text stored in `bot_content` table with key `wip_message`
- After showing WIP message, do not navigate away from current menu
- Existing `about` and `help` callback handlers updated to show WIP message

**Telegram Menu Button Commands Integration**
- Configure bot commands using Telegram Bot API `setMyCommands` (BotCommandScopeDefault)
- Commands: `/start`, `/checkup`, `/results`, `/referral`, `/about`, `/faq`, `/admin` (admin only)
- Command descriptions loaded from `bot_content` table (keys: `command_start_desc`, `command_checkup_desc`, etc.)
- Commands mirror main menu structure for consistency
- Set commands on bot initialization in TelegramService

**Database-Driven Content Management**
- Create `bot_content` table with columns: id, content_key (unique), content_value (text), content_type (enum), language (default 'ru'), created_at, updated_at
- Content types: "message", "button_text", "command_description"
- Create ContentService with methods: `getContent(key)`, `getCachedContent(key)` with fallback to hardcoded defaults
- Implement in-memory caching for content (Map or object) to avoid database queries on every request
- Seed initial content via TypeORM migration with all menu texts, messages, button labels

**Breadcrumb-Style Navigation Flow**
- Main menu is root level (no back button)
- All submenus include "Назад" button that returns to main menu
- Track navigation context in callback handlers to support future multi-level navigation
- Existing `back_to_main` callback handler already supports returning to main menu

**Preserve Existing Functionality**
- Keep all existing callback handlers: `start_checkup`, `my_results`, `referral`, `admin_panel`, survey selection, report downloads, payment flows
- Do not break existing WebApp integration for surveys (express/full)
- Admin panel button uses existing `handleAdminPanelButton()` flow with WebApp URL
- Existing analytics, calendar, payment callbacks remain unchanged

## Visual Design

**`planning/visuals/start-screen-mockup.png`**
- Welcome message displayed in speech bubble format above main menu
- Main menu buttons vertically stacked, full-width inline keyboard style
- Admin panel button shown at bottom of menu (conditionally for admins only)
- Telegram "Menu" button visible at bottom left next to message input
- Clean, minimal design with emojis on each button for visual clarity

**`planning/visuals/go-to-admin-flow.png`**
- Three-screen navigation flow: Start → Чекап submenu → Back to start
- Submenu shows title message "Выберите действие" above buttons
- Back button ("Назад") positioned at bottom of submenu inline keyboard
- Admin panel button opens WebApp at /admin URL
- Navigation arrows show hierarchical flow: main → submenu → back

## Existing Code to Leverage

**TelegramService.getMainKeyboard() method (lines 99-120)**
- Reuse inline keyboard structure pattern with `InlineKeyboardMarkup` interface
- Modify to return new 6-button main menu with database-loaded texts
- Keep admin button conditional logic using `isAdmin()` check
- Replace hardcoded button texts with ContentService calls

**TelegramService.getSurveyTypeKeyboard() method (lines 122-152)**
- Use as template for creating new `getCheckupSubmenu()` method
- Reuse back button pattern (`⬅️ Назад`, callback_data: `back_to_main`)
- Load button texts from database instead of hardcoded strings
- Maintain same inline keyboard structure for consistency

**TelegramService.handleCallbackQuery() method (lines 232-301)**
- Add new callback handlers: `main_checkup`, `main_booking`, `main_about`, `main_faq`, `main_referral`
- Keep existing handlers: `start_checkup`, `my_results`, `referral`, `back_to_main`, `admin_panel`
- Update `about` and `help` handlers to show WIP message from database
- Maintain callback routing pattern with if-else chain

**Admin.entity.ts (admins table)**
- Use existing `admins` table with `telegram_username` unique field for admin authorization
- Leverage `AdminService.isAdmin(username)` method for conditional button rendering
- No changes needed to admin entity structure

**TelegramService.handleStartCommand() method (lines 303-334)**
- Modify welcome message to load from `bot_content` table using ContentService
- Replace hardcoded welcome text with database content interpolated with `{firstName}` placeholder
- Call modified `getMainKeyboard()` to display new menu structure
- Preserve user creation logic (`ensureUserExists()`)

## Technical Approach

**Framework Pattern: TypeORM Entity and Service Pattern**
- Create `BotContent` entity similar to existing `Admin` entity pattern
- Use TypeORM decorators: `@Entity`, `@Column`, `@PrimaryGeneratedColumn`, `@CreateDateColumn`, `@UpdateDateColumn`
- Create ContentService as NestJS provider with `@Injectable()` decorator
- Inject ContentService into TelegramService using NestJS dependency injection
- Reference: Existing entity patterns in `backend/src/entities/`

**Framework Pattern: NestJS Lifecycle Hooks for Bot Commands**
- Implement `onModuleInit()` lifecycle hook in TelegramService to set bot commands on startup
- Use Telegram Bot API `setMyCommands` method with command descriptions from database
- Load command descriptions via ContentService during initialization
- Reference: NestJS lifecycle hooks documentation for initialization patterns

**Framework Pattern: Content Caching with NestJS**
- Implement singleton pattern for content cache in ContentService
- Use Map data structure for in-memory cache: `Map<string, string>`
- Load all content on service initialization and cache in memory
- Provide fallback to hardcoded `CONTENT_FALLBACKS` constants if database fails
- Reference: NestJS singleton services are cached by default

## Out of Scope

**Implementation of "Запись на старт сессию" feature** - only WIP message shown, booking system is Phase 2
**Implementation of "О проекте" content** - only WIP message shown, actual content to be defined later
**Implementation of "FAQ" content** - only WIP message shown, FAQ content to be defined later
**Admin panel UI for editing bot_content table** - Phase 2 admin CMS, for now content seeded via migration
**Multilingual support** - language field exists in bot_content table for future, but only Russian ('ru') used now
**Changes to existing survey flow** - express/full survey selection and WebApp integration remain unchanged
**Changes to existing report generation** - PDF report generation and payment flows remain unchanged
**Changes to existing admin analytics** - calendar widget, analytics reports, and admin features remain unchanged
**Multi-level navigation beyond main → submenu** - only two-level hierarchy (main + Чекап submenu) in this spec
**Telegram menu button customization beyond commands** - use standard BotCommandScopeDefault, no custom menu button UI
