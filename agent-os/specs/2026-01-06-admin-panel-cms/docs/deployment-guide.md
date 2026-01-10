# Deployment Guide: Admin Panel CMS on Render.com

**Date**: 2026-01-09
**Purpose**: Step-by-step guide for deploying the admin panel CMS to production on Render.com
**Prerequisites**: Render.com account, GitHub repository connected to Render

---

## Deployment Readiness Checklist

### Code Changes Completed ✅

- [x] **render.yaml updated** with AdminJS environment variables
- [x] **Production admin seed** migration created (environment-aware)
- [x] **Migrations configured** to run on deploy via `preDeployCommand`
- [x] **Documentation** created (admin guide, API docs, versioning schema)
- [x] **README.md** updated with Admin Panel section

### Environment Variables Required

Set these in Render.com dashboard **BEFORE** deployment:

| Variable | Value | Source | Required |
|----------|-------|--------|----------|
| `NODE_ENV` | `production` | Auto-set by render.yaml | ✅ Yes |
| `TELEGRAM_BOT_TOKEN` | Your bot token | BotFather | ✅ Yes |
| `ADMIN_SESSION_SECRET` | Auto-generated | Render (generateValue) | ✅ Yes |
| `BACKEND_URL` | `https://bizass-backend.onrender.com` | Auto-set by render.yaml | ✅ Yes |
| `ADMIN_TELEGRAM_USERNAME` | Your Telegram username | Manual | ✅ Yes |
| `JWT_SECRET` | Auto-generated | Render (generateValue) | ✅ Yes |
| `FRONTEND_URL` | `https://biz-assess-platform.onrender.com` | Auto-set by render.yaml | ✅ Yes |
| `DB_*` | Database credentials | Auto-set from database | ✅ Yes |

---

## Step-by-Step Deployment (Tasks 14.3-14.6)

### Task 14.3: Deploy to Render.com

**Option 1: Auto-Deploy (Recommended)**

1. **Commit and push changes to `main` branch**:
   ```bash
   git add .
   git commit -m "feat: add AdminJS admin panel with versioning system"
   git push origin main
   ```

2. **Render will automatically deploy** if auto-deploy is enabled
   - Monitor deployment logs in Render dashboard
   - Check for errors during build and startup

**Option 2: Manual Deploy**

1. Go to Render dashboard
2. Select `bizass-backend` service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Monitor logs for errors

**Expected Output**:
```
==> Running 'npm run migration:run'
[Migration] Running migrations...
[Migration] CreateSurveyVersionsAndAdmins1704672000001 - executed
[Migration] SeedInitialAdmins1704672000002 - executed
[Migration] AddVersioningColumnsToSurveys1704672000003 - executed
[Migration] MigrateExistingSurveysToVersions1704672000004 - executed
[Migration] AddSurveyVersionIdToSessions1704672000005 - executed
[Migration] Admin seeding complete.

==> Starting application...
[AdminJS] Loading ESM modules...
[AdminJS] TypeORM adapter registered successfully
[AdminJS] Registering custom components...
[Nest] AdminJS is running at /admin
[Bootstrap] Backend is running on port 3001
```

---

### Task 14.4: Verify Migrations (Automatic)

**What Happens**:
- `preDeployCommand: npm run migration:run` executes **before** the application starts
- All 5 migrations run in order
- Admin seeding happens automatically using `ADMIN_TELEGRAM_USERNAME` env variable

**Verification**:

1. Check deployment logs for migration output:
   ```
   [Migration] CreateSurveyVersionsAndAdmins1704672000001 - executed ✅
   [Migration] SeedInitialAdmins1704672000002 - executed ✅
   [Migration] AddVersioningColumnsToSurveys1704672000003 - executed ✅
   [Migration] MigrateExistingSurveysToVersions1704672000004 - executed ✅
   [Migration] AddSurveyVersionIdToSessions1704672000005 - executed ✅
   ```

2. **If migrations fail**, check logs for errors:
   - Database connection issues → Verify DB_* environment variables
   - SQL errors → Check migration scripts for syntax errors
   - Seed errors → Verify `ADMIN_TELEGRAM_USERNAME` is set correctly

3. **Manual verification** (if needed):
   ```bash
   # Access Render shell
   # Navigate to Render dashboard → bizass-backend → Shell

   # Check migrations table
   npm run typeorm -- query "SELECT * FROM migrations"

   # Check admins table
   npm run typeorm -- query "SELECT * FROM admins"
   ```

---

### Task 14.5: Verify /admin Access in Production

**Steps**:

1. **Open production Telegram bot** (not test bot)

2. **Send `/start` command**

3. **Verify admin button visibility**:
   - If you are an admin: "🔧 Админ-панель" button should appear
   - If not an admin: Button should NOT appear

4. **Click "🔧 Админ-панель" button**
   - Bot should send a message: "🔧 Админ-панель" with WebApp button
   - Message text: "Нажмите кнопку ниже для открытия панели управления. Токен действителен 15 минут."

5. **Click "Открыть" (Open) button**
   - WebApp should open at: `https://bizass-backend.onrender.com/admin?token=...`
   - Browser redirects to: `https://bizass-backend.onrender.com/admin` (token removed)
   - AdminJS interface loads with Russian localization

6. **Verify authentication**:
   - User email visible: `{your_username}@telegram.user`
   - Navigation sidebar visible: "Администрирование", "Опросы"
   - No 403 Forbidden errors

7. **Verify survey resources**:
   - Click "Опросы" → "Surveys"
   - Check that existing surveys are visible
   - Each survey should have `latest_published_version_id` populated

8. **Verify versioning**:
   - Click "Опросы" → "Survey Versions"
   - Check that existing surveys have been migrated to versions
   - Each version should show:
     - Version number (e.g., `1`)
     - Status: `PUBLISHED`
     - Created date

9. **Test version creation**:
   - Open a SurveyVersion
   - Click "Создать новую версию" action
   - Verify new draft version created with version number incremented

10. **Test version publishing**:
    - Open a draft SurveyVersion
    - Click "Опубликовать версию" action
    - Confirm publication
    - Verify status changed to `PUBLISHED`
    - Verify Survey.latest_published_version_id updated

**Expected Results**:
- ✅ Admin panel accessible via Telegram WebApp
- ✅ Automatic JWT authentication works
- ✅ Existing surveys migrated to versions
- ✅ Custom actions work correctly
- ✅ JSONB structure editing loads without bundling errors

---

### Task 14.6: Post-Deployment Monitoring

**What to Monitor**:

1. **Backend Logs (First 30 minutes)**:
   - Go to Render dashboard → bizass-backend → Logs
   - Watch for errors or warnings
   - Expected: Normal request logs, no errors

2. **Performance Metrics**:
   - Monitor response times for `/api/surveys/:type/latest`
   - Should be <500ms for survey fetch
   - AdminJS UI should load in <2s

3. **Database Queries**:
   - Check for N+1 query problems in logs
   - Monitor slow query warnings
   - Verify indexes are being used

4. **Session Creation**:
   - Test creating a new survey session via Telegram bot
   - Verify `survey_version_id` is populated correctly
   - Check that sessions use the latest published version

5. **Error Tracking**:
   - Check for any 500 errors in logs
   - Monitor for AdminJS bundling errors
   - Watch for authentication failures

**Metrics to Track**:

| Metric | Target | How to Check |
|--------|--------|--------------|
| Response time (API) | <500ms | Render metrics dashboard |
| Memory usage | <512MB | Render metrics dashboard |
| CPU usage | <50% | Render metrics dashboard |
| Error rate | <1% | Logs + HTTP status codes |
| AdminJS load time | <2s | Browser DevTools Network tab |

**Common Issues and Fixes**:

1. **"Component has not been bundled" error**:
   - This should be fixed by the bundling fix (Task 9.6)
   - If it appears, check backend logs for circular structure errors
   - Verify `admin.watch()` is NOT being called

2. **403 Forbidden on /admin**:
   - Verify user's Telegram username is in `admins` table
   - Check JWT token is valid and not expired
   - Verify `ADMIN_SESSION_SECRET` is set correctly

3. **Migrations not running**:
   - Check `preDeployCommand` is in render.yaml
   - Verify database connection is established before migrations
   - Check for SQL syntax errors in migration logs

4. **Session creation fails**:
   - Verify `latest_published_version_id` is set for surveys
   - Check migration 1704672000004 executed successfully
   - Ensure at least one survey version has status `PUBLISHED`

---

## Post-Deployment Verification Checklist

After deployment is complete, verify:

- [ ] Backend deployed successfully without errors
- [ ] All 5 migrations executed successfully
- [ ] Admin user seeded from `ADMIN_TELEGRAM_USERNAME` env variable
- [ ] Admin panel accessible at `https://bizass-backend.onrender.com/admin`
- [ ] Telegram bot "🔧 Админ-панель" button works
- [ ] WebApp opens and auto-authenticates
- [ ] Existing surveys migrated to survey_versions
- [ ] `latest_published_version_id` populated for all surveys
- [ ] Custom actions work: "Создать новую версию", "Опубликовать версию"
- [ ] New survey sessions use `survey_version_id` correctly
- [ ] No bundling errors in AdminJS UI
- [ ] No 403 errors for admin users
- [ ] Performance metrics within targets

---

## Rollback Plan (If Needed)

If deployment fails or critical issues arise:

1. **Immediate rollback** via Render dashboard:
   - Go to bizass-backend → Deploys
   - Click "Rollback" on previous working deployment

2. **Database rollback** (if migrations corrupted data):
   ```bash
   # Access Render shell
   npm run migration:revert  # Reverts last migration
   ```

3. **Manual fix** (if specific migration failed):
   - Identify failed migration from logs
   - Fix migration code
   - Redeploy with corrected migration

---

## Success Criteria

Deployment is successful when:

1. ✅ All migrations executed without errors
2. ✅ Admin panel accessible via Telegram WebApp
3. ✅ Existing surveys migrated to versioning system
4. ✅ New sessions created with `survey_version_id`
5. ✅ Custom actions work correctly
6. ✅ No bundling or authentication errors
7. ✅ Performance metrics within targets

---

## Next Steps After Deployment

1. **Monitor for 24 hours** to ensure stability
2. **Test all user flows**:
   - Express survey completion
   - Full survey completion
   - Payment flow
   - Report generation
3. **Verify admin workflows**:
   - Create new survey version
   - Edit draft version
   - Publish version
   - Unpublish version
4. **Document any production-specific issues** in GitHub issues

---

## Related Documentation

- **Admin Guide**: [admin-guide.md](./admin-guide.md) - Administrator manual
- **API Documentation**: [api-documentation.md](./api-documentation.md) - Versioning endpoints
- **Versioning Schema**: [versioning-schema.md](./versioning-schema.md) - Database schema
- **Bundling Fix**: [bundling-fix-summary.md](./bundling-fix-summary.md) - AdminJS bundling issue resolution
- **Test Coverage**: [test-coverage-analysis.md](./test-coverage-analysis.md) - Test inventory and coverage

---

## Support

If you encounter issues during deployment:

1. Check this guide for common issues and fixes
2. Review backend logs in Render dashboard
3. Consult related documentation above
4. Create GitHub issue with error logs and steps to reproduce
