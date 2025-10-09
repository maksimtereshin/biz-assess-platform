# Task Breakdown: Telegram Bot Admin Panel

## Overview
Total Tasks: 29 (grouped into 6 major task groups)
Estimated Total Effort: 10-12 days
Priority: High - Core feature for platform monitoring and analytics

## Assigned Roles
- **backend-engineer**: Backend infrastructure, services, and database queries
- **integration-engineer**: Telegram bot integration and webhook handling
- **data-engineer**: Analytics service and data aggregation
- **ui-engineer**: Calendar widget and bot interface design
- **testing-engineer**: End-to-end testing and validation

## Task List

### Admin Infrastructure & Access Control

#### Task Group 1: Admin Authorization System
**Assigned implementer:** backend-engineer
**Dependencies:** None
**Estimated effort:** 1 day

- [x] 1.0 Complete admin access control system
  - [x] 1.1 Write tests for admin authorization
    - Admin username verification tests
    - Admin button visibility tests
    - Non-admin access restriction tests
    - Edge cases (null username, case sensitivity)
  - [x] 1.2 Add admin username configuration
    - Create `ADMIN_USERNAMES` constant in `backend/src/telegram/telegram.constants.ts`
    - Add usernames array: `['admin_username1', 'admin_username2']`
    - Document admin list management process
  - [x] 1.3 Implement `isAdmin()` method in TelegramService
    - Check user.username against admin list
    - Handle case-insensitive matching
    - Add logging for admin access attempts
  - [x] 1.4 Update main keyboard generation
    - Modify `getMainKeyboard()` in TelegramService
    - Add conditional "Админ" button for admins only
    - Maintain existing button layout for non-admins
  - [x] 1.5 Ensure all admin access tests pass
    - Run authorization tests from 1.1
    - Verify admin button appears only for admins
    - Confirm non-admins cannot access admin features

**Acceptance Criteria:**
- Admin button visible only to users in admin list
- Non-admin users see standard menu only
- Admin check is case-insensitive
- All tests pass with 100% coverage

**Files to modify:**
- `backend/src/telegram/telegram.service.ts`
- `backend/src/telegram/telegram.constants.ts` (create new)
- `backend/src/telegram/telegram.service.spec.ts`

### Analytics Data Layer

#### Task Group 2: Analytics Service Implementation
**Assigned implementer:** data-engineer
**Dependencies:** Task Group 1

- [x] 2.0 Complete analytics data aggregation service
  - [x] 2.1 Write tests for AnalyticsService
    - User statistics calculation tests
    - Survey metrics aggregation tests
    - Financial metrics calculation tests
    - Date range filtering tests
    - Edge cases (empty data, invalid dates)
  - [x] 2.2 Create AnalyticsService module
    - Create `backend/src/analytics/` directory
    - Implement `analytics.module.ts`
    - Set up dependency injection
  - [x] 2.3 Implement user statistics methods
    - `getTotalUsers()`: All-time user count
    - `getNewUsers(startDate, endDate)`: Period-specific users
    - `getUserGrowthRate(startDate, endDate)`: Growth over time
    - Use TypeORM repository for User entity
  - [x] 2.4 Implement survey metrics methods
    - `getSurveyStats(type, startDate, endDate)`: Started/completed counts
    - `getConversionRate(type, period)`: Completion percentage
    - `getAverageCompletionTime(type)`: Time metrics
    - `getAverageScores(type, period)`: Score calculations
  - [x] 2.5 Implement financial metrics methods
    - `getPaidRetakes(period)`: Count of paid sessions
    - `getTotalRevenue()`: All-time revenue
    - `getPeriodRevenue(startDate, endDate)`: Period revenue
    - `getAverageRevenuePerUser()`: ARPU calculation
    - `getPaymentConversionRate()`: Payment conversion
  - [x] 2.6 Implement engagement rankings
    - `getMostActiveUsers(limit)`: Top users by completions
    - `getTopScoringUsers(limit)`: Highest scores
    - `getUsersWithMostCompletions(limit)`: Completion leaders
    - Include user details and metrics
  - [x] 2.7 Add caching layer for expensive queries
    - Implement in-memory caching for all-time stats
    - Set TTL of 1 hour for cached results
    - Add cache invalidation logic
  - [x] 2.8 Ensure all analytics tests pass
    - Run all tests from 2.1
    - Verify data accuracy against raw database
    - Confirm performance within acceptable limits

**Acceptance Criteria:**
- All metrics calculate correctly
- Date filtering works accurately
- Queries perform within 5 seconds
- Caching reduces repeat query time by 90%
- All tests pass with full coverage

**Files to create/modify:**
- `backend/src/analytics/analytics.module.ts` (new)
- `backend/src/analytics/analytics.service.ts` (new)
- `backend/src/analytics/analytics.service.spec.ts` (new)
- `backend/src/analytics/dto/analytics.dto.ts` (new)
- `backend/src/app.module.ts` (register new module)

### Telegram Bot Interface

#### Task Group 3: Calendar Widget & Date Selection
**Assigned implementer:** ui-engineer
**Dependencies:** None
**Status:** ✅ COMPLETED

- [x] 3.0 Complete calendar date selection interface
  - [x] 3.1 Write tests for calendar widget
    - Calendar generation tests
    - Navigation callback tests
    - Date selection validation tests
    - Date range validation tests
  - [x] 3.2 Create calendar keyboard generator
    - Create `backend/src/telegram/calendar/calendar.service.ts`
    - Implement month view with day buttons
    - Add month/year navigation arrows
    - Support date range selection (start + end)
  - [x] 3.3 Implement calendar navigation callbacks
    - `calendar_prev_month`: Previous month navigation
    - `calendar_next_month`: Next month navigation
    - `calendar_select_day`: Day selection
    - `calendar_confirm`: Confirm date range
  - [x] 3.4 Add date selection state management
    - Store selection state in callback data
    - Track start date and end date selections
    - Validate date ranges (end > start)
    - Maximum range limit (1 year)
  - [x] 3.5 Create calendar UI formatting
    - Month/year header
    - Day of week labels
    - Highlight selected dates
    - Disable future dates
    - Show selection feedback
  - [x] 3.6 Ensure all calendar tests pass
    - Run widget tests from 3.1
    - Test date range selection flow
    - Verify navigation works correctly

**Acceptance Criteria:** ✅ ALL MET
- ✅ Calendar displays correctly in Telegram (inline keyboard format)
- ✅ Users can select valid date ranges (two-step selection)
- ✅ Navigation between months works (prev/next month buttons)
- ✅ Invalid date ranges are prevented (validation with error messages)
- ✅ Visual feedback for selections (checkmarks and dots for range)

**Files Created/Modified:**
- ✅ `backend/src/telegram/calendar/calendar.service.ts` (new - 380 lines)
- ✅ `backend/src/telegram/calendar/calendar.service.spec.ts` (new - 28 tests, all passing)
- ✅ `backend/src/telegram/telegram.service.ts` (integrated calendar handlers)
- ✅ `backend/src/telegram/telegram.module.ts` (registered CalendarService)

### Excel Export Implementation

#### Task Group 4: Excel Generation & Export
**Assigned implementer:** backend-engineer
**Dependencies:** Task Group 2

- [x] 4.0 Complete Excel export functionality
  - [x] 4.1 Write tests for Excel export
    - Excel file generation tests
    - Multi-sheet creation tests
    - Data formatting tests
    - Large dataset handling tests
    - File size validation tests
  - [x] 4.2 Install and configure ExcelJS
    - Add `exceljs` package to backend dependencies
    - Configure TypeScript types
    - Set up file generation utilities
  - [x] 4.3 Create ExcelExportService
    - Create `backend/src/excel/excel.service.ts`
    - Implement workbook creation
    - Add worksheet generation methods
    - Handle data formatting and styling
  - [x] 4.4 Design spreadsheet structure
    - Sheet 1: Информация об отчёте (Report Info)
    - Sheet 2: Статистика пользователей (User Statistics)
    - Sheet 3: Метрики опросов (Survey Metrics)
    - Sheet 4: Финансовая сводка (Financial Overview)
    - Sheet 5: Топ пользователей (Top Users - paginated)
  - [x] 4.5 Implement data formatting
    - Headers with bold styling and blue background
    - Number formatting for currency
    - Date formatting for timestamps (Russian locale)
    - Percentage formatting for rates
    - Color coding for metrics
  - [x] 4.6 Add file optimization
    - Paginate results over 10,000 rows
    - Ensure file size under 50MB
    - Stream generation for memory efficiency
  - [x] 4.7 Ensure all export tests pass
    - Run generation tests from 4.1
    - Verify Excel files open correctly
    - Test with large datasets (15,000 users)
    - Confirm formatting is preserved

**Acceptance Criteria:**
- Excel files generate without errors
- All metrics display correctly
- Files open in Excel and Google Sheets
- File size stays under 50MB limit
- Generation completes within 30 seconds

**Files to create/modify:**
- `backend/src/excel/excel.module.ts` (new)
- `backend/src/excel/excel.service.ts` (new)
- `backend/src/excel/excel.service.spec.ts` (new)
- `backend/package.json` (add exceljs dependency)

### Bot Integration & Admin Panel

#### Task Group 5: Telegram Bot Admin Panel Integration
**Assigned implementer:** integration-engineer
**Dependencies:** Task Groups 1, 2, 3, 4 (ALL COMPLETED ✓)
**Estimated effort:** 2 days
**Status:** ✅ COMPLETED

- [x] 5.0 Complete admin panel bot integration
  - [x] 5.1 Write integration tests
    - ✅ Admin panel access tests
    - ✅ Report generation flow tests
    - ✅ File download tests
    - ✅ Error handling tests
    - ✅ Timeout handling tests
    - ✅ Rate limiting tests
  - [x] 5.2 Implement admin panel callbacks
    - ✅ `admin_panel`: Show admin menu (already completed in Task Group 1)
    - ✅ `analytics_all_time`: Generate all-time report
    - ✅ `analytics_custom`: Show calendar for date range (already integrated with calendar)
    - ✅ Added to webhook handler in TelegramService
  - [x] 5.3 Create admin menu interface
    - ✅ Inline keyboard layout already created (Task Group 1)
    - ✅ "Аналитика за весь период" button
    - ✅ "Аналитика за период" button
    - ✅ "Назад" button to main menu
    - ✅ Emoji icons for clarity
  - [x] 5.4 Implement report generation flow
    - ✅ Show "Генерация отчета..." message
    - ✅ Call AnalyticsService methods (all metrics aggregated)
    - ✅ Generate Excel file via ExcelService
    - ✅ Send file as document via `sendDocument` method
    - ✅ Delete temp file after sending
  - [x] 5.5 Add error handling
    - ✅ Timeout after 30 seconds implemented
    - ✅ User-friendly error messages in Russian
    - ✅ Graceful error handling with try-catch
    - ✅ Log all admin actions via Logger
  - [x] 5.6 Implement rate limiting
    - ✅ Max 1 report per minute per admin (60-second cooldown)
    - ✅ Show cooldown message with remaining seconds
    - ✅ Track requests in memory via Map
  - [x] 5.7 Update user results viewing
    - ✅ Modified `/reports` command handler
    - ✅ Format as indexed list: `1. express-2025-10-08`
    - ✅ Add PDF download callbacks for each result
    - ✅ Query user's survey sessions with filter for COMPLETED status
  - [x] 5.8 Ensure integration tests pass
    - ✅ Comprehensive test suite added (9 new tests)
    - ✅ Test complete admin flow
    - ✅ Verify file downloads work
    - ✅ Confirm rate limiting works

**Acceptance Criteria:** ✅ ALL MET
- ✅ Admin panel accessible only to admins (auth check in place)
- ✅ Reports generate and download correctly (full flow implemented)
- ✅ Calendar date selection works (already completed in Task Group 3)
- ✅ Error handling provides clear feedback (Russian error messages)
- ✅ Rate limiting prevents abuse (60-second cooldown)

**Files Modified:**
- ✅ `backend/src/telegram/telegram.service.ts` (580+ lines added)
  - Added AnalyticsService and ExcelService injection
  - Implemented `generateAndSendAnalyticsReport` method
  - Implemented `generateReport` method with full analytics aggregation
  - Added `sendDocument` method for file uploads
  - Updated `analytics_all_time` callback handler
  - Updated calendar confirm callback
  - Updated `handleReportsCommand` with indexed list format
  - Added rate limiting with cooldown tracking
  - Added timeout handling (30 seconds)
  - Added comprehensive error handling
- ✅ `backend/src/telegram/telegram.module.ts` (added AnalyticsModule and ExcelModule imports)
- ✅ `backend/src/telegram/telegram.service.spec.ts` (9 new integration tests added)
  - Report generation flow tests
  - Rate limiting tests
  - Timeout handling tests
  - Error handling tests
  - User results viewing tests
  - File download tests

### Survey Flow Updates

#### Task Group 6: Free/Paid Survey Logic Updates
**Assigned implementer:** backend-engineer
**Dependencies:** None
**Status:** ✅ COMPLETED

- [x] 6.0 Complete survey payment flow updates
  - [x] 6.1 Write tests for payment logic
    - First free survey tests
    - Paid survey enforcement tests
    - Cross-type free limit tests
    - Payment verification tests
  - [x] 6.2 Update survey start logic
    - Modify `SurveyService.startSurvey()`
    - Check user's total completed surveys
    - Determine if payment required
    - Set session payment status
  - [x] 6.3 Implement free survey tracking
    - Add `hasUsedFreeSurvey()` method to SurveyService
    - Count completed surveys across all types
    - Return boolean for payment requirement
  - [x] 6.4 Update payment enforcement
    - Modify survey start flow with `startSurveyWithPaymentCheck()`
    - Require payment if not first survey
    - Update payment verification logic
    - Handle payment success/failure
  - [x] 6.5 Ensure payment logic tests pass
    - Run all tests from 6.1
    - Verify first survey is free
    - Confirm subsequent surveys require payment
    - Test across both survey types

**Acceptance Criteria:** ✅ ALL MET
- ✅ First survey (any type) is free
- ✅ All subsequent surveys require payment
- ✅ Payment flow integrates smoothly
- ✅ Existing users maintain their history

**Files Modified:**
- ✅ `backend/src/survey/survey.service.ts`
- ✅ `backend/src/survey/survey.service.spec.ts`
- ✅ `backend/src/entities/survey-session.entity.ts`
- ✅ `backend/migrations/1728464000000-AddRequiresPaymentToSurveySession.sql`

## Testing & Validation

### Task Group 7: End-to-End Testing & Deployment Preparation
**Assigned implementer:** testing-engineer
**Dependencies:** Task Groups 1-6

- [ ] 7.0 Complete end-to-end testing and validation
  - [ ] 7.1 Write E2E test scenarios
    - Complete admin report generation flow
    - User survey flow with payment
    - Results viewing and PDF download
    - Error scenarios and edge cases
  - [ ] 7.2 Test admin access control
    - Verify admin-only features restricted
    - Test with multiple admin usernames
    - Confirm non-admins blocked
  - [ ] 7.3 Test analytics accuracy
    - Cross-reference with database
    - Verify all metrics calculate correctly
    - Test various date ranges
    - Validate empty dataset handling
  - [ ] 7.4 Test Excel file generation
    - Generate reports with large datasets
    - Verify file size limits respected
    - Test opening in Excel/Google Sheets
    - Confirm all sheets populate correctly
  - [ ] 7.5 Test Telegram bot integration
    - Complete admin workflow in bot
    - Test calendar date selection
    - Verify file downloads work
    - Test rate limiting
  - [ ] 7.6 Test survey payment flow
    - Verify first survey is free
    - Test payment requirement enforcement
    - Confirm results list displays correctly
  - [ ] 7.7 Performance testing
    - Load test analytics queries
    - Test with 10,000+ users
    - Verify 30-second timeout works
    - Check memory usage during Excel generation
  - [ ] 7.8 Create deployment checklist
    - Update environment variables
    - Document admin username configuration
    - Verify database indexes
    - Test in staging environment

**Acceptance Criteria:**
- All E2E tests pass
- No critical bugs found
- Performance meets requirements
- Ready for production deployment

**Files to create/modify:**
- `backend/test/e2e/admin-panel.e2e-spec.ts` (new)
- `backend/test/e2e/survey-flow.e2e-spec.ts` (new)
- `DEPLOYMENT.md` (deployment checklist)

## Execution Order

### Phase 1: Foundation (Days 1-2)
**Parallel Execution Possible**
1. Task Group 1: Admin Authorization System
2. Task Group 3: Calendar Widget
3. Task Group 6: Survey Payment Logic

### Phase 2: Core Services (Days 3-5)
**Sequential - Depends on Phase 1**
4. Task Group 2: Analytics Service (requires admin auth)
5. Task Group 4: Excel Export (requires analytics)

### Phase 3: Integration (Days 6-8)
**Sequential - Depends on Phase 2**
6. Task Group 5: Bot Integration (requires all components)

### Phase 4: Testing & Polish (Days 9-10)
**Sequential - Depends on Phase 3**
7. Task Group 7: E2E Testing & Validation

## Risk Mitigation

### High-Risk Areas
1. **Excel file size limits** - Implement pagination early
2. **Query performance** - Add database indexes proactively
3. **Calendar complexity** - Consider using existing library if issues arise
4. **Rate limiting** - Test thoroughly to prevent admin lockout

### Contingency Plans
- If calendar too complex: Use preset date ranges initially
- If Excel too large: Implement CSV fallback
- If queries slow: Add more aggressive caching
- If integration issues: Implement in phases

## Dependencies & Resources

### NPM Packages Required
```json
{
  "exceljs": "^4.3.0",
  "node-cache": "^5.1.2"
}
```

### Database Indexes Needed
- `users.created_at`
- `survey_sessions.created_at`
- `survey_sessions.user_id`
- `survey_sessions.status`
- `payments.created_at`
- `payments.status`

### Environment Variables
```env
# Add to .env file
ADMIN_USERNAMES=admin1,admin2,admin3
ANALYTICS_CACHE_TTL=3600
MAX_EXCEL_ROWS=50000
REPORT_GENERATION_TIMEOUT=30000
```

## Success Metrics

### Technical Metrics
- [ ] All tests pass with >90% coverage
- [ ] Report generation < 30 seconds
- [ ] Excel files < 50MB
- [ ] Zero critical bugs in production

### Business Metrics
- [ ] Admins can access analytics within 3 clicks
- [ ] All specified metrics available
- [ ] Reports usable in Excel/Sheets
- [ ] No disruption to existing user flow

## Notes for Implementers

1. **Test-Driven Development**: Each task group starts with writing tests (x.1) and ends with ensuring they pass
2. **Backwards Compatibility**: Ensure existing survey flow continues working
3. **Security Focus**: Admin access must be properly restricted
4. **Performance First**: Consider query optimization from the start
5. **User Experience**: Keep bot interactions simple and intuitive
6. **Error Handling**: Provide clear, actionable error messages
7. **Documentation**: Update API docs and admin guide as you go

## Post-Implementation Tasks

After all task groups are complete:
1. Update README with admin panel documentation
2. Create admin user guide for Telegram bot
3. Add monitoring for admin actions
4. Plan future analytics expansions
5. Review and optimize database queries
6. Consider adding admin audit log