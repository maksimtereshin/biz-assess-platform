# Spec Requirements: Results Feature

## Initial Description
This is item #4 from the roadmap - implementing the results/reports functionality for the business assessment platform.

## Requirements Discussion

### First Round Questions

**Q1:** For accessing results, I assume users would click a "My Results" button in the Telegram bot's main menu. Is that correct, or would you prefer a different access method?
**Answer:** Результаты должны быть доступны в телеграм боте при нажатии на кнопку "Мои результаты"

**Q2:** I'm thinking the results list should show all survey sessions (both completed and in-progress). Should we show only completed surveys, or include partial ones with a different status indicator?
**Answer:** Нужно показывать только завершенные опросы

**Q3:** For the display format, I assume we'd show results both as a summary in the bot chat and as downloadable PDFs. Is that correct, or would you prefer just one format?
**Answer:** Результаты должны быть доступны только как PDF для скачивания по ссылке

**Q4:** I'm assuming each PDF report should be shareable via a unique link. Should reports be generated once and stored, or regenerated on each request?
**Answer:** Результаты индивидуальны, PDF генерируется каждый раз по запросу на скачивание конкретного документа

**Q5:** For the PDF content, I assume it should include: overall score, category breakdown with charts, detailed subcategory analysis (for paid reports), and recommendations. Should we include anything else?
**Answer:** Сначала общая сводная аналитика по всем категориям с круговой диаграммой с разбивкой по категориям. Затем детальная аналитика по категориям, но только если пользователь оплатил эту feature. Включать только аналитику и ничего больше

**Q6:** I'm thinking users can access their results indefinitely after completing a survey. Should there be any access restrictions or time limits?
**Answer:** Все последующие опросы, кроме первого - платные. Пройденные опросы должны быть доступны неограниченное количество времени. PDF генерируется каждый раз по запросу пользователя на скачивание. Фактически не храним файлы, а только ответы в базе данных

**Q7:** For data retention, I assume we keep all survey results permanently in the database. Is that correct, or should old results be archived/deleted after a certain period?
**Answer:** На данном этапе retention не подразумевается

**Q8:** I'm assuming each user can have multiple completed surveys and all should be accessible. Should newer results replace older ones, or keep all historical results?
**Answer:** Все результаты должны быть доступны, старые не перезатираются. Каждый отчет должен отображаться в виде: "{index}. полный или экспресс {дата завершения опроса} (ссылка на скачивание)"

**Q9:** Is there anything specific you want to exclude from this MVP version of the results feature?
**Answer:** Нечего исключать

### Existing Code to Reference
**Similar Features Identified:**
- Backend report module: `/backend/src/report` - Contains existing report generation logic including:
  - `ReportController` with endpoints for generating and downloading reports
  - `ReportService` with PDF generation via `PdfGenerator` utility
  - `ReportDataService` for loading report content from CSV files
  - Analytics calculation and chart generation capabilities
  - Existing PDF generation with pie charts using Chart.js and pdfkit

### Follow-up Questions

**Follow-up 1:** I found report-pdf-layout-sketch.png and reports-list-in-bot-sketch.png in the visuals folder. These show wireframes for the reports list in the Telegram bot and the PDF layout structure. Should we treat these as layout guides using our application's existing styling rather than exact design specifications?
**Answer:** [Pending - but based on low-fidelity nature of sketches, we'll treat them as structural guides]

## Visual Assets

### Files Provided:
- `reports-list-in-bot-sketch.png`: Shows Telegram bot interface with "Посмотреть результаты" button leading to a numbered list of completed surveys with dates and download links
- `report-pdf-layout-sketch.png`: Shows PDF structure with two versions (free and paid) - free version shows overall summary with pie chart and HR category details, paid version includes detailed analysis for all categories

### Visual Insights:
- **Bot Interface Flow**: Main menu → "Посмотреть результаты" button → List of completed surveys
- **Report List Format**: Numbered list showing survey type (Полный/Экспресс) with completion date and download link
- **PDF Structure - Free Version**:
  - Page 1: Overall summary with pie chart and percentages
  - Page 2+: HR category detailed analysis only
- **PDF Structure - Paid Version**:
  - Page 1: Overall summary with pie chart
  - Following pages: Detailed analysis for ALL categories including HR, Product, Marketing, etc.
- **Design Elements**: Simple, clean layout with clear separation between sections
- **Fidelity Level**: Low-fidelity wireframes/sketches for structural guidance

## Requirements Summary

### Functional Requirements
- **Telegram Bot Integration**:
  - Add "Мои результаты" button to main bot menu
  - Display only completed surveys in numbered list format
  - Format: "{index}. {тип опроса} {дата} (ссылка)"
  - Each item has a download link for PDF generation

- **PDF Generation**:
  - Generate PDF on-demand for each download request (not stored)
  - Two versions: Free (first survey) and Paid (subsequent surveys)
  - Use existing PDF generation infrastructure (pdfkit, Chart.js)
  - Include overall summary with pie chart showing category breakdown
  - Free version: Show only general analytics
  - Paid version: Include detailed category-by-category analysis

- **Data Management**:
  - Store only survey answers and session data in database
  - No PDF file storage - generate on each request
  - Maintain all historical results permanently
  - No data retention/archival policy at this stage

- **Payment Integration**:
  - First survey report is free
  - All subsequent survey reports require payment
  - Once paid, report access is unlimited
  - Integrate with existing Telegram Payments flow

### Non-Functional Requirements
- **Performance**: PDF generation should complete within reasonable time (< 5 seconds)
- **Accessibility**: Reports accessible indefinitely once survey is completed
- **Scalability**: System should handle multiple concurrent PDF generation requests
- **Security**: Validate user ownership of survey results before generating PDF

### Reusability Opportunities
- **Existing Report Module**: Full report generation system already exists in `/backend/src/report/`
- **PDF Generator Utility**: Existing `PdfGenerator` class with Chart.js integration
- **Analytics Calculator**: Existing analytics calculation logic
- **Report Data Service**: CSV-based report content system
- **Telegram Service**: Existing bot command handlers and keyboard generation
- **Session Management**: Existing survey session tracking in database

### Scope Boundaries
**In Scope:**
- Telegram bot "Мои результаты" button and handler
- List of completed surveys with download links
- On-demand PDF generation (not stored)
- Free vs Paid report logic
- Overall analytics with pie chart
- Category-specific detailed analysis (paid only)
- Integration with existing payment system

**Out of Scope:**
- PDF storage/caching system
- Report sharing mechanisms beyond download
- Email delivery of reports
- Web interface for viewing reports
- Report templates customization
- Data archival/retention policies
- Report versioning beyond date tracking

### Technical Considerations
- **PDF Generation**: Leverage existing pdfkit and Chart.js setup
- **Database Queries**: Optimize fetching completed sessions with answers
- **Memory Management**: Stream PDF generation to avoid memory issues
- **Bot Response Time**: Use callback queries for better UX
- **Payment Flow**: Integrate with existing Telegram Payments implementation
- **Error Handling**: Graceful failures for PDF generation issues
- **Existing Code**: Maximum reuse of `/backend/src/report/` module
- **URL Generation**: Temporary signed URLs for PDF downloads