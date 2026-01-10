# Agent-OS MCP Integration Guide

This document maps which agents use which MCP servers, provides usage examples, and documents security guidelines for credential management.

## Table of Contents
1. [Agent MCP Tools Matrix](#agent-mcp-tools-matrix)
2. [Agent-Specific Integration Details](#agent-specific-integration-details)
3. [MCP Server Usage by Workflow Phase](#mcp-server-usage-by-workflow-phase)
4. [Security Guidelines](#security-guidelines)
5. [Troubleshooting](#troubleshooting)

---

## Agent MCP Tools Matrix

| Agent | Context7 | Playwright | IDE Diagnostics | PostgreSQL | Git | GitHub | File System | Memory | Docker | Sequential Thinking | Telegram MCP |
|-------|----------|------------|-----------------|------------|-----|--------|-------------|--------|--------|---------------------|--------------|
| **spec-initializer** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **spec-shaper** | ✅ (max 2) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔜 (optional) | ❌ |
| **spec-writer** | ✅ (max 3) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔜 (optional) | ❌ |
| **spec-verifier** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **tasks-list-creator** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 🔜 (optional) | ❌ |
| **implementer** | ✅ (max 3) | ✅ (mandatory for UI) | ✅ (mandatory) | 🔜 | 🔜 | 🔜 | 🔜 | 🔜 | ❌ | 🔜 (optional) | 🔜 (backend only) |
| **implementation-verifier** | ❌ | ✅ (mandatory) | ✅ (mandatory) | 🔜 | 🔜 | 🔜 | ❌ | 🔜 | ❌ | ❌ | 🔜 (backend only) |
| **product-planner** | ✅ (max 3) | ❌ | ❌ | ❌ | ❌ | 🔜 | ❌ | 🔜 | ❌ | ❌ | ❌ |

**Legend:**
- ✅ = Currently integrated with usage guidelines
- 🔜 = Planned integration (Tier 1/2/3 servers available but not yet added to agent)
- ❌ = Not applicable for this agent

---

## Agent-Specific Integration Details

### 1. spec-shaper

**MCP Tools:** Context7 (optional, max 2 queries)

**Purpose:** Research unfamiliar framework patterns before asking user questions

**When Used:**
- Initial idea mentions unfamiliar framework feature
- Need to validate if framework capability exists before asking user
- Understanding framework limitations to inform questions

**Example Usage:**
```markdown
Step 2.5: Research Framework Patterns (Optional, Max 2 Queries)

User wants: "Add real-time notifications to dashboard"

Agent Process:
1. Check agent-os/product/tech-stack.md → Finds: NestJS 10, React 18
2. Query Context7 (1/2):
   - resolve-library-id("nestjs")
   - query-docs("/nestjs/nestjs", "Real-time WebSocket support and best practices")
3. Learns: NestJS supports @nestjs/websockets with Socket.io or ws
4. Uses findings in questions to user:
   "I assume we'll use WebSockets for real-time notifications (NestJS has built-in support).
    Should we use Socket.io or native ws library?"
```

**See:** [spec-shaper.md:55-78](.claude/agents/agent-os/spec-shaper.md#L55-L78)

---

### 2. spec-writer

**MCP Tools:** Context7 (optional, max 3 queries)

**Purpose:** Query framework documentation for unfamiliar patterns or APIs needed by the feature

**When Used:**
- Unfamiliar framework API or pattern required by the feature
- Need to verify if a framework capability exists
- Understanding framework-specific best practices for this feature
- Checking latest framework version capabilities

**Example Usage:**
```markdown
Step 2.5: Query Framework Documentation (Optional, Max 3 Queries)

Requirements call for: "JWT authentication with role-based guards"

Agent Process:
1. Search existing codebase for auth patterns → Finds basic auth but no guards
2. Query Context7 (1/3):
   - resolve-library-id("nestjs")
   - query-docs("/nestjs/nestjs", "JWT authentication guard implementation with role-based access control")
3. Learns: @UseGuards(JwtAuthGuard), @Roles() decorator pattern
4. Documents in spec.md under "Technical Approach (Optional)":

   ## Technical Approach
   **Framework Pattern: NestJS JWT Guards with Role Decorators**
   - Use @nestjs/jwt with PassportStrategy for JWT validation
   - Implement custom RolesGuard to check user roles from JWT payload
   - Apply @UseGuards(JwtAuthGuard, RolesGuard) to protected routes
   - Reference: Official NestJS authentication docs
```

**See:** [spec-writer.md:57-82](.claude/agents/agent-os/spec-writer.md#L57-L82)

---

### 3. product-planner

**MCP Tools:** Context7 (optional, max 3 queries)

**Purpose:** Validate that the planned tech stack supports features in the roadmap

**When Used:**
- Roadmap features require unfamiliar framework capabilities
- Need to confirm a framework feature exists before committing to roadmap
- Understanding framework version requirements for planned features
- Validating integration capabilities between frameworks

**Example Usage:**
```markdown
Step 3.5: Validate Tech Stack Capabilities (Optional, Max 3 Queries)

Roadmap includes: "Real-time collaborative editing"

Agent Process:
1. Review roadmap → Feature: "Real-time collaborative editing" (Week 8)
2. Query Context7 (1/3):
   - resolve-library-id("react")
   - query-docs("/facebook/react", "Real-time collaborative editing libraries and patterns for React 18")
3. Query Context7 (2/3):
   - resolve-library-id("nestjs")
   - query-docs("/nestjs/nestjs", "WebSocket integration for collaborative real-time features")
4. Documents in tech-stack.md:

   ### Real-Time Capabilities
   - **Frontend:** React 18 with Zustand for state management
   - **Backend:** NestJS @nestjs/websockets with Socket.io
   - **Collaboration Library:** Yjs or ShareDB (TBD)
   - **Version Requirements:** NestJS 10+, Socket.io 4.5+
   - **Setup Prerequisites:** Redis for Socket.io adapter in production
```

**See:** [product-planner.md:159-187](.claude/agents/agent-os/product-planner.md#L159-L187)

---

### 4. implementer

**MCP Tools:** Context7 (optional, max 3), Playwright (mandatory for UI), IDE Diagnostics (mandatory)

**Purpose:** Implement features with framework best practices, browser testing, and code quality verification

**When Used:**
- **Context7:** Unfamiliar framework APIs during implementation
- **Playwright:** ALL UI tasks for user flow testing and screenshots
- **IDE Diagnostics:** ALL tasks to check for type errors before marking complete

**Example Usage:**

#### Context7 Usage:
```markdown
Step 3.5: Code Quality Verification - Context7 Queries (optional, max 3)

Task: Implement TypeORM migration with foreign key constraints

Agent Process:
1. Attempt to write migration → Uncertain about TypeORM syntax for onDelete cascade
2. Query Context7 (1/3):
   - resolve-library-id("typeorm")
   - query-docs("/typeorm/typeorm", "Foreign key constraint syntax with onDelete cascade in migrations")
3. Learns: Use .onDelete("CASCADE") in migration file
4. Implements correctly:
   await queryRunner.createForeignKey("reports", new TableForeignKey({
     columnNames: ["user_id"],
     referencedColumnNames: ["id"],
     referencedTableName: "users",
     onDelete: "CASCADE"
   }))
```

#### Playwright Usage (Mandatory for UI):
```markdown
Step 3.5: Code Quality Verification - Playwright Testing (mandatory for UI)

Task: Implement survey selection screen

Agent Process:
1. Implement SurveySelectionScreen.tsx component
2. Run IDE diagnostics → Fix type errors
3. Use Playwright (MANDATORY):
   - Navigate to http://localhost:3000
   - Click "Express Survey" button
   - Verify navigation to /express/:sessionId
   - Take screenshot → survey-selection-initial-20260106.png
   - Click "Full Survey" button
   - Verify navigation to /full/:sessionId
   - Take screenshot → survey-selection-full-selected-20260106.png
4. Store screenshots in agent-os/specs/[spec]/verification/screenshots/
5. Compare against mockup in planning/visuals/survey-selection-mockup.png
6. Document any visual differences
```

#### IDE Diagnostics Usage (Mandatory):
```markdown
Step 3.5: Code Quality Verification - IDE Diagnostics (mandatory)

Task: Implement UserController.ts

Agent Process:
1. Write UserController.ts code
2. Run IDE diagnostics (MANDATORY):
   mcp__ide__getDiagnostics({ files: ["backend/src/api/user.controller.ts"] })
3. Results: 3 type errors found
   - Error 1: Property 'email' does not exist on type 'User'
   - Error 2: Cannot find name 'validateEmail'
   - Error 3: Type 'string | undefined' is not assignable to type 'string'
4. Fix all 3 critical errors
5. Re-run IDE diagnostics → Clean (0 errors)
6. Mark task complete
```

**See:** [implementer.md:18-22](.claude/agents/agent-os/implementer.md#L18-L22)

---

### 5. implementation-verifier

**MCP Tools:** Playwright (mandatory), IDE Diagnostics (mandatory)

**Purpose:** Verify implementation quality with automated diagnostics and visual regression testing

**When Used:**
- **IDE Diagnostics:** ALWAYS run on entire codebase during verification
- **Playwright:** ALWAYS for UI changes - visual regression testing against mockups

**Example Usage:**

#### IDE Diagnostics (Mandatory):
```markdown
Step 3.5: Automated Code Quality Check (MANDATORY)

Process:
1. Run IDE diagnostics on entire codebase:
   mcp__ide__getDiagnostics({ files: ["backend/src/**/*.ts", "frontend/src/**/*.ts"] })
2. Count errors by severity:
   - Critical: 2 (type errors in SurveyController.ts, AuthGuard.ts)
   - High: 5 (ESLint errors)
   - Medium: 12 (warnings)
3. Document in verification report:

   ## 5. Code Quality Check (IDE Diagnostics)
   **Status:** ⚠️ Warnings

   ### Diagnostics Summary
   - **Total Diagnostics:** 19
   - **Critical Errors:** 2 (type errors, syntax errors)
   - **High Priority:** 5 (ESLint errors, potential bugs)
   - **Medium Priority:** 12 (warnings)

   ### Critical Errors
   1. SurveyController.ts:45 - Property 'session' does not exist on type 'Request'
   2. AuthGuard.ts:23 - Cannot find name 'JwtPayload'
```

#### Playwright Visual Regression (Mandatory for UI):
```markdown
Step 4: Visual Regression Testing (if UI changes)

Process:
1. Check planning/visuals/ → Found: dashboard-mockup.png
2. Use Playwright to capture actual implementation:
   - Navigate to http://localhost:3000/dashboard
   - Wait for data to load
   - Take screenshot → dashboard-actual-20260106.png
3. Compare screenshots:
   - Layout: ✅ Matches mockup
   - Colors: ⚠️ Button color differs (#007bff vs #0056b3 in mockup)
   - Typography: ✅ Matches
   - Spacing: ✅ Matches
4. Document in verification report:

   ## 6. Visual Regression Testing
   **Status:** ⚠️ Minor Differences

   ### UI Components Tested
   - Dashboard layout
   - Survey cards grid
   - Navigation header

   ### Visual Differences
   **Layout:** ✅ Matches
   **Colors:** ⚠️ Primary button color: actual #007bff, mockup #0056b3
   **Typography:** ✅ Matches
   **Spacing:** ✅ Matches

   ### Recommendation
   Update mockup to reflect actual brand color or adjust button theme.
```

**See:** [implementation-verifier.md:47-82](.claude/agents/agent-os/implementation-verifier.md#L47-L82)

---

### 6. spec-shaper (Optional - Sequential Thinking)

**MCP Tools:** Sequential Thinking (optional)

**Purpose:** Enhanced requirement gathering with systematic questioning

**When Used:**
- Complex features with many edge cases
- Features requiring careful constraint analysis
- Multi-stakeholder requirements
- Unclear implementation dependencies

**Example Usage:**
```markdown
Step 2.5 (Optional): Use Sequential Thinking for Complex Requirement Analysis

Feature Request: "Add real-time collaborative editing to survey builder"

Agent Process with Sequential Thinking:
1. Decompose problem systematically:
   - Step 1: Identify core collaborative features
   - Step 2: Map user scenarios and conflicts
   - Step 3: Analyze technical constraints
   - Step 4: Prioritize MVP vs future features

2. Generate targeted questions based on systematic analysis:
   Q1: I assume we need operational transformation or CRDT. Which approach fits your tech stack (NestJS + React)?
   Q2: Should multiple users edit the same question simultaneously, or lock-based editing?
   Q3: What's the acceptable latency for updates (100ms, 500ms, 1s)?

3. Document reasoning steps in requirements.md for spec-writer reference
```

**When NOT to Use:**
- Simple feature additions (new button, field, etc.)
- Well-defined requirements from user
- Features similar to existing implementations

---

### 7. task-list-creator (Optional - Sequential Thinking)

**MCP Tools:** Sequential Thinking (optional)

**Purpose:** Improved dependency analysis and task ordering

**When Used:**
- Complex features with intricate dependencies
- Multi-phase implementations spanning backend and frontend
- Unclear optimal implementation order
- Features requiring careful state management

**Example Usage:**
```markdown
Step: Use Sequential Thinking for Task Dependency Analysis

Feature: "Real-time collaborative editing with conflict resolution"

Agent Process with Sequential Thinking:
1. Systematic dependency mapping:
   - Step 1: Identify foundational requirements (WebSocket infrastructure)
   - Step 2: Map data flow (client → server → broadcast → clients)
   - Step 3: Determine critical path (infrastructure → state sync → UI)
   - Step 4: Identify parallel workstreams (backend + frontend)

2. Generate optimized task order:
   - Group 1: WebSocket Infrastructure (backend only, 0 dependencies)
   - Group 2: State Synchronization Logic (depends on Group 1)
   - Group 3: Conflict Resolution (depends on Group 2)
   - Group 4: Frontend Real-time Updates (depends on Group 1, parallel with 2-3)
   - Group 5: UI Conflict Indicators (depends on Group 3 + 4)

3. Document reasoning for complex ordering decisions
```

**When NOT to Use:**
- Straightforward CRUD features
- Single-layer implementations (frontend-only or backend-only)
- Features with obvious linear dependencies

---

### 8. implementer (Optional - Telegram MCP for Backend)

**MCP Tools:** Telegram MCP (optional, backend only)

**Purpose:** Test Telegram bot commands during development

**When Used:**
- Implementing Telegram bot features
- Testing bot command responses
- Validating inline keyboard logic
- Verifying message formatting (HTML, Markdown)

**Example Usage:**
```markdown
Step 3.5 (Optional): Test Telegram Bot with MCP

Task: Implement new `/survey` command that shows survey selection inline keyboard

Agent Process with Telegram MCP:
1. Implement command handler in TelegramService
2. Add inline keyboard with survey options
3. Test bot command WITHOUT ngrok using Telegram MCP:
   telegram_send_message({
     chat_id: "<test-user-id>",
     text: "/survey"
   })
4. Verify bot response:
   - Message text correct
   - Inline keyboard shows "Express" and "Full" buttons
   - Buttons have proper callback_data
5. Test keyboard interaction:
   telegram_click_button({
     message_id: "<response-id>",
     callback_data: "survey_express"
   })
6. Verify navigation to survey flow
7. Document test results in implementation notes
```

**When NOT to Use:**
- Frontend-only features
- Features not involving bot commands or messages
- Full WebApp testing (requires manual Telegram testing)
- Payment flow validation (use manual testing)

**Limitations:**
- Cannot test Telegram WebApp initData validation
- Cannot simulate payment invoices
- Requires development bot token
- Limited to Bot API capabilities

---

### 9. implementation-verifier (Optional - Telegram MCP for Backend)

**MCP Tools:** Telegram MCP (optional, backend only)

**Purpose:** Verify Telegram bot implementation

**When Used:**
- Verifying bot command implementations
- Validating message formats
- Testing keyboard interactions
- Ensuring bot responses match specifications

**Example Usage:**
```markdown
Step 4 (Optional): Automated Telegram Bot Verification

Spec: Implement `/help` command with categorized commands

Verification Process with Telegram MCP:
1. Send /help command:
   telegram_send_message({ text: "/help" })

2. Verify response message:
   expected_response = {
     text: Contains("Survey Commands", "/start", "/express", "/full"),
     format: "HTML",
     parse_mode: "HTML"
   }
   actual_response = telegram_get_last_message()

3. Document in verification report:
   ## Telegram Bot Verification
   **Command:** /help
   **Status:** ✅ Passed
   **Response Format:** HTML (correct)
   **Content:** All expected sections present
   **Inline Keyboards:** N/A

4. Test multiple bot scenarios:
   - /start → verify welcome message + keyboard
   - /reports → verify report list
   - Unknown command → verify help suggestion

5. Compare results to spec requirements
```

**When NOT to Use:**
- Frontend verification
- Features not involving bot
- WebApp-specific functionality

---

## MCP Server Usage by Workflow Phase

### Phase 1: Product Planning

```
/plan-product (product-planner)
     ↓
  Context7 (max 3 queries)
  - Validate tech stack supports roadmap features
  - Check framework version requirements
  - Confirm integration capabilities
```

**Example:** Validate that NestJS 10 supports WebSockets for real-time features planned in Week 8

---

### Phase 2: Specification

```
/shape-spec (spec-shaper) → /write-spec (spec-writer)
     ↓                              ↓
  Context7 (max 2)              Context7 (max 3)
  - Research framework          - Query unfamiliar APIs
    patterns before asking      - Verify framework capabilities
  - Suggest recommended         - Document technical approach
    approaches in questions       with official patterns
```

**Example Workflow:**
1. spec-shaper queries NestJS WebSocket patterns → Suggests Socket.io in questions to user
2. spec-writer queries TypeORM relationship syntax → Documents in spec.md "Technical Approach"

---

### Phase 3: Task Planning

```
/create-tasks (tasks-list-creator)
     ↓
  No MCP tools
  - Creates task groups with mandatory Playwright testing for UI
  - References MCP usage standards in constraints
```

**Output:** Tasks list includes "3.8 Browser acceptance testing (MANDATORY)" for UI task groups

---

### Phase 4: Implementation

```
/implement-tasks (implementer)
     ↓
  Context7 (max 3) + Playwright (mandatory for UI) + IDE Diagnostics (mandatory)

  1. Context7: Query unfamiliar framework APIs as needed
  2. Implement feature
  3. IDE Diagnostics: Check for type errors (MANDATORY)
  4. Playwright: Test user flows if UI (MANDATORY)
  5. Mark complete only if diagnostics clean
```

**Quality Gates:**
- ❌ Cannot mark complete with critical IDE errors
- ❌ Cannot mark UI tasks complete without Playwright testing
- ✅ Can proceed with warnings (documented)

---

### Phase 5: Verification

```
verify (implementation-verifier)
     ↓
  Playwright (mandatory) + IDE Diagnostics (mandatory)

  1. IDE Diagnostics: Run on entire codebase
  2. Playwright: Visual regression if UI changes
  3. Document findings in verification report
  4. Status: ✅ Passed | ⚠️ Passed with Issues | ❌ Failed
```

**Verification Report Includes:**
- IDE diagnostics summary with error counts
- Visual regression test results
- Screenshots comparison
- Recommendation for issues found

---

## Security Guidelines

### Credential Management

**DO:**
- ✅ Use `.env.mcp` for all MCP credentials (NOT in version control)
- ✅ Reference environment variables in `.mcp.json` using `${VAR_NAME}`
- ✅ Add `.env.mcp` and `.mcp.json.local` to `.gitignore`
- ✅ Use read-only PostgreSQL user for database MCP
- ✅ Use fine-grained GitHub tokens with minimum scopes
- ✅ Rotate tokens every 90 days

**DON'T:**
- ❌ Hardcode credentials in `.mcp.json`
- ❌ Commit `.env.mcp` to version control
- ❌ Share tokens across projects
- ❌ Grant write permissions to AI assistants (database)
- ❌ Use admin tokens when lower permissions work

### MCP Server Permissions

| MCP Server | Permissions | Security Notes |
|------------|-------------|----------------|
| PostgreSQL (DBHub) | SELECT only | Read-only user `readonly_claude` with CONNECTION LIMIT 5 |
| GitHub | repo, read:org, workflow | Fine-grained token, 90-day expiration |
| Git | Local repo operations | No credentials needed (uses local git) |
| Context7 | API key | Rate limited by Context7, no sensitive data access |
| Playwright | Browser automation | No credentials, runs locally |
| IDE Diagnostics | Local diagnostics | No credentials, reads local files only |
| File System | Read/write local files | Limited to project directory |
| Memory | Local storage | No credentials, stores in local database |
| Docker | Container management | Uses local Docker socket |

### Audit Logging

**Recommended (Future Enhancement):**
```bash
# Log all MCP credential access
echo "$(date): Context7 query by spec-writer" >> agent-os/logs/mcp-usage.log
```

**Track:**
- Context7 query counts per agent
- Playwright test execution times
- IDE diagnostics runs
- Failed MCP operations

---

## Troubleshooting

### Context7 Issues

**Problem:** Context7 query fails with authentication error

**Solution:**
1. Check `.env.mcp` → Verify `CONTEXT7_API_KEY` is set
2. Test API key: `curl -H "CONTEXT7_API_KEY: ${CONTEXT7_API_KEY}" https://mcp.context7.com/mcp`
3. If invalid, generate new key at https://context7.com
4. Update `.env.mcp` with new key

**Graceful Fallback:**
- Agent continues with existing knowledge
- Logs warning: "Context7 unavailable, using existing knowledge"
- Documents assumption in spec/implementation

---

### Playwright Issues

**Problem:** Playwright fails with "Browser not installed"

**Solution:**
```bash
# Run Playwright installation
npx @playwright/mcp@latest install
```

**Graceful Fallback:**
- Document need for manual testing
- Create TODO: "Manual testing required: [feature]"
- Describe expected user flows
- Mark verification as incomplete

---

### IDE Diagnostics Issues

**Problem:** IDE diagnostics fails or times out

**Solution:**
1. Try alternative: `cd backend && npm run lint`
2. Try alternative: `cd backend && npx tsc --noEmit`
3. Document alternative method used in report

**Graceful Fallback:**
- Use `npm run lint` or `tsc --noEmit`
- Document need for manual verification
- Create TODO: "Manual type check required"

---

### PostgreSQL MCP Issues

**Problem:** DBHub cannot connect to database

**Solution:**
1. Check PostgreSQL is running: `./dev.sh up` or `docker ps | grep postgres`
2. Verify connection string in `.env.mcp`
3. Test connection: `psql "${POSTGRES_CONNECTION_STRING}"`
4. Ensure `readonly_claude` user exists:
   ```sql
   SELECT usename FROM pg_user WHERE usename = 'readonly_claude';
   ```

**Graceful Fallback:**
- Use CLI: `./dev.sh db`
- Check existing TypeORM entities
- Review migration files
- Document schema assumptions

---

## Summary

### Quick Reference

**Agent MCP Usage:**
- **spec-shaper:** Context7 (max 2) for framework pattern research
- **spec-writer:** Context7 (max 3) for framework documentation queries
- **product-planner:** Context7 (max 3) for tech stack validation
- **implementer:** Context7 (max 3) + Playwright (mandatory UI) + IDE Diagnostics (mandatory)
- **implementation-verifier:** Playwright (mandatory) + IDE Diagnostics (mandatory)

**Mandatory vs Optional:**
- **Mandatory:** Playwright (UI tasks), IDE Diagnostics (all code changes)
- **Optional:** Context7 (with query limits)

**Security:**
- All credentials in `.env.mcp` (NOT version controlled)
- Environment variable references in `.mcp.json`
- Read-only database access
- Fine-grained token scopes

**Graceful Degradation:**
- All MCP tools have fallback behavior
- Document when MCP unavailable
- Use alternative tools (npm run lint, tsc, manual testing)

---

## Version History

- **v1.1 (2026-01-06):** Added Tier 3 MCP Tools (Sequential Thinking, Telegram)
  - Updated MCP tools matrix with Sequential Thinking and Telegram MCP columns
  - Added integration examples for spec-shaper (Sequential Thinking)
  - Added integration examples for task-list-creator (Sequential Thinking)
  - Added integration examples for implementer (Telegram MCP, backend only)
  - Added integration examples for implementation-verifier (Telegram MCP, backend only)
  - All Tier 3 integrations marked as optional with clear usage criteria

- **v1.0 (2026-01-06):** Initial Agent-OS MCP Integration Guide
  - Documented all agent MCP integrations
  - Created MCP tools matrix
  - Provided usage examples for each agent
  - Defined security guidelines
  - Established troubleshooting procedures
