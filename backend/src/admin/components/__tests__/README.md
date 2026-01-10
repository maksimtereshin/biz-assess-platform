# StructureEditor E2E Tests - Playwright

## Current Status

The Playwright E2E tests for the StructureEditor component have been created but cannot be executed due to backend compilation errors.

## Compilation Errors Blocking Tests

The backend server is currently unhealthy due to TypeScript compilation errors:

1. **src/main.ts:5:1** - Namespace-style import issue with `express-session`
2. **src/telegram/telegram.service.ts:1501:28** - `FormData` constructor issue
3. **src/telegram/telegram.service.ts:1551:28** - `FormData` constructor issue

These errors prevent the NestJS server from starting, which blocks Playwright browser testing.

## How to Run Tests (Once Compilation Errors Fixed)

### Prerequisites

1. **Fix TypeScript Compilation Errors:**
   - Update imports in `src/main.ts` for `express-session`
   - Update imports in `src/telegram/telegram.service.ts` for `form-data`

2. **Ensure Backend is Running:**
   ```bash
   # Either via Docker
   docker ps --filter "name=bizass-backend" --format "{{.Status}}"
   # Should show: Up XX minutes (healthy)

   # Or locally
   cd backend
   npm run start:dev
   # Should start on port 4000 or 3001
   ```

### Running Tests

```bash
# From backend directory
cd /Users/maksimtereshin/Projects/Personal/biz-assess-platform/backend

# Run all e2e tests
npx playwright test

# Run with headed browser (see the browser)
npx playwright test --headed

# Run specific test file
npx playwright test structure-editor.e2e.spec.ts

# Generate test report
npx playwright show-report
```

### Environment Variables

The tests use the following environment variables:

- `BASE_URL`: Backend URL (default: `http://localhost:4000`)
- `JWT_SECRET`: JWT secret for token generation (default: `test-secret-key`)

For Docker-based backend, you may need to update `BASE_URL`:

```bash
BASE_URL=http://localhost:3001 npx playwright test
```

## Test Coverage

The `structure-editor.e2e.spec.ts` file includes 5 focused tests:

1. **Admin Authentication**: Tests admin token generation and automatic login
2. **Navigation to SurveyVersion**: Tests finding and clicking SurveyVersion resource
3. **StructureEditor Visibility**: Tests that StructureEditor component renders on edit page
4. **Add Category Interaction**: Tests clicking "Add Category" button
5. **Validation Display**: Tests that validation errors are displayed

## Expected Screenshots

Once tests run successfully, screenshots will be saved to:

```
agent-os/specs/2026-01-06-admin-panel-cms/verification/screenshots/
├── admin-dashboard-{timestamp}.png
├── admin-navigation-{timestamp}.png
├── surveyversion-list-{timestamp}.png
├── surveyversion-edit-{timestamp}.png
├── structure-editor-before-add-{timestamp}.png
├── structure-editor-after-add-{timestamp}.png
└── structure-editor-validation-{timestamp}.png
```

## Manual Testing Alternative

Until compilation errors are fixed, you can manually test the StructureEditor:

1. Fix TypeScript compilation errors in backend
2. Start backend server
3. Generate admin token via Telegram bot or directly via `/api/auth/admin-token`
4. Navigate to `http://localhost:3001/admin?token=YOUR_TOKEN`
5. Click "Survey Versions" in sidebar
6. Click "Edit" on any survey version
7. Verify StructureEditor component is visible
8. Test add/remove category functionality
9. Test validation display

## Next Steps

1. **Priority:** Fix backend TypeScript compilation errors
2. Run Playwright tests: `npx playwright test`
3. Verify all 5 tests pass
4. Review screenshots in verification folder
5. Mark task 9.6 as complete in tasks.md

## Graceful Degradation

Per spec standards, if Playwright testing remains blocked:

- Document need for manual testing (this file)
- Create TODO for fixing compilation errors
- Provide clear instructions for future test execution
- Mark task with notes about blocked status

## References

- Playwright Test Config: `/backend/playwright.config.ts`
- Test File: `/backend/src/admin/components/__tests__/structure-editor.e2e.spec.ts`
- Task: `agent-os/specs/2026-01-06-admin-panel-cms/tasks.md` - Task 9.6
