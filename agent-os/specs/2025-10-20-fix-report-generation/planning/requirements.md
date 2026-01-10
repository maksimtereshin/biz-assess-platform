# Spec Requirements: Fix Report Generation

## Initial Description
Fix issues with report generation in the business assessment platform. The report generation feature has critical encoding issues with Cyrillic text and incorrect content structure based on payment status.

## Requirements Discussion

### First Round Questions

**Q1:** I assume the reports should display all Russian content correctly with proper Cyrillic encoding. Is that correct, or should we support multiple languages?
**Answer:** Все на русском (Everything in Russian)

**Q2:** I'm thinking the report structure should be: Page 1 with summary chart, then for unpaid version just category summaries (no subcategory details), and for paid version both category summaries AND subcategory details. Should we follow this structure?
**Answer:** да, именно так. Первая страница - сводная страница. Последующие страницы должны содержать:
- для неоплаченных отчетов - сводный отчет по категориям (но никаких подкатегорий);
- для оплаченных - сводный отчет по категориям и детализацию по подкатегориям

**Q3:** For the PDF font, I assume we should use a font that supports Cyrillic characters properly. Would you prefer Roboto, Open Sans, or another specific font family?
**Answer:** Roboto

**Q4:** I'm thinking we should explicitly specify UTF-8 encoding when reading the CSV files to prevent encoding issues. Is that the correct approach?
**Answer:** да

**Q5:** For the free/unpaid version, I assume we should show "Upgrade to paid version" prompts where detailed analysis would be. Should we include this upgrade messaging, or just show the category summaries without mentioning the paid features?
**Answer:** да

**Q6:** I assume fonts should be stored in `backend/src/assets/fonts/` directory. Is this the correct location, or would you prefer a different path?
**Answer:** да

**Q7:** If CSV content is missing for a specific score range, should we show a fallback message like "Analysis not available" or treat it as an error?
**Answer:** нет фоллбек сообщения

**Q8:** Is there anything specific about the report generation that should NOT be changed or that we should be careful to preserve?
**Answer:** не трогать другую бизнес логику

### Existing Code to Reference
No similar existing features identified for reference.

### Follow-up Questions
None required - all questions were answered comprehensively.

## Visual Assets

### Files Provided:
- `broken_report_example.pdf`: A 2-page broken PDF report showing garbled Cyrillic text. Page 1 contains a summary with scores, page 2 is mostly empty with garbled header text.

### Visual Insights:
- All Russian text is completely garbled (e.g., "Сводный отчет" appears as "B 2Cä4CÔKC'>D$GCT")
- The PDF structure shows: title, date, overall score, category scores with percentages
- Chart appears to be missing or not rendering
- Page 2 is mostly empty, indicating missing content for unpaid version
- English text renders correctly (percentages, "Upgrade to paid version")
- Layout structure is preserved but content is unreadable
- Fidelity level: actual broken production output

## Requirements Summary

### Functional Requirements

#### 1. Font and Encoding Support
- **Download and embed Roboto font family** with full Cyrillic support
- Must include Regular, Bold, Italic, and Bold Italic variants
- Store fonts in `backend/src/assets/fonts/` directory
- Register fonts properly in PDFKit before use
- All text must render in Russian with proper encoding

#### 2. Report Structure by Payment Status

**Unpaid/Free Version:**
- Page 1: Summary page (Сводная страница) with overall score and chart showing all categories
- Following pages: One page per category with category summary ONLY (Сводный отчет по категории)
- NO subcategory details or breakdowns
- Include "Upgrade to paid version" prompts where detailed analysis would appear

**Paid/Premium Version:**
- Page 1: Summary page (Сводная страница) with overall score and chart showing all categories
- Following pages: For each category:
  - Category summary page (Сводный отчет по категории)
  - Subcategory detail pages (Детализация по подкатегориям)
- Full detailed analysis with all subcategory breakdowns

#### 3. CSV Data Handling
- Explicitly specify UTF-8 encoding when reading CSV files
- Fix double quote escaping issues in CSV content (e.g., `""Экспертный бизнес""`)
- Ensure proper parsing of Russian text from CSV files
- Handle CSV data located in `backend/src/data/reports/`

#### 4. Chart Generation
- Ensure chart labels and legends display in Russian
- Fix any encoding issues in chart text rendering
- Charts should properly display category names in Cyrillic

### Non-Functional Requirements

#### Performance
- PDF generation should complete within reasonable time (< 5 seconds)
- Font files should be cached after first load
- CSV data should be loaded once on service initialization

#### Error Handling
- No fallback text for missing CSV content - treat as error
- Log errors properly when CSV content is missing
- Graceful handling of font loading failures

#### Compatibility
- PDFs must be readable in standard PDF viewers
- Cyrillic text must be selectable and searchable in PDF
- Font embedding must be complete (no external font dependencies)

### Reusability Opportunities
- The fixed font registration can be used for future multilingual support
- CSV parsing improvements can benefit other data imports
- Report structure logic can be extended for additional report types

### Scope Boundaries

**In Scope:**
- Fix Cyrillic encoding issues in PDF generation
- Download and configure Roboto fonts
- Fix CSV reading with UTF-8 encoding
- Implement proper report structure based on payment status
- Fix chart label encoding
- Ensure all Russian text renders correctly

**Out of Scope:**
- Changes to other business logic
- Authentication or payment processing
- Survey logic or question handling
- Report content generation (AI analysis)
- Database schema changes
- Frontend changes

### Technical Considerations

#### Current Issues Identified

1. **PDFKit Font Configuration**
   - Currently using 'Helvetica' font which doesn't support Cyrillic
   - No custom fonts registered in PDFKit
   - Text encoding not properly handled

2. **CSV Reading Issues**
   - No explicit UTF-8 encoding specified in `readFileSync`
   - Double quote escaping problems in CSV content
   - Russian text may be corrupted during parsing

3. **Report Structure Logic**
   - Unpaid version shows incomplete category summaries
   - Page 2 is mostly empty (should show category summaries)
   - Missing logic to differentiate content based on payment status

#### Implementation Tasks

1. **Font Setup and Configuration**
   - Download Roboto font family (woff2 or ttf formats)
   - Create fonts directory: `backend/src/assets/fonts/`
   - Register fonts in PDFKit with proper names
   - Update all font references to use Roboto

2. **CSV Encoding Fixes**
   - Update `readFileSync` to specify `encoding: 'utf-8'`
   - Review and fix CSV content double quote issues
   - Test Russian text parsing from CSV

3. **PDF Generation Updates**
   - Replace all `font('Helvetica')` calls with `font('Roboto')`
   - Ensure proper font registration before PDF creation
   - Update chart configuration for Cyrillic labels

4. **Report Structure Implementation**
   - Add logic to check payment status
   - Implement category-only pages for unpaid version
   - Implement full detail pages for paid version
   - Add "Upgrade to paid version" messaging

5. **Testing Requirements**
   - Test with unpaid session (first free report)
   - Test with paid session (premium report)
   - Verify all Russian text renders correctly
   - Verify chart labels display in Russian
   - Test PDF in multiple viewers (Adobe, Chrome, Preview)
   - Verify text is selectable and searchable

#### File Modifications Required

1. **backend/src/common/utils/pdf-generator.util.ts**
   - Register Roboto fonts
   - Update font usage throughout
   - Fix report structure logic
   - Add payment status handling

2. **backend/src/report/report-data.service.ts**
   - Add explicit UTF-8 encoding to `readFileSync`
   - Fix CSV value sanitization for proper quotes

3. **backend/src/data/reports/express_report.csv**
   - Review and fix double quote issues
   - Ensure proper UTF-8 encoding

4. **backend/src/data/reports/full_report.csv**
   - Review and fix double quote issues
   - Ensure proper UTF-8 encoding

5. **New files to create:**
   - `backend/src/assets/fonts/Roboto-Regular.ttf`
   - `backend/src/assets/fonts/Roboto-Bold.ttf`
   - `backend/src/assets/fonts/Roboto-Italic.ttf`
   - `backend/src/assets/fonts/Roboto-BoldItalic.ttf`

#### Code Examples

**Font Registration in PDFKit:**
```typescript
// At the top of pdf-generator.util.ts
import { join } from 'path';

// In constructor or initialization
const fontsPath = join(process.cwd(), 'src', 'assets', 'fonts');
doc.registerFont('Roboto', join(fontsPath, 'Roboto-Regular.ttf'));
doc.registerFont('Roboto-Bold', join(fontsPath, 'Roboto-Bold.ttf'));
doc.registerFont('Roboto-Italic', join(fontsPath, 'Roboto-Italic.ttf'));
doc.registerFont('Roboto-BoldItalic', join(fontsPath, 'Roboto-BoldItalic.ttf'));
```

**CSV Reading with UTF-8:**
```typescript
// In report-data.service.ts
const fileContent = readFileSync(filePath, { encoding: 'utf-8' });
```

**Report Structure Logic:**
```typescript
// In pdf-generator.util.ts
if (isPaid) {
  // Add category summary + subcategory details
  for (const category of data.categories) {
    await this.addCategorySummaryPage(doc, category);
    if (category.subcategories && category.subcategories.length > 0) {
      await this.addSubcategoryDetailPages(doc, category);
    }
  }
} else {
  // Add only category summaries
  for (const category of data.categories) {
    await this.addCategorySummaryPage(doc, category);
    // Add upgrade prompt
    doc.fontSize(10)
       .font('Roboto-Italic')
       .fillColor('#666666')
       .text('Обновитесь до платной версии для детального анализа', { align: 'center' });
  }
}
```

## Success Criteria

1. **All Russian text renders correctly** in generated PDFs
2. **Cyrillic characters are readable** and not garbled
3. **Unpaid reports show** summary + category summaries only
4. **Paid reports show** summary + category summaries + subcategory details
5. **Charts display** Russian labels correctly
6. **PDFs are searchable** with Russian text
7. **No encoding errors** in logs during generation
8. **CSV content loads** without corruption
9. **Font embedding** is complete (no missing glyphs)
10. **Upgrade prompts** appear in unpaid version where appropriate