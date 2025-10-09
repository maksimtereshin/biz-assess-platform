# Spec Requirements: Telegram Bot Admin Panel

## Initial Description
Create an admin panel accessible through the Telegram bot that allows designated administrators to generate and download analytics reports in spreadsheet format. The panel should provide comprehensive statistics about user activity, survey completions, and revenue.

## Requirements Discussion

### First Round Questions

**Q1:** I assume the admin panel should be accessible directly through the Telegram bot interface (not a separate web panel), with an "Admin" button in the bot menu that's only visible to authorized users. Is that correct, or would you prefer a separate web-based admin dashboard?
**Answer:** Нужна кнопка "Админ" в боте, доступная только для определенных пользователей по их никнейму. 2 опции: аналитика за весь период или за выбранный период - при нажатии скачивание аналитики в формате Sheet.

**Q2:** I'm thinking administrators should be identified by their Telegram user IDs stored in a database admin_users table. Should we also include functionality to add/remove admins through the bot, or will you manage this directly in the database?
**Answer:** Кнопка для админов должна быть доступна только определенным пользователям, которых определит пользователь сам. Список админских никнеймов должен быть зашит статично напрямую в код.

**Q3:** For analytics, I assume we should track: total users, survey completions by type (Express/Full), conversion rates, revenue from paid re-takes, and completion times. Is this the right scope, or should we include additional metrics like user retention or geographic distribution?
**Answer:** Нужно как можно больше статистики. В Sheet отчёт включить:
- Общее количество пользователей (всего / новых за период)
- Количество начатых/завершённых опросов по типам (Express/Full)
- Конверсия (% завершённых опросов)
- Количество платных повторных прохождений
- Доход (общий / за период)
- Самые активные пользователей
- Средний балл по опросам
Планируется расширять в будущем.

**Q4:** I'm assuming the panel should include basic user management actions like viewing user details, resetting their free survey allowance, or blocking/unblocking users. Is this needed, or should we focus purely on analytics?
**Answer:** Возврат, сброс пользователей и т.п. на данном этапе не нужны.

**Q5:** For the export format, I assume Google Sheets compatible CSV or Excel files would work. Should we include the ability to send reports to email or cloud storage, or just download directly in the Telegram chat?
**Answer:** (Implied from Q1 answer: скачивание аналитики в формате Sheet - download directly in chat)

**Q6:** I think we should include the ability to broadcast messages to all users or specific user segments through the admin panel. Is this a feature you'd want, or should we keep it analytics-only?
**Answer:** Нет, не нужно.

**Q7:** Should the system support basic monitoring and alerts (like notifying admins when revenue exceeds certain thresholds or when there are unusual activity patterns)?
**Answer:** Нет, не нужно.

**Q8:** I assume we should have different admin roles (super admin, analytics viewer) with different permissions. Or would a single admin role be sufficient?
**Answer:** Сделать просто одну роль - мастер админ.

**Q9:** For report scheduling, should admins be able to set up automated daily/weekly/monthly reports, or just generate them on-demand?
**Answer:** Нет, просто генерация отчета по запросу из бота админом.

**Q10:** Is there anything specific you want to exclude from this admin panel that we haven't discussed?
**Answer:** Нужно исключить всю сложную аналитику и лишний функционал.

### Existing Code to Reference

**Similar Features Identified:**
- Telegram bot implementation: `backend/src/telegram/`
- WebApp integration: `frontend/`
- Payment system: `backend/src/payment/`
- PDF report generation: `backend/src/report/`
- Survey session management: `backend/src/survey/`

### Follow-up Questions

**Follow-up 1:** For admin identification by username, should this be Telegram @username (e.g., @john_doe) or display name? And should we have a configuration file or hardcode the list directly in the bot code?
**Answer:** Список админских никнеймов зашить статично в код, не будем менять

**Follow-up 2:** For the period selection when generating reports, how should admins specify the date range? Through inline keyboard buttons with preset periods (last 7 days, last month) or a more flexible date picker?
**Answer:** Календарь с выбором периода (дата начала и окончания)

**Follow-up 3:** For the statistics you mentioned, are these the complete requirements or should we plan the architecture to easily add more metrics later?
**Answer:** Указанной статистики хватит на данный момент, планируется расширение в будущем

**Follow-up 4:** You mentioned users get one free survey. Is this one free survey per type (one free Express, one free Full) or one free survey total across all types?
**Answer:** Одно бесплатное прохождение на все опросы (не на каждый тип), все последующие - платные

**Follow-up 5:** When users select "view results" in the bot, what exactly should they see? A list of their completed surveys with download links, or just the most recent result?
**Answer:** При нажатии на "просмотреть результаты" должен появиться список в формате: `index. full-{survey_completion_date}` (ссылка на скачивание PDF)

## Visual Assets

### Files Provided:
No visual assets provided.

## Requirements Summary

### Functional Requirements

#### Admin Access & Authentication
- Admin button in Telegram bot visible only to authorized users
- Authorization based on hardcoded list of Telegram usernames
- Single admin role (master admin) with full access
- No dynamic admin management - list is static in code

#### Analytics Reports
- Two report options: all-time or custom date range
- Custom date range selection via calendar (start and end dates)
- Reports downloadable as spreadsheet files (Excel/Sheets format)
- On-demand generation only (no scheduled reports)

#### Report Metrics
- **User Statistics:**
  - Total users count (all-time)
  - New users for selected period

- **Survey Statistics:**
  - Number of started surveys by type (Express/Full)
  - Number of completed surveys by type
  - Conversion rate (percentage of completed surveys)

- **Financial Statistics:**
  - Number of paid re-takes
  - Total revenue (all-time)
  - Revenue for selected period

- **User Engagement:**
  - Most active users list
  - Average survey scores

#### User Survey Flow
- Any Telegram user can access the bot and select a survey
- Survey opens in WebApp interface
- One free survey attempt across all survey types
- All subsequent attempts are paid (payment required)
- After completion: shows results summary with "close window" button
- User returns to bot and can select "view results" option
- Results list format: `index. {survey-type}-{completion_date}` with PDF download links

### Non-Functional Requirements
- Reports must be extensible for future metrics
- Spreadsheet format must be compatible with Google Sheets/Excel
- Admin usernames hardcoded for security and simplicity
- No complex analytics or unnecessary features
- Direct download in Telegram chat (no email/cloud storage integration)

### Reusability Opportunities
- Existing Telegram bot infrastructure (`backend/src/telegram/`)
- Current WebApp integration patterns (`frontend/`)
- Payment system for paid surveys (`backend/src/payment/`)
- PDF report generation logic (`backend/src/report/`)
- Survey session management (`backend/src/survey/`)
- Database queries for user and survey data

### Scope Boundaries

**In Scope:**
- Admin-only button in Telegram bot
- Static admin username list in code
- Analytics report generation (all-time and custom period)
- Calendar-based date range selection
- Spreadsheet export with specified metrics
- Single master admin role
- Direct file download in Telegram chat
- View results list with PDF download links

**Out of Scope:**
- Web-based admin dashboard
- Dynamic admin management
- User management actions (reset, block, etc.)
- Message broadcasting
- Monitoring and alerts
- Multiple admin roles/permissions
- Automated/scheduled reports
- Email or cloud storage integration
- Complex analytics beyond specified metrics
- Geographic distribution tracking
- User retention metrics
- Real-time analytics dashboard

### Technical Considerations
- Leverage existing Telegram bot webhook handler
- Use inline keyboards for admin menu navigation
- Implement calendar widget for date selection
- Generate Excel files using existing libraries (e.g., ExcelJS)
- Query existing database tables for statistics
- Ensure admin check happens at bot command level
- File size limitations for Telegram bot file sending (50MB max)
- Consider pagination for large user lists in reports
- Maintain backwards compatibility with existing survey flow
- Use existing PDF generation for user results