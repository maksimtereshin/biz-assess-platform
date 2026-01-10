# API Documentation - Admin Panel CMS
## Updated Endpoints for Survey Versioning

**Version**: 1.0
**Date**: 2026-01-09
**Changes**: Updated to support survey versioning

---

## Overview

This document describes the API endpoints that were **updated** as part of the Admin Panel CMS feature. These endpoints now work with the new survey versioning system (`survey_versions` table) instead of reading survey structure from static JSON files.

**Key Changes:**
1. `GET /api/surveys/:type/latest` now returns structure from `survey_versions` table
2. `POST /api/surveys/sessions` now saves `survey_version_id` to track which version the session uses

---

## Updated Endpoints

### 1. Get Latest Survey Structure

#### `GET /api/surveys/:type/latest`

Returns the latest PUBLISHED version of a survey by type.

**Purpose:**
- Used by frontend to fetch survey questions before starting a session
- Returns only PUBLISHED versions (status = 'PUBLISHED')
- Uses caching (TTL 5 minutes) for performance

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | Yes | Survey type: `EXPRESS` or `FULL` |

**Response:**

**Status Code**: `200 OK`

**Response Body:**
```json
{
  "id": 1,
  "type": "EXPRESS",
  "name": "Экспресс-диагностика бизнеса",
  "questions": [],
  "categories": [
    {
      "id": "cat-1",
      "name": "Маркетинг",
      "subcategories": [
        {
          "id": "subcat-1",
          "name": "Позиционирование",
          "questions": [
            {
              "id": "q-1",
              "text": "Насколько чётко определена целевая аудитория?",
              "category": "Маркетинг",
              "subcategory": "Позиционирование",
              "type": "scale",
              "answerOptions": [
                {
                  "id": 1,
                  "text": "Не определена",
                  "value": 1,
                  "color": "#ef4444",
                  "range": "1-3"
                },
                {
                  "id": 2,
                  "text": "Частично определена",
                  "value": 4,
                  "color": "#f59e0b",
                  "range": "4-7"
                },
                {
                  "id": 3,
                  "text": "Чётко определена",
                  "value": 8,
                  "color": "#10b981",
                  "range": "8-10"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Survey ID (from `surveys` table) |
| `type` | string | Survey type (EXPRESS / FULL) |
| `name` | string | Survey name |
| `questions` | array | Top-level questions (usually empty, use categories) |
| `categories` | array | Survey categories with nested subcategories and questions |

**Error Responses:**

**404 Not Found** - No published version found for this survey type
```json
{
  "statusCode": 404,
  "message": "No published version found for survey type: EXPRESS",
  "error": "Not Found"
}
```

**Example Request:**
```bash
curl -X GET http://localhost:3001/api/surveys/EXPRESS/latest \
  -H "Authorization: Bearer <session_token>"
```

**Implementation Details:**
- **Source**: `backend/src/survey/survey.service.ts:getLatestPublishedVersion()`
- **Database Query**:
  ```sql
  SELECT sv.*
  FROM survey_versions sv
  JOIN surveys s ON s.id = sv.survey_id
  WHERE s.type = :type
    AND sv.status = 'PUBLISHED'
    AND s.deleted_at IS NULL
  ORDER BY sv.version DESC
  LIMIT 1
  ```
- **Caching**: Result cached for 5 minutes (TTL 300s)
- **Cache Invalidation**: When a new version is published

**Changes from v1.0:**
- ✅ Now reads from `survey_versions` table (not JSON files)
- ✅ Returns only PUBLISHED versions
- ✅ Includes caching for performance
- ✅ Returns version metadata (id, version number, published_at)

---

### 2. Create Survey Session

#### `POST /api/surveys/sessions`

Creates a new survey session for a user. Updated to save `survey_version_id` instead of just `survey_id`.

**Purpose:**
- Starts a new survey session for a user
- Saves which version of the survey the user is taking
- Ensures session isolation (users see the version they started with)

**Request Headers:**
| Header | Value | Required | Description |
|--------|-------|----------|-------------|
| `Authorization` | Bearer `<session_token>` | Yes | User session token |
| `Content-Type` | application/json | Yes | Request body format |

**Request Body:**
```json
{
  "surveyType": "EXPRESS",
  "telegramId": 123456789
}
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `surveyType` | string | Yes | Survey type: `EXPRESS` or `FULL` |
| `telegramId` | number | No | Telegram user ID (optional) |

**Response:**

**Status Code**: `201 Created`

**Response Body:**
```json
{
  "session": {
    "id": "abc123def456",
    "survey_id": 1,
    "survey_version_id": 3,
    "user_id": 42,
    "started_at": "2026-01-09T10:30:00.000Z",
    "status": "IN_PROGRESS"
  },
  "structure": {
    "id": 1,
    "type": "EXPRESS",
    "name": "Экспресс-диагностика бизнеса",
    "categories": [...]
  }
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `session.id` | string | Unique session ID (UUID) |
| `session.survey_id` | number | Survey ID (from `surveys` table) |
| `session.survey_version_id` | number | Survey Version ID (from `survey_versions` table) |
| `session.user_id` | number | User ID (if authenticated) |
| `session.started_at` | string | ISO 8601 timestamp |
| `session.status` | string | Session status (IN_PROGRESS / COMPLETED) |
| `structure` | object | Survey structure (same as GET /api/surveys/:type/latest) |

**Error Responses:**

**400 Bad Request** - Invalid survey type
```json
{
  "statusCode": 400,
  "message": "Invalid survey type. Must be EXPRESS or FULL",
  "error": "Bad Request"
}
```

**404 Not Found** - No published version available
```json
{
  "statusCode": 404,
  "message": "No published version found for survey type: EXPRESS",
  "error": "Not Found"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3001/api/surveys/sessions \
  -H "Authorization: Bearer <session_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "surveyType": "EXPRESS",
    "telegramId": 123456789
  }'
```

**Implementation Details:**
- **Source**: `backend/src/survey/survey.service.ts:createNewSession()`
- **Database Operations**:
  1. Get latest published version ID:
     ```sql
     SELECT latest_published_version_id FROM surveys WHERE type = :type
     ```
  2. Insert new session:
     ```sql
     INSERT INTO survey_sessions (
       id, survey_id, survey_version_id, user_id, started_at, status
     ) VALUES (...)
     ```
- **Session ID**: Generated using UUID v4
- **Isolation**: `survey_version_id` ensures user sees same version even if admin publishes new version

**Changes from v1.0:**
- ✅ Now saves `survey_version_id` (critical for version isolation)
- ✅ Uses `surveys.latest_published_version_id` to determine which version to use
- ✅ Session remains tied to specific version even after new versions published

---

## Versioning Behavior

### How Sessions Are Isolated

**Scenario:**
1. Admin publishes Survey Version 1 (PUBLISHED)
2. User A starts session → saves `survey_version_id = 1`
3. Admin edits survey → creates Version 2 (DRAFT)
4. Admin publishes Version 2 → `latest_published_version_id = 2`
5. User B starts session → saves `survey_version_id = 2`
6. User A continues session → still sees Version 1 (isolated)
7. User B sees Version 2

**Database State:**
```sql
-- surveys table
id | type    | latest_published_version_id
1  | EXPRESS | 2

-- survey_versions table
id | survey_id | version | status    | published_at
1  | 1         | 1       | PUBLISHED | 2026-01-01
2  | 1         | 2       | PUBLISHED | 2026-01-09

-- survey_sessions table
id    | survey_id | survey_version_id | user_id
abc1  | 1         | 1                 | 10      (User A - sees version 1)
abc2  | 1         | 2                 | 11      (User B - sees version 2)
```

**Result:**
- User A's session continues with Version 1
- User B's session uses Version 2
- No breaking changes for active users

---

## Caching Strategy

### Latest Published Version Cache

**Key**: `survey:latest_published:{type}`
**TTL**: 300 seconds (5 minutes)
**Backend**: In-memory cache (Node.js Map)

**Cache Hit:**
```typescript
const cacheKey = `survey:latest_published:${type}`;
const cached = cache.get(cacheKey);
if (cached && Date.now() < cached.expiresAt) {
  return cached.data;
}
```

**Cache Miss:**
```typescript
const version = await this.getLatestPublishedVersionFromDB(type);
cache.set(cacheKey, {
  data: version,
  expiresAt: Date.now() + 300000 // 5 minutes
});
return version;
```

**Cache Invalidation:**
When admin publishes new version:
```typescript
// In SurveyVersionService.publishVersion()
await this.surveyService.invalidateCache(surveyType);
```

**Performance Impact:**
- Cold start: ~200ms (database query)
- Warm cache: <10ms (in-memory lookup)
- Expected hit rate: >95% (most users request within 5 minutes)

---

## Migration Path

### For Existing Sessions

**Backwards Compatibility:**
Old sessions (before versioning) may have `survey_version_id = NULL`.

**Handling:**
```typescript
// In SurveyService.getSessionSurvey()
if (!session.survey_version_id) {
  // Fallback to latest published version
  const version = await this.getLatestPublishedVersion(session.survey.type);
  return version.structure;
}

// Normal case: use session's specific version
const version = await this.getVersionById(session.survey_version_id);
return version.structure;
```

**Migration Script:**
```sql
-- Fill survey_version_id for old sessions
UPDATE survey_sessions
SET survey_version_id = (
  SELECT latest_published_version_id
  FROM surveys
  WHERE surveys.id = survey_sessions.survey_id
)
WHERE survey_version_id IS NULL;
```

---

## Error Handling

### Common Error Scenarios

**1. No Published Version Available**
- **Cause**: Admin unpublished all versions or survey type doesn't exist
- **Response**: 404 Not Found
- **Frontend Action**: Show error message, suggest contacting support

**2. Version Deleted/Archived During Session**
- **Cause**: Admin archived version that user is actively using
- **Handling**: Session continues with archived version (not deleted)
- **Frontend Action**: No action needed (user can finish session)

**3. Invalid Survey Type**
- **Cause**: Frontend sent wrong survey type (not EXPRESS or FULL)
- **Response**: 400 Bad Request
- **Frontend Action**: Fix frontend validation

---

## Testing

### Example Test Cases

**Test 1: Get Latest Published Version**
```bash
# Given: Version 1 (PUBLISHED), Version 2 (DRAFT)
# When: GET /api/surveys/EXPRESS/latest
# Then: Returns Version 1 (not Version 2)

curl -X GET http://localhost:3001/api/surveys/EXPRESS/latest
```

**Test 2: Session Uses Correct Version**
```bash
# Given: Latest published version ID = 3
# When: POST /api/surveys/sessions
# Then: session.survey_version_id = 3

curl -X POST http://localhost:3001/api/surveys/sessions \
  -H "Content-Type: application/json" \
  -d '{"surveyType": "EXPRESS"}'
```

**Test 3: Session Isolation**
```bash
# Given: User A has session with survey_version_id = 1
# And: Admin publishes version 2
# When: User A continues session
# Then: User A still sees version 1

# User A continues (should see version 1)
curl -X GET http://localhost:3001/api/surveys/sessions/abc123
```

---

## Appendix: Related Documentation

- **Versioning Schema**: See `versioning-schema.md` for database schema details
- **Admin Guide**: See `admin-guide.md` for admin workflows
- **Migration Guide**: See `../../migrations/README.md` for database migration details

---

**API Version**: 1.0 (with versioning support)
**Last Updated**: 2026-01-09
**Breaking Changes**: None (backwards compatible)
