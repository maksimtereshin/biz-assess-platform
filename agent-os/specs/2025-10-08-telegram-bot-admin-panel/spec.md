# Specification: Telegram Bot Admin Panel

## Goal
Enable designated administrators to access analytics and export comprehensive platform statistics directly through the Telegram bot interface for monitoring user activity, survey completions, and revenue metrics.

## User Stories
- As an admin, I want to access an admin-only button in the Telegram bot so that I can generate analytics reports
- As an admin, I want to choose between all-time or custom date range analytics so that I can analyze specific periods
- As an admin, I want to download reports as spreadsheet files so that I can perform further analysis offline
- As a user, I want to view my completed survey results list so that I can download any of my past PDF reports
- As a user, I want one free survey attempt total so that I can try the service before paying

## Core Requirements

### Functional Requirements

#### Admin Access Control
- Admin button visible only to authorized users in Telegram bot main menu
- Authorization based on hardcoded list of Telegram usernames in code
- Single admin role with full analytics access
- Check performed at bot command/callback level

#### Analytics Interface
- Admin menu with two report generation options:
  - All-time analytics (from platform inception)
  - Custom date range (with calendar date picker)
- Calendar interface for selecting start and end dates
- Direct spreadsheet file download in Telegram chat
- On-demand report generation only (no scheduling)

#### Report Metrics
- **User Statistics:**
  - Total registered users count (all-time)
  - New users registered in selected period
  - User growth rate over time

- **Survey Metrics:**
  - Total surveys started by type (Express/Full)
  - Total surveys completed by type
  - Conversion rate (completion percentage)
  - Average completion time per survey type
  - Average scores per survey type

- **Financial Metrics:**
  - Number of paid retake sessions
  - Total revenue (all-time)
  - Revenue for selected period
  - Average revenue per user
  - Payment conversion rate

- **User Engagement:**
  - List of most active users (top 10-20)
  - Users with highest survey scores
  - Users with most completions

#### User Survey Flow Updates
- First survey attempt is free (across all types combined)
- All subsequent attempts require payment
- Results viewing shows list: `{index}. {type}-{completion_date}`
- Each result item links to PDF download

### Non-Functional Requirements
- Excel/CSV format compatible with Google Sheets and Microsoft Excel
- Maximum file size 50MB (Telegram bot limit)
- Report generation timeout: 30 seconds
- Support for future metric additions without major refactoring
- Maintain backward compatibility with existing survey flow

## Visual Design

### Mockup References
- Bot main menu: `planning/visuals/Screenshot 2025-10-08 at 22.53.22.png`
- Survey selection: `planning/visuals/Screenshot 2025-10-08 at 23.01.40.png`
- Results view flow: `planning/visuals/Screenshot 2025-10-08 at 23.02.15.png`

### Key UI Elements
- Admin button added to main bot menu (only for admins)
- Admin analytics menu with clear options
- Calendar widget for date selection
- Progress indicator during report generation
- Results list with indexed format for clarity

## Reusable Components

### Existing Code to Leverage

#### Telegram Bot Infrastructure
- **TelegramService** (`backend/src/telegram/telegram.service.ts`):
  - Webhook handling
  - Keyboard generation methods
  - Message sending utilities
  - Callback query processing
- **Inline keyboard patterns**: Extend `getMainKeyboard()` for admin button
- **Authentication flow**: Use existing `generateAuthToken()` method

#### Database & Entities
- **User entity** (`backend/src/entities/user.entity.ts`): User data and relations
- **SurveySession entity**: Session tracking and status
- **Payment entity**: Transaction records
- **Answer entity**: Survey responses
- **Existing TypeORM repositories**: Query patterns for data retrieval

#### Services
- **SurveyService** (`backend/src/survey/survey.service.ts`):
  - Session management
  - Survey completion tracking
  - Analytics calculator utility
- **PaymentService** (`backend/src/payment/payment.service.ts`):
  - Payment verification
  - Transaction recording
- **ReportService** (`backend/src/report/report.service.ts`):
  - PDF generation logic (adapt for reference)

#### Authentication & Security
- **AuthService**: JWT token generation and validation
- **WebhookVerificationGuard**: Telegram webhook security

### New Components Required

#### Analytics Module
- **AnalyticsService**: New service for aggregating statistics
  - Why new: No existing analytics aggregation service
  - Queries multiple entities for comprehensive reports
  - Date range filtering logic
  - Metric calculation methods

#### Excel Export
- **ExcelExportService**: Spreadsheet generation service
  - Why new: No existing Excel/CSV export functionality
  - Uses ExcelJS library for file creation
  - Formats data into structured worksheets
  - Handles large datasets with pagination

#### Admin Authorization
- **Admin username list**: Hardcoded configuration
  - Why new: Currently no admin role system
  - Simple array constant in TelegramService
  - Check against user.username field

#### Calendar Integration
- **Telegram calendar keyboard**: Date selection interface
  - Why new: No existing date picker in bot
  - Inline keyboard with month/day navigation
  - Stores selection state in callback data

## Technical Approach

### Database Schema

No new tables required. Will leverage existing:
- `users`: User information and registration dates
- `survey_sessions`: Survey attempts and completion tracking
- `payments`: Financial transactions
- `answers`: Survey responses for score calculations

New queries needed:
```sql
-- User growth over time
SELECT DATE(created_at), COUNT(*) FROM users
WHERE created_at BETWEEN ? AND ?
GROUP BY DATE(created_at);

-- Survey completion rates
SELECT survey_type,
  COUNT(*) as started,
  SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed
FROM survey_sessions
WHERE created_at BETWEEN ? AND ?
GROUP BY survey_type;

-- Revenue analytics
SELECT DATE(created_at), SUM(amount)
FROM payments
WHERE status = 'completed' AND created_at BETWEEN ? AND ?
GROUP BY DATE(created_at);
```

### API Endpoints

No new REST endpoints needed. All functionality through Telegram webhook:

**Telegram Bot Commands:**
- Extend `/api/telegram/webhook` handler with:
  - `admin_panel` callback: Show admin menu
  - `analytics_all_time` callback: Generate all-time report
  - `analytics_custom` callback: Show calendar
  - `calendar_*` callbacks: Handle date selection
  - `generate_report` callback: Create and send Excel file

**Modified Commands:**
- `/reports` command: Show indexed results list
- Results callbacks: Handle PDF download links

### Frontend Changes

No frontend changes required. All interaction through Telegram bot interface.

### Implementation Phases

#### Phase 1: Admin Infrastructure (2 days)
1. Add admin username configuration
2. Implement admin authorization check
3. Add admin button to main menu (conditional)
4. Create admin analytics menu

#### Phase 2: Calendar Widget (2 days)
1. Implement calendar inline keyboard generator
2. Handle month/year navigation callbacks
3. Store and retrieve date selections
4. Validate date ranges

#### Phase 3: Analytics Service (3 days)
1. Create AnalyticsService with metric methods
2. Implement user statistics queries
3. Add survey metrics calculations
4. Build financial analytics queries
5. Generate engagement rankings

#### Phase 4: Excel Export (2 days)
1. Install and configure ExcelJS library
2. Create ExcelExportService
3. Design spreadsheet structure with multiple sheets
4. Format data with headers and styles
5. Handle large dataset pagination

#### Phase 5: Integration & Testing (2 days)
1. Connect all components in webhook handler
2. Add error handling and timeouts
3. Test with various date ranges
4. Verify admin access control
5. Test file downloads in Telegram

#### Phase 6: User Flow Updates (1 day)
1. Modify survey free/paid logic
2. Update results listing format
3. Add indexed result display
4. Test payment flow for retakes

## Out of Scope
- Web-based admin dashboard
- Dynamic admin management interface
- User management actions (reset, block, unblock)
- Message broadcasting to users
- Automated or scheduled reports
- Real-time monitoring and alerts
- Multiple admin roles or permissions
- Complex analytics beyond specified metrics
- Geographic distribution tracking
- User retention cohort analysis
- A/B testing analytics
- Email or cloud storage integration

## Success Criteria
- Admins can access analytics through Telegram bot within 3 seconds
- Reports generate successfully for any date range within 30 seconds
- Excel files open correctly in Google Sheets and Microsoft Excel
- All specified metrics are accurate when cross-referenced with database
- File size remains under 50MB even with large datasets
- Admin access is properly restricted to authorized usernames only
- Users see indexed list of their survey results with working PDF downloads
- Free/paid survey logic correctly enforces single free attempt rule

## Technical Dependencies
- **New NPM packages for backend:**
  - `exceljs`: ^4.3.0 (Excel file generation)
  - `telegram-calendar-keyboard`: ^2.0.0 (or implement custom)

## Security Considerations
- Admin usernames stored as environment variable or config constant
- No sensitive user data exposed in analytics
- Rate limiting on report generation (1 per minute per admin)
- File cleanup after sending to prevent disk space issues
- Validation of date ranges to prevent excessive queries

## Performance Optimizations
- Cache frequently requested all-time statistics (TTL: 1 hour)
- Use database indexes on created_at columns
- Paginate large result sets in Excel sheets
- Stream Excel file generation for memory efficiency
- Implement query result pagination for large date ranges

## Migration Notes
- No database migrations required
- Backward compatible with existing survey flow
- Existing users maintain their survey history
- Payment records remain unchanged