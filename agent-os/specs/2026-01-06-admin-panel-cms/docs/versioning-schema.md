# Survey Versioning Schema
## Database Schema and Workflow Diagrams

**Version**: 1.0
**Date**: 2026-01-09
**Purpose**: Explain survey versioning architecture and workflows

---

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Entity Relationships](#entity-relationships)
4. [Versioning Workflows](#versioning-workflows)
5. [Version Lifecycle](#version-lifecycle)
6. [Session Isolation](#session-isolation)
7. [Examples](#examples)

---

## Overview

### What is Survey Versioning?

Survey versioning is a system that allows administrators to edit surveys without breaking active user sessions. When a survey is edited, a new version is created, ensuring that:

- ✅ Users in active sessions continue seeing the survey version they started with
- ✅ New users see the latest published version
- ✅ No data loss or session corruption during updates

**Key Principle**: **Each survey session is tied to a specific survey version**, not to the survey itself.

---

## Database Schema

### Tables Involved

#### 1. `surveys` Table (Master Record)

Represents the high-level survey entity. Does not contain the actual survey structure.

```sql
CREATE TABLE surveys (
  id                          SERIAL PRIMARY KEY,
  type                        VARCHAR(50) NOT NULL,  -- 'EXPRESS' or 'FULL'
  name                        VARCHAR(255) NOT NULL,
  structure                   JSONB,                 -- DEPRECATED: Use survey_versions instead
  latest_published_version_id INT,                   -- FK to survey_versions
  deleted_at                  TIMESTAMP,             -- Soft delete
  UNIQUE(type),
  FOREIGN KEY (latest_published_version_id) REFERENCES survey_versions(id) ON DELETE SET NULL
);
```

**Key Fields:**
- `latest_published_version_id`: Points to the currently published version
- `deleted_at`: Soft delete (survey hidden but not removed)
- `structure`: Deprecated field (kept for backwards compatibility)

---

#### 2. `survey_versions` Table (Editable Versions)

Stores all versions of a survey. This is where actual survey content lives.

```sql
CREATE TABLE survey_versions (
  id             SERIAL PRIMARY KEY,
  survey_id      INT NOT NULL,                      -- FK to surveys
  version        INT NOT NULL,                      -- Version number (1, 2, 3, ...)
  name           VARCHAR(255) NOT NULL,             -- Survey name
  type           VARCHAR(50) NOT NULL,              -- 'EXPRESS' or 'FULL'
  structure      JSONB NOT NULL,                    -- Survey content (categories, questions, etc.)
  status         VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'PUBLISHED', 'ARCHIVED'
  published_at   TIMESTAMP,                         -- When this version was published
  created_by_id  INT,                               -- FK to admins (who created this version)
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_id) REFERENCES admins(id) ON DELETE SET NULL,
  UNIQUE (survey_id, version)
);

CREATE INDEX idx_survey_versions_survey_id ON survey_versions(survey_id);
CREATE INDEX idx_survey_versions_status ON survey_versions(status);
CREATE INDEX idx_survey_versions_published_at ON survey_versions(published_at);
CREATE INDEX idx_survey_versions_structure_gin ON survey_versions USING GIN(structure); -- For JSONB queries
```

**Key Fields:**
- `version`: Auto-incremented per survey (1 for first version, 2 for second, etc.)
- `status`: Lifecycle state (DRAFT → PUBLISHED → ARCHIVED)
- `structure`: JSONB containing full survey structure
- `published_at`: Timestamp when version was made public

---

#### 3. `survey_sessions` Table (User Sessions)

Tracks user sessions and which version they're using.

```sql
CREATE TABLE survey_sessions (
  id                CHAR(36) PRIMARY KEY,          -- UUID
  survey_id         INT NOT NULL,                  -- FK to surveys
  survey_version_id INT NOT NULL,                  -- FK to survey_versions (CRITICAL)
  user_id           INT,                           -- FK to users
  started_at        TIMESTAMP DEFAULT NOW(),
  completed_at      TIMESTAMP,
  status            VARCHAR(50) DEFAULT 'IN_PROGRESS',

  FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
  FOREIGN KEY (survey_version_id) REFERENCES survey_versions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_survey_sessions_survey_version_id ON survey_sessions(survey_version_id);
CREATE INDEX idx_survey_sessions_user_id ON survey_sessions(user_id);
CREATE INDEX idx_survey_sessions_status ON survey_sessions(status);
```

**Key Field:**
- `survey_version_id`: **Critical for version isolation** - locks session to specific version

---

#### 4. `admins` Table (Administrator Management)

Tracks who can access the admin panel.

```sql
CREATE TABLE admins (
  id                SERIAL PRIMARY KEY,
  telegram_username VARCHAR(255) UNIQUE NOT NULL,  -- Telegram @username (without @)
  created_by_id     INT,                           -- FK to admins (self-reference)
  created_at        TIMESTAMP DEFAULT NOW(),

  FOREIGN KEY (created_by_id) REFERENCES admins(id) ON DELETE SET NULL
);

CREATE INDEX idx_admins_telegram_username ON admins(telegram_username);
```

**Bootstrap:**
- First admin has `created_by_id = NULL` (created by system)
- Subsequent admins have `created_by_id` pointing to who added them

---

## Entity Relationships

### ER Diagram

```
┌─────────────────┐
│     surveys     │
│─────────────────│
│ id (PK)         │
│ type            │◄─────────┐
│ name            │          │
│ latest_pub...   │──┐       │
│ deleted_at      │  │       │
└─────────────────┘  │       │
                     │       │
                     ▼       │
          ┌──────────────────────────┐
          │   survey_versions        │
          │──────────────────────────│
          │ id (PK)                  │
          │ survey_id (FK) ──────────┘
          │ version                  │
          │ name                     │
          │ type                     │
          │ structure (JSONB)        │
          │ status                   │
          │ published_at             │
          │ created_by_id (FK) ──────┐
          └──────────────────────────┘
                     ▲                │
                     │                │
                     │                ▼
          ┌──────────────────┐  ┌──────────┐
          │ survey_sessions  │  │  admins  │
          │──────────────────│  │──────────│
          │ id (PK)          │  │ id (PK)  │
          │ survey_id (FK)   │  │ telegram │
          │ survey_version_id│  │  _username│
          │ user_id (FK)     │  │ created  │
          │ started_at       │  │  _by_id  │
          │ status           │  └──────────┘
          └──────────────────┘       ▲
                     │               │
                     │               │ (self-reference)
                     ▼               │
          ┌──────────────────┐       │
          │      users       │       │
          │──────────────────│       │
          │ id (PK)          │       │
          │ telegram_id      │       │
          │ username         │       │
          └──────────────────┘       │
                                     │
                                     └─────────┐
                                               ▼
                                         (created_by_id)
```

### Relationship Summary

| Relationship | Cardinality | Description |
|--------------|-------------|-------------|
| `surveys` → `survey_versions` | 1:N | One survey has many versions |
| `surveys` → `survey_versions` | N:1 | latest_published_version_id points to one version |
| `survey_versions` → `survey_sessions` | 1:N | One version can be used by many sessions |
| `survey_versions` → `admins` | N:1 | Each version created by one admin |
| `admins` → `admins` | N:1 | Self-reference (who added this admin) |

---

## Versioning Workflows

### Workflow 1: Create New Survey

```
┌─────────────┐
│ Admin Panel │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 1. Admin creates new Survey Version  │
│    - survey_id: references surveys   │
│    - version: 1                      │
│    - status: DRAFT                   │
│    - structure: {...}                │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 2. Admin edits structure in DRAFT    │
│    (can edit freely, no users see)   │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 3. Admin publishes version           │
│    - status: PUBLISHED               │
│    - published_at: NOW()             │
│    - surveys.latest_published...: id│
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│ 4. New users start sessions          │
│    - survey_version_id = published   │
└──────────────────────────────────────┘
```

**Database Changes:**

**Step 1: Create Survey + Version**
```sql
-- Insert master survey record
INSERT INTO surveys (type, name) VALUES ('EXPRESS', 'Express Survey');
-- Returns survey_id = 1

-- Insert first version
INSERT INTO survey_versions (
  survey_id, version, name, type, structure, status, created_by_id
) VALUES (
  1, 1, 'Express Survey v1', 'EXPRESS', '{"categories": [...]}', 'DRAFT', 10
);
-- Returns id = 1
```

**Step 3: Publish Version**
```sql
-- Update version status
UPDATE survey_versions
SET status = 'PUBLISHED', published_at = NOW()
WHERE id = 1;

-- Update master survey latest pointer
UPDATE surveys
SET latest_published_version_id = 1
WHERE id = 1;
```

**Step 4: Create Session**
```sql
-- Get latest published version ID
SELECT latest_published_version_id FROM surveys WHERE type = 'EXPRESS';
-- Returns: 1

-- Create session
INSERT INTO survey_sessions (
  id, survey_id, survey_version_id, user_id
) VALUES (
  'uuid-abc', 1, 1, 42
);
```

---

### Workflow 2: Edit Published Survey (Version Isolation)

```
┌───────────────────────────────────────┐
│ BEFORE EDIT                           │
│ Version 1: PUBLISHED                  │
│ Active Users: 100 (using version 1)   │
└───────────────────────────────────────┘
              │
              ▼
┌───────────────────────────────────────┐
│ 1. Admin clicks "Create new version"  │
│    - Clones version 1 → version 2     │
│    - version 2 status: DRAFT          │
└──────┬────────────────────────────────┘
       │
       ▼
┌───────────────────────────────────────┐
│ 2. Admin edits version 2 (DRAFT)      │
│    (100 active users still see v1)    │
└──────┬────────────────────────────────┘
       │
       ▼
┌───────────────────────────────────────┐
│ 3. Admin publishes version 2          │
│    - status: PUBLISHED                │
│    - surveys.latest_pub...: 2         │
└──────┬────────────────────────────────┘
       │
       ▼
┌───────────────────────────────────────┐
│ AFTER PUBLISH                         │
│ Version 1: PUBLISHED (100 old users)  │
│ Version 2: PUBLISHED (new users)      │
└───────────────────────────────────────┘
```

**Database State:**

**Before Edit:**
```sql
-- surveys
id | type    | latest_published_version_id
1  | EXPRESS | 1

-- survey_versions
id | survey_id | version | status    | published_at
1  | 1         | 1       | PUBLISHED | 2026-01-01

-- survey_sessions
id    | survey_version_id | user_id | status
abc1  | 1                 | 10      | IN_PROGRESS  (100 users)
```

**After Create New Version (Step 1):**
```sql
-- survey_versions
id | survey_id | version | status    | published_at
1  | 1         | 1       | PUBLISHED | 2026-01-01
2  | 1         | 2       | DRAFT     | NULL
```

**After Publish Version 2 (Step 3):**
```sql
-- surveys
id | type    | latest_published_version_id
1  | EXPRESS | 2  -- Updated to version 2

-- survey_versions
id | survey_id | version | status    | published_at
1  | 1         | 1       | PUBLISHED | 2026-01-01
2  | 1         | 2       | PUBLISHED | 2026-01-09  -- New

-- survey_sessions
id    | survey_version_id | user_id | status
abc1  | 1                 | 10      | IN_PROGRESS  (old users, still version 1)
xyz1  | 2                 | 50      | IN_PROGRESS  (new users, version 2)
```

**Result:**
- Old users (100) continue with version 1
- New users start with version 2
- **No breaking changes for active sessions**

---

### Workflow 3: Unpublish Version

```
┌───────────────────────────────────────┐
│ Version 3: PUBLISHED                  │
│ Active Users: 50                      │
└──────┬────────────────────────────────┘
       │
       ▼
┌───────────────────────────────────────┐
│ Admin clicks "Unpublish version"      │
│ - status: ARCHIVED                    │
│ - published_at: unchanged             │
└──────┬────────────────────────────────┘
       │
       ▼
┌───────────────────────────────────────┐
│ Version 3: ARCHIVED                   │
│ Active Users: 50 (can still finish)   │
│ New Users: Cannot start this version  │
└───────────────────────────────────────┘
```

**Database Changes:**
```sql
-- Unpublish version
UPDATE survey_versions
SET status = 'ARCHIVED'
WHERE id = 3;

-- Note: surveys.latest_published_version_id NOT updated
-- New users get 404 (no published version)
```

**Effect:**
- Existing sessions continue (survey_version_id = 3 still valid)
- New sessions cannot be created (no PUBLISHED version)
- Admin must publish a new version for new users

---

## Version Lifecycle

### Status Transitions

```
┌───────────┐
│   DRAFT   │  ← Created by admin
└─────┬─────┘
      │ publish()
      ▼
┌───────────┐
│ PUBLISHED │  ← Visible to new users
└─────┬─────┘
      │ unpublish()
      ▼
┌───────────┐
│ ARCHIVED  │  ← Hidden from new users, old sessions continue
└───────────┘
```

**Valid Transitions:**
- DRAFT → PUBLISHED ✅
- PUBLISHED → ARCHIVED ✅
- DRAFT → ARCHIVED ✅ (discard draft)
- ARCHIVED → PUBLISHED ❌ (create new version instead)

**Business Rules:**
1. Only ONE version can be PUBLISHED per survey at a time
2. Cannot unpublish if no other version is PUBLISHED (would leave users with no survey)
3. Cannot delete version if active sessions reference it

---

## Session Isolation

### How It Works

**Scenario Timeline:**

| Time | Event | Version 1 | Version 2 | User A Session | User B Session |
|------|-------|-----------|-----------|----------------|----------------|
| T0 | Admin publishes v1 | PUBLISHED | - | - | - |
| T1 | User A starts | PUBLISHED | - | survey_version_id=1 | - |
| T2 | Admin creates v2 | PUBLISHED | DRAFT | survey_version_id=1 | - |
| T3 | Admin publishes v2 | PUBLISHED | PUBLISHED | survey_version_id=1 | - |
| T4 | User B starts | PUBLISHED | PUBLISHED | survey_version_id=1 | survey_version_id=2 |
| T5 | Both users continue | PUBLISHED | PUBLISHED | Uses v1 structure | Uses v2 structure |

**Key Points:**
- ✅ User A's session **locked to version 1** via `survey_version_id`
- ✅ User B's session **locked to version 2** via `survey_version_id`
- ✅ Both sessions can coexist without interference

---

### Code Implementation

**Get Survey Structure for Session:**
```typescript
async getSessionSurvey(sessionId: string): Promise<SurveyStructure> {
  const session = await this.sessionsRepository.findOne({
    where: { id: sessionId },
    relations: ['surveyVersion']
  });

  // Return structure from session's specific version
  return session.surveyVersion.structure;
}
```

**No version mixing:**
- Session reads structure from its own `survey_version_id`
- Admin changes to other versions do NOT affect this session

---

## Examples

### Example 1: Normal Editing Flow

**Initial State:**
- Survey ID 1 (EXPRESS)
- Version 1 (PUBLISHED)

**Admin Actions:**
1. Open Version 1 in AdminJS
2. Click "Create new version" → Version 2 (DRAFT) created
3. Edit Version 2 structure
4. Click "Publish version" → Version 2 (PUBLISHED)
5. surveys.latest_published_version_id = 2

**User Impact:**
- Old sessions: Still use Version 1
- New sessions: Use Version 2

---

### Example 2: Multiple Drafts

**Initial State:**
- Survey ID 1 (EXPRESS)
- Version 1 (PUBLISHED)

**Admin Actions:**
1. Create Version 2 (DRAFT) - testing new questions
2. Create Version 3 (DRAFT) - different approach
3. Edit and finalize Version 3
4. Publish Version 3
5. Discard Version 2 (change status to ARCHIVED)

**Result:**
- Version 1: PUBLISHED (old users)
- Version 2: ARCHIVED (discarded draft)
- Version 3: PUBLISHED (new users)

---

### Example 3: Emergency Rollback

**Problem**: Published Version 3 has a critical bug.

**Solution:**
1. Unpublish Version 3 → status = ARCHIVED
2. Find Version 2 (previous working version)
3. Create new Version 4 from Version 2
4. Publish Version 4

**Why not re-publish Version 2?**
- Versions are immutable once published
- Creating new version maintains audit trail

---

## Summary

**Key Concepts:**
1. **surveys**: Master record, points to latest published version
2. **survey_versions**: All versions of a survey, including drafts
3. **survey_sessions**: Locked to specific version via `survey_version_id`
4. **Version Isolation**: Users always see the version they started with

**Benefits:**
- ✅ No breaking changes for active users
- ✅ Safe editing without affecting production
- ✅ Full audit trail (who created, when published)
- ✅ Easy rollback (create new version from old)

**Trade-offs:**
- ⚠️ More complex than direct editing
- ⚠️ Storage overhead (multiple versions stored)
- ⚠️ Admin must understand versioning workflow

---

## Related Documentation

- **Admin Guide**: `admin-guide.md` - How admins use versioning
- **API Documentation**: `api-documentation.md` - API endpoints for versioning
- **Spec**: `../spec.md` - Original requirements

---

**Schema Version**: 1.0
**Last Updated**: 2026-01-09
**Database Migrations**: See `backend/src/migrations/`
