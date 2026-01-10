# Specification: Fix Report Generation with Cyrillic Support

## Goal
Fix critical Cyrillic encoding issues in PDF report generation and implement proper report structure based on payment status, ensuring all Russian text displays correctly.

## User Stories
- As a business owner, I want to view my assessment report with properly displayed Russian text so that I can understand my business metrics
- As a free user, I want to see category summaries with upgrade prompts so that I understand what additional insights are available
- As a paid user, I want to see full detailed analysis including subcategories so that I get comprehensive business insights
- As a developer, I want proper font embedding and encoding so that reports work reliably across all PDF viewers

## Core Requirements

### Functional Requirements
- Display all Russian/Cyrillic text correctly in PDF reports
- Generate summary page with pie chart showing all category scores
- Show category summaries only for unpaid reports (no subcategory details)
- Show category summaries AND subcategory details for paid reports
- Include "Upgrade to paid version" prompts in free reports
- Maintain existing report generation API endpoints
- Preserve calculation logic and scoring formulas

### Non-Functional Requirements
- PDF generation must complete within 5 seconds
- Generated PDFs must be under 2MB for optimal delivery
- Cyrillic text must be searchable and selectable in PDF viewers
- Reports must render correctly in Adobe Reader, Chrome, and Preview
- Font files must be efficiently cached after first load
- UTF-8 encoding must be preserved throughout the pipeline

## Visual Design
### Broken Report Reference
- Mockup reference: `planning/visuals/broken_report_example.pdf`
- Key issues visible:
  - "Сводный отчет" appears as "B 2Cä4CÔKC'>D$GCT"
  - All Russian text is completely garbled
  - Chart appears missing or not rendering
  - English percentages display correctly
  - Page structure is preserved but content unreadable

### Required UI Elements
- Properly rendered Cyrillic headers and text
- Functional pie chart with Russian labels
- Clear category/subcategory hierarchy
- Upgrade prompts for free version

## Reusable Components

### Existing Code to Leverage
- **PdfGenerator class** (`pdf-generator.util.ts`): Main PDF generation logic - needs font fixes
- **ReportDataService** (`report-data.service.ts`): CSV data loading - needs UTF-8 encoding fix
- **AnalyticsCalculator** (`analytics-calculator.util.ts`): Score calculations - working correctly
- **Chart generation logic**: Already implemented, needs font configuration
- **Report structure methods**: `addFirstPage`, `addCategoryDetailPage` - need font updates
- **Color scheme functions**: `getColorForScore` - can be reused as-is
- **Caching service**: QueryCacheService - working, can cache fonts

### New Components Required
- **Roboto font files**: Need to download and store TTF files with Cyrillic support
- **Font registration utility**: New method to register Roboto fonts in PDFKit
- **UTF-8 CSV reader**: Enhanced CSV parsing with explicit encoding
- **Report structure router**: Logic to route between paid/unpaid content layouts

## Technical Approach

### Database
- No changes required - existing Report, SurveySession, Answer entities work correctly
- Payment status already tracked in Report entity

### API
- Existing endpoints remain unchanged:
  - `GET /report/generate/:sessionId` - generates PDF buffer
  - Report service already handles isPaid flag correctly

### Backend Implementation

#### 1. Font Setup and Registration
```typescript
// In pdf-generator.util.ts constructor
import { join } from 'path';

private registerFonts(doc: PDFDocument) {
  const fontsPath = join(process.cwd(), 'src', 'assets', 'fonts');

  // Register all Roboto variants
  doc.registerFont('Roboto', join(fontsPath, 'Roboto-Regular.ttf'));
  doc.registerFont('Roboto-Bold', join(fontsPath, 'Roboto-Bold.ttf'));
  doc.registerFont('Roboto-Italic', join(fontsPath, 'Roboto-Italic.ttf'));
  doc.registerFont('Roboto-BoldItalic', join(fontsPath, 'Roboto-BoldItalic.ttf'));
}
```

#### 2. CSV Reading with UTF-8
```typescript
// In report-data.service.ts
const fileContent = readFileSync(filePath, { encoding: 'utf-8' });
// Remove BOM if present
const cleanContent = fileContent.replace(/^\uFEFF/, '');
```

#### 3. PDF Generation Updates
- Replace all `font('Helvetica')` with `font('Roboto')`
- Replace all `font('Helvetica-Bold')` with `font('Roboto-Bold')`
- Ensure chart configuration uses Roboto font family

#### 4. Report Structure Logic Enhancement
```typescript
// In createPdf method
if (isPaid) {
  // Full report with categories and subcategories
  for (const category of data.categories) {
    await this.addCategorySummaryPage(doc, category);
    if (category.subcategories?.length > 0) {
      await this.addSubcategoryDetailPages(doc, category);
    }
  }
} else {
  // Free report with category summaries only
  for (const category of data.categories) {
    await this.addCategorySummaryPage(doc, category);
    this.addUpgradePrompt(doc);
  }
}
```

### Frontend
- No changes required - frontend correctly sends requests and displays PDFs

### Testing Requirements
- Unit tests for font registration
- Integration tests for PDF generation with Russian text
- Visual regression tests comparing generated PDFs
- Tests for both paid and unpaid report structures
- CSV parsing tests with various encodings
- Performance tests ensuring < 5 second generation

## Out of Scope
- Changes to survey logic or questions
- Modifications to payment processing
- Frontend UI changes
- Database schema modifications
- Authentication system changes
- Report content generation (AI analysis)
- Adding new report types or formats
- Changing scoring algorithms
- Mobile app development

## Success Criteria
- All Russian text renders correctly in generated PDFs (no garbled characters)
- "Сводный отчет" and other Cyrillic headers display properly
- Chart labels show Russian category names correctly
- Free reports show only category summaries with upgrade prompts
- Paid reports include full category and subcategory details
- PDFs are searchable with Russian text
- Font embedding is complete (no external dependencies)
- CSV content loads without encoding errors
- Generation time remains under 5 seconds
- PDF file size stays under 2MB

## Implementation Details

### Phase 1: Font Infrastructure (Priority 1)
1. Download Roboto font family with Cyrillic support from Google Fonts
2. Create `backend/src/assets/fonts/` directory
3. Store font files: Roboto-Regular.ttf, Roboto-Bold.ttf, Roboto-Italic.ttf, Roboto-BoldItalic.ttf
4. Update .gitignore to include font files (or commit them if appropriate)

### Phase 2: Fix PDF Generator (Priority 1)
1. Add font registration method to PdfGenerator class
2. Call registration during document creation
3. Replace all Helvetica references with Roboto
4. Update chart configuration for Cyrillic support
5. Test with sample Russian text

### Phase 3: Fix CSV Encoding (Priority 1)
1. Update ReportDataService.parseCSV to explicitly use UTF-8
2. Add BOM removal logic
3. Fix double quote escaping in sanitizeCSVValue
4. Validate all CSV files are properly encoded

### Phase 4: Implement Report Structure (Priority 2)
1. Split addFirstPage logic for paid vs unpaid
2. Create addCategorySummaryPage method
3. Create addSubcategoryDetailPages method
4. Add upgrade prompt component
5. Update page flow logic based on isPaid flag

### Phase 5: Testing & Validation (Priority 2)
1. Create test PDFs with various Russian content
2. Verify in multiple PDF viewers
3. Test text selection and search
4. Performance testing
5. File size optimization

## Risk Mitigation
- **Font licensing**: Use open-source Roboto from Google Fonts (Apache 2.0 license)
- **File size**: Implement font subsetting if PDFs exceed 2MB
- **Performance**: Cache registered fonts after first use
- **Compatibility**: Test in major PDF viewers before deployment
- **Encoding**: Validate all text paths (CSV → Service → PDF) maintain UTF-8

## Dependencies
- Roboto font files (to be downloaded)
- Existing PDFKit library (already installed)
- Chart.js and canvas libraries (already installed)
- No new npm packages required

## Monitoring & Validation
- Log successful PDF generations with file sizes
- Track generation time metrics
- Monitor for encoding errors in logs
- Set up alerts for failed generations
- Regular visual checks of generated reports