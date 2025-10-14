# Specification: Results Feature

## Goal
Enable users to access and download PDF reports of their completed business assessments through the Telegram bot, with free and paid report tiers.

## User Stories
- As a user, I want to view all my completed assessment results so that I can track my business progress over time
- As a user, I want to download PDF reports of my assessments so that I can review and share them offline
- As a user, I want to access my first report for free so that I can evaluate the value before paying
- As a paying user, I want detailed category analysis in my reports so that I can get actionable insights for each business area
- As a user, I want to access my historical reports indefinitely so that I can reference them anytime

## Core Requirements

### Functional Requirements
- Display "Мои результаты" button in Telegram bot main menu
- Show only completed surveys in a numbered list format
- Format each result as: "{index}. {тип опроса} {дата завершения}" with download link
- Generate PDF reports on-demand when download is requested (no file storage)
- Implement two report versions:
  - Free version: Overall summary with pie chart showing category percentages
  - Paid version: Overall summary plus detailed analysis for all categories
- First survey report is free, subsequent reports require payment
- Integrate with existing Telegram Payments for paid reports
- Ensure users can only access their own survey results
- Support concurrent PDF generation for multiple users
- Provide clear error messages when PDF generation fails

### Non-Functional Requirements
- PDF generation should complete within 5 seconds
- System should handle at least 10 concurrent PDF generation requests
- Reports must be accessible indefinitely once survey is completed
- Generated PDFs should be under 5MB for fast Telegram delivery
- Maintain user privacy - validate ownership before generating reports
- Use streaming for PDF generation to avoid memory issues
- Implement proper error handling and logging

## Visual Design

### Bot Interface (Reference: `planning/visuals/reports-list-in-bot-sketch.png`)
- Main menu shows "Посмотреть результаты" button
- Results list displays numbered entries with format and date
- Each entry has inline keyboard button for PDF download
- Clean, text-based interface following Telegram bot conventions

### PDF Layout (Reference: `planning/visuals/report-pdf-layout-sketch.png`)
- **Free Version Structure:**
  - Page 1: Overall summary "Сводный отчет" with pie chart showing category percentages
  - Page 2+: Only basic category overview without detailed analysis

- **Paid Version Structure:**
  - Page 1: Overall summary "Сводный отчет" with pie chart
  - Following pages: Detailed analysis for each category (HR, Product, Marketing, etc.)
  - Each category section includes subcategory breakdowns and descriptions

## Reusable Components

### Existing Code to Leverage
- **Components:**
  - `PdfGenerator` utility class with Chart.js integration for pie charts
  - `AnalyticsCalculator` for score calculations
  - `ReportService` with PDF generation logic
  - `TelegramService` with bot command handlers and keyboard generation

- **Services:**
  - `SurveyService.getUserSessions()` for fetching completed sessions
  - `AuthService` for user validation
  - `PaymentService` for Telegram Payments integration

- **Patterns:**
  - Existing webhook handling in `TelegramService`
  - Callback query pattern for button interactions
  - JWT token generation for authentication
  - Report generation workflow in `ReportController`

### New Components Required
- **Report Download Handler:** New method in `TelegramService` to handle PDF generation and delivery
- **Free vs Paid Logic:** Business logic to determine if user gets free or paid report
- **Session Counter:** Track number of completed surveys per user for free/paid determination
- **PDF Delivery:** Method to send generated PDF via Telegram bot API
- **Temporary URL Generation:** Create secure, temporary download URLs for PDFs

## Technical Approach

### Database
- **No schema changes required** - leverage existing entities:
  - `SurveySession` entity for completed surveys
  - `Report` entity for tracking generated reports
  - `Payment` entity for paid report tracking
  - `User` entity for user identification

### API
- **Update existing endpoints:**
  - Modify `POST /reports/generate/:sessionId` to support on-demand generation
  - Add logic to determine free vs paid based on user's survey count

- **Bot command handlers:**
  - Update `handleReportsCommand()` to fetch and display completed sessions
  - Implement `handleReportDownload()` to generate and send PDF
  - Add payment flow integration for paid reports

### Frontend
- No frontend changes required (bot-only feature)

### Bot Integration
- **Commands:**
  - `/reports` command handler (already exists as `my_results` callback)
  - `download_report_{sessionId}` callback handler

- **Message Flow:**
  1. User clicks "Мои результаты" → Bot fetches completed sessions
  2. Bot displays numbered list with download buttons
  3. User clicks download → Bot generates PDF and sends file
  4. For paid reports → Bot initiates payment flow first

### Testing
- Unit tests for free vs paid logic
- Integration tests for PDF generation
- End-to-end testing via Telegram bot
- Performance testing for concurrent PDF generation

## Implementation Details

### PDF Generation Flow
```typescript
// Pseudocode for report download handler
async handleReportDownload(chatId, userId, sessionId) {
  // 1. Validate session ownership
  const session = await validateSessionOwnership(userId, sessionId);

  // 2. Check if free or paid
  const completedCount = await getUserCompletedSurveysCount(userId);
  const isFree = completedCount === 1;

  // 3. If paid and not yet paid, initiate payment
  if (!isFree && !hasUserPaidForSession(sessionId)) {
    return initiatePaymentFlow(chatId, sessionId);
  }

  // 4. Generate PDF on-demand
  const analytics = calculateAnalytics(session.answers);
  const pdfBuffer = await pdfGenerator.createPdf(analytics, !isFree);

  // 5. Send PDF via Telegram
  await sendDocument(chatId, pdfBuffer, `report_${sessionId}.pdf`);
}
```

### Key Integration Points
- Reuse existing `PdfGenerator.createPdf()` with `isPaid` parameter
- Leverage `TelegramService.sendDocument()` for file delivery
- Use `PaymentService.createPayment()` for payment processing
- Call `AnalyticsCalculator.calculateScores()` for data preparation

## Out of Scope
- PDF storage or caching system (generate on-demand only)
- Report sharing mechanisms beyond download
- Email delivery of reports
- Web interface for viewing reports
- Report template customization
- Data archival or retention policies
- Report versioning beyond date tracking
- Analytics dashboard or trends visualization
- Comparison between multiple reports
- Export to formats other than PDF

## Success Criteria
- Users can access list of completed surveys via "Мои результаты" button
- Each completed survey can be downloaded as a PDF report
- First report is free, subsequent reports require payment
- PDF generation completes within 5 seconds
- Generated PDFs display pie chart and analytics correctly
- Free reports show only overall summary
- Paid reports include detailed category analysis
- Reports remain accessible indefinitely
- Payment flow integrates smoothly with Telegram Payments
- System handles concurrent PDF generation without errors

## Migration & Rollout
- No database migrations required
- Update `TelegramService` with new handlers
- Deploy backend changes
- Test with small group of beta users
- Monitor PDF generation performance
- Full rollout after successful beta testing

## Security Considerations
- Validate user ownership before generating any report
- Use session-based authentication for all report requests
- Implement rate limiting for PDF generation (1 per minute per user)
- Log all report access attempts for audit trail
- Ensure PDFs don't contain sensitive data from other users
- Use secure temporary URLs if implementing web download option