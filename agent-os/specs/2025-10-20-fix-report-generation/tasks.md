# Task Breakdown: Fix Report Generation with Cyrillic Support

## Overview
Total Tasks: 27
Assigned roles: backend-engineer, data-engineer, testing-engineer

## Task List

### Phase 1: Font Infrastructure Setup

#### Task Group 1: Font Assets and Registration
**Assigned implementer:** backend-engineer
**Dependencies:** None

- [ ] 1.0 Complete font infrastructure setup
  - [ ] 1.1 Write tests for font registration and loading
    - Font file existence tests
    - Font registration success tests
    - Font fallback tests
    - Path resolution tests
  - [ ] 1.2 Download Roboto font family with Cyrillic support
    - Download from Google Fonts: https://fonts.google.com/specimen/Roboto
    - Files needed: Roboto-Regular.ttf, Roboto-Bold.ttf, Roboto-Italic.ttf, Roboto-BoldItalic.ttf
    - Ensure fonts include Cyrillic character ranges (U+0400-U+04FF)
  - [ ] 1.3 Create font assets directory structure
    - Create directory: `backend/src/assets/fonts/`
    - Place all four TTF files in the fonts directory
    - Update .gitignore if needed (or commit fonts directly)
  - [ ] 1.4 Implement font registration utility in PdfGenerator
    - Add method `registerFonts()` in `backend/src/common/utils/pdf-generator.util.ts`
    - Register all four Roboto variants with PDFKit
    - Use absolute paths with `join(process.cwd(), 'src', 'assets', 'fonts')`
  - [ ] 1.5 Ensure all font infrastructure tests pass
    - Run font loading tests written in 1.1
    - Verify fonts are accessible at runtime
    - Confirm font registration succeeds

**Acceptance Criteria:**
- All tests written in 1.1 pass
- Roboto fonts are properly stored in assets directory
- Font registration method is implemented
- Fonts load successfully at runtime

### Phase 2: CSV Data Encoding Fix

#### Task Group 2: UTF-8 CSV Processing
**Assigned implementer:** data-engineer
**Dependencies:** None (can run in parallel with Task Group 1)

- [ ] 2.0 Complete CSV encoding fixes
  - [ ] 2.1 Write tests for CSV parsing with UTF-8
    - Russian text parsing tests
    - BOM removal tests
    - Double quote escaping tests
    - CSV structure validation tests
  - [ ] 2.2 Fix CSV reading in ReportDataService
    - Update `backend/src/report/report-data.service.ts`
    - Add explicit UTF-8 encoding: `readFileSync(filePath, { encoding: 'utf-8' })`
    - Add BOM removal: `content.replace(/^\uFEFF/, '')`
  - [ ] 2.3 Fix sanitizeCSVValue method for proper quote handling
    - Update double quote escaping logic
    - Handle cases like `""Экспертный бизнес""`
    - Ensure Russian text is preserved correctly
  - [ ] 2.4 Review and fix CSV content files
    - Check `backend/src/data/reports/express_report.csv`
    - Check `backend/src/data/reports/full_report.csv`
    - Fix any malformed double quotes
    - Ensure files are saved with UTF-8 encoding
  - [ ] 2.5 Ensure all CSV parsing tests pass
    - Run CSV tests written in 2.1
    - Verify Russian text loads correctly
    - Confirm no encoding errors in logs

**Acceptance Criteria:**
- All tests written in 2.1 pass
- CSV files load with proper UTF-8 encoding
- Russian text is parsed without corruption
- Double quotes are handled correctly

### Phase 3: PDF Generator Updates

#### Task Group 3: PDF Generation with Cyrillic Support
**Assigned implementer:** backend-engineer
**Dependencies:** Task Groups 1 and 2

- [ ] 3.0 Complete PDF generator updates
  - [ ] 3.1 Write tests for PDF generation with Russian text
    - Cyrillic text rendering tests
    - Font application tests
    - Chart label rendering tests
    - Multi-page document tests
  - [ ] 3.2 Update PdfGenerator constructor to register fonts
    - Call `registerFonts()` during document initialization
    - Ensure fonts are registered before any text operations
    - Handle font loading errors gracefully
  - [ ] 3.3 Replace all font references to use Roboto
    - Replace all `font('Helvetica')` with `font('Roboto')`
    - Replace all `font('Helvetica-Bold')` with `font('Roboto-Bold')`
    - Update italic text to use `font('Roboto-Italic')`
    - Update bold-italic text to use `font('Roboto-BoldItalic')`
  - [ ] 3.4 Update chart configuration for Cyrillic labels
    - In `generateChartImage()` method
    - Set Chart.js font family to 'Roboto'
    - Ensure chart labels use UTF-8 encoding
    - Test with Russian category names
  - [ ] 3.5 Fix text encoding throughout PDF generation
    - Ensure all text() calls preserve UTF-8
    - Update color and styling methods to maintain encoding
    - Fix any character escaping issues
  - [ ] 3.6 Ensure all PDF generation tests pass
    - Run PDF tests written in 3.1
    - Generate test PDF with Russian content
    - Verify text is readable and selectable

**Acceptance Criteria:**
- All tests written in 3.1 pass
- PDFs render Russian text correctly
- Charts display Cyrillic labels
- Text is selectable and searchable in PDF viewers

### Phase 4: Report Structure Implementation

#### Task Group 4: Payment-Based Content Logic
**Assigned implementer:** backend-engineer
**Dependencies:** Task Group 3

- [ ] 4.0 Complete report structure implementation
  - [ ] 4.1 Write tests for report structure logic
    - Unpaid report structure tests
    - Paid report structure tests
    - Page count validation tests
    - Upgrade prompt placement tests
  - [ ] 4.2 Implement payment status detection in createPdf
    - Check `isPaid` flag in Report entity
    - Route to appropriate content generation flow
    - Log payment status for debugging
  - [ ] 4.3 Create category summary page method
    - Implement `addCategorySummaryPage()` method
    - Display category name and overall score
    - Show category-level recommendations from CSV
    - Ensure proper page breaks
  - [ ] 4.4 Create subcategory detail pages method
    - Implement `addSubcategoryDetailPages()` method
    - Display subcategory breakdowns
    - Include detailed recommendations
    - Only call for paid reports
  - [ ] 4.5 Add upgrade prompts for unpaid version
    - Create `addUpgradePrompt()` method
    - Add text: "Обновитесь до платной версии для детального анализа"
    - Style with Roboto-Italic and gray color (#666666)
    - Place after each category summary in unpaid reports
  - [ ] 4.6 Update page flow logic based on payment status
    - For unpaid: Summary → Category summaries with upgrade prompts
    - For paid: Summary → Category summaries → Subcategory details
    - Ensure proper pagination and page numbering
  - [ ] 4.7 Ensure all report structure tests pass
    - Run structure tests written in 4.1
    - Generate both paid and unpaid test reports
    - Verify correct content appears in each version

**Acceptance Criteria:**
- All tests written in 4.1 pass
- Unpaid reports show only category summaries
- Paid reports include subcategory details
- Upgrade prompts appear in correct locations
- Page flow follows specification

### Phase 5: Integration Testing & Validation

#### Task Group 5: End-to-End Testing
**Assigned implementer:** testing-engineer
**Dependencies:** Task Groups 1-4

- [ ] 5.0 Complete end-to-end testing and validation
  - [ ] 5.1 Write comprehensive integration tests
    - Full report generation workflow tests
    - Express survey report tests
    - Full survey report tests
    - Payment status variation tests
  - [ ] 5.2 Test with actual survey sessions
    - Create test session for unpaid Express survey
    - Create test session for paid Express survey
    - Create test session for unpaid Full survey
    - Create test session for paid Full survey
  - [ ] 5.3 Validate Cyrillic text rendering
    - Test text "Сводный отчет" displays correctly (not as garbled text)
    - Verify all category names in Russian
    - Check recommendation text from CSV files
    - Ensure no encoding artifacts
  - [ ] 5.4 Test PDF compatibility
    - Open generated PDFs in Adobe Reader
    - Open in Chrome PDF viewer
    - Open in macOS Preview
    - Verify text selection works
    - Test text search functionality
  - [ ] 5.5 Performance and size validation
    - Measure generation time (must be < 5 seconds)
    - Check PDF file sizes (must be < 2MB)
    - Test with maximum content (paid Full survey)
    - Verify memory usage is reasonable
  - [ ] 5.6 Create visual regression tests
    - Generate baseline PDFs with correct rendering
    - Compare future generated PDFs against baseline
    - Flag any visual differences
  - [ ] 5.7 Validate all acceptance criteria
    - Run all tests from Task Groups 1-4
    - Run new integration tests from 5.1
    - Ensure 100% of requirements are met
    - Document any edge cases found

**Acceptance Criteria:**
- All integration tests pass
- Russian text renders correctly in all viewers
- PDFs are searchable with Cyrillic text
- Generation time < 5 seconds
- File size < 2MB
- All survey types and payment statuses work

## Execution Order

Recommended implementation sequence:
1. **Parallel Start**: Task Groups 1 & 2 (Font Infrastructure & CSV Encoding)
2. **Sequential**: Task Group 3 (PDF Generator Updates)
3. **Sequential**: Task Group 4 (Report Structure)
4. **Final**: Task Group 5 (Integration Testing)

## Critical Path

The critical path for this implementation:
1. Font Infrastructure (1.2-1.4) → PDF Generator Updates (3.2-3.3) → Report Structure (4.2-4.6) → Integration Testing (5.2-5.4)

## Risk Mitigation

### High Priority Risks
1. **Font Licensing**: Using Apache 2.0 licensed Roboto from Google Fonts
2. **Performance Impact**: Font caching after first load
3. **Backward Compatibility**: Existing reports continue to work

### Contingency Plans
- If Roboto fonts exceed size limits, implement font subsetting
- If Chart.js has issues with Cyrillic, use canvas text rendering as fallback
- Keep Helvetica fallback for non-Cyrillic text if needed

## Definition of Done

Each task group is considered complete when:
- All sub-tasks are checked off
- All tests written for that group pass
- Code has been reviewed and follows project standards
- No console errors or warnings during execution
- Documentation is updated if needed

## Notes for Implementers

- Always test with actual Russian content, not placeholder text
- Pay special attention to edge cases like empty CSV cells
- Ensure error messages are logged but don't break report generation
- Keep the existing business logic intact - only fix encoding and structure
- Reference `planning/visuals/broken_report_example.pdf` to verify fixes