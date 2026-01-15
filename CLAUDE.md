# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- NAUTEX_SECTION_START -->

# Nautex MCP Integration

This project uses Nautex Model-Context-Protocol (MCP). Nautex manages requirements and task-driven LLM assisted development.

Whenever user requests to operate with nautex, the following applies:

- read full Nautex workflow guidelines from `.nautex/CLAUDE.md`
- note that all paths managed by nautex are relative to the project root
- note primary workflow commands: `next_scope`, `tasks_update`
- NEVER edit files in `.nautex` directory

<!-- NAUTEX_SECTION_END -->

# MCP (Model Context Protocol) Integration

**Version:** v1.3 (2026-01-06)

This project uses MCP servers to enhance AI-assisted development workflow with database access, documentation queries, browser testing, and code quality checks.

**Integration Status:**
- ✅ Tier 1 (Essential): 6 servers - PostgreSQL, GitHub, Git, Context7, Playwright, IDE Diagnostics
- ✅ Tier 2 (High Value): 3 servers - File System, Memory, Docker
- ✅ Tier 3 (Optional): 2 servers - Sequential Thinking, Telegram Bot

## MCP Servers Configured

### Tier 1: Essential Development Tools

1. **PostgreSQL/Database (DBHub)** - Database schema inspection and query execution
2. **GitHub MCP** - Code review, issue management, PR workflows
3. **Git MCP** - Local repository management and automated commits
4. **Context7** - Up-to-date framework documentation (NestJS, React, TypeORM, etc.)
5. **Playwright** - Browser testing and visual verification (already configured)
6. **IDE Diagnostics** - TypeScript/ESLint error detection (already configured)

### Tier 2: Workflow Enhancement Tools

7. **File System MCP** - Monorepo-aware file operations
8. **Memory MCP** - Persistent project context and architectural decisions
9. **Docker MCP** - Container lifecycle management

### Tier 3: Advanced Capabilities (Optional)

10. **Sequential Thinking MCP** - Complex problem decomposition and multi-step reasoning
    - Use for: Complex spec decomposition, task dependency analysis, architectural decisions
    - Optional usage: Only for genuinely complex features requiring systematic breakdown
11. **Telegram MCP** - Telegram bot testing and command validation
    - Use for: Testing bot commands without ngrok, validating message formats, testing inline keyboards
    - Backend only: Limited to bot API capabilities, cannot test WebApp context or payments

## Setup Instructions

### Prerequisites

1. **PostgreSQL Read-Only User** (already created):
   - Username: `readonly_claude`
   - Password: `claude_readonly_2026`
   - Permissions: SELECT-only on all tables
   - Connection limit: 5 concurrent connections

2. **GitHub Personal Access Token**:
   - Generate at: https://github.com/settings/tokens?type=beta
   - Required scopes: `repo`, `read:org`, `workflow`
   - Set expiration: 90 days recommended

3. **Context7 API Key**:
   - Get your key from: https://context7.com
   - Free tier available for personal projects

### Configuration Files

1. **`.mcp.json`** (git-ignored, contains credentials):
   - Contains MCP server definitions with embedded credentials
   - **NEVER commit to version control** (already in .gitignore)
   - Located at project root
   - Credentials are embedded directly for simplicity

2. **`.mcp.json.example`** (version controlled, template):
   - Template file with placeholder credentials
   - Use this to set up MCP on a new machine
   - Copy to `.mcp.json` and replace placeholders

3. **`.env.mcp`** (optional, git-ignored):
   - Legacy file from initial setup
   - Can be kept as credential backup
   - Not actively used by MCP servers

### Setup on New Machine

To set up MCP servers on a new machine:

1. **Copy the template**:
   ```bash
   cp .mcp.json.example .mcp.json
   ```

2. **Edit `.mcp.json`** and replace placeholders:
   - `YOUR_CONTEXT7_API_KEY_HERE`: Get from https://context7.com
   - `YOUR_GITHUB_TOKEN_HERE`: Generate from GitHub settings (scopes: repo, read:org, workflow)
   - `YOUR_PASSWORD`: Use `claude_readonly_2026` (already configured)
   - `/absolute/path/to/your/project`: Your actual project path

3. **Restart Claude Code** to load the configuration

4. **Test connection** by running `/mcp` command

### Security Best Practices

1. **Never commit credentials**: `.mcp.json` is git-ignored (contains actual credentials)
2. **Use read-only database access**: `readonly_claude` user has SELECT-only permissions
3. **Rotate tokens regularly**: GitHub tokens should be rotated every 90 days
4. **Minimum token scopes**: Use fine-grained tokens with only required permissions
5. **Monitor usage**: Check for anomalies in MCP server usage
6. **Template file only**: Only `.mcp.json.example` (with placeholders) should be committed

## MCP Usage Guidelines

Detailed usage guidelines are documented in [`agent-os/standards/global/mcp-tools-usage.md`](agent-os/standards/global/mcp-tools-usage.md).

### Quick Reference

**When to Use MCP Tools:**

- **Context7**: Query unfamiliar framework APIs or patterns (max 3 queries per task group)
- **Playwright**: MANDATORY for all UI tasks - test user flows and take screenshots
- **IDE Diagnostics**: MANDATORY after code changes - fix critical errors before completing tasks
- **PostgreSQL**: Schema inspection, query building, data validation
- **Git/GitHub**: Repository management, commits, issue tracking

**Graceful Degradation:**

All MCP tools have fallback behavior:
- Context7 fails → Use existing knowledge and codebase patterns
- Playwright fails → Document need for manual testing
- IDE Diagnostics fails → Use `npm run lint` or `tsc --noEmit`
- PostgreSQL fails → Use CLI: `./dev.sh db`
- Git fails → Use Bash git commands

### Agent-OS Integration

MCP tools are integrated into agent-os workflow:

**Tier 1 & 2 (Standard):**
- **implementer**: Uses IDE diagnostics, Playwright (mandatory for UI), Context7 (optional)
- **implementation-verifier**: Uses IDE diagnostics and Playwright for systematic verification
- **spec-writer**: Uses Context7 for framework documentation queries
- **spec-shaper**: Uses Context7 for pattern research
- **product-planner**: Uses Context7 for tech stack validation

**Tier 3 (Optional):**
- **spec-shaper**: Can use Sequential Thinking for complex requirement analysis
- **spec-writer**: Can use Sequential Thinking for complex feature decomposition
- **task-list-creator**: Can use Sequential Thinking for dependency analysis
- **implementer (backend)**: Can use Telegram MCP for bot command testing
- **implementation-verifier (backend)**: Can use Telegram MCP for bot verification

**Detailed Integration Guide:** See [`agent-os/standards/global/agent-mcp-integration.md`](agent-os/standards/global/agent-mcp-integration.md) for:
- Agent MCP Tools Matrix (which agents use which tools, including Tier 3)
- Agent-specific usage examples and workflows
- MCP usage by workflow phase (product → spec → implement → verify)
- Security guidelines and troubleshooting

## Troubleshooting

### MCP Connection Issues

1. **PostgreSQL connection fails**:
   - Check Docker containers are running: `docker ps`
   - Verify database is accessible: `./dev.sh db`
   - Check connection string in `.mcp.json` (dbhub.args.dsn)

2. **GitHub/Context7 authentication fails**:
   - Verify API keys are correctly set in `.mcp.json`
   - Check token scopes and expiration (GitHub token needs: repo, read:org, workflow)
   - Regenerate tokens if needed and update `.mcp.json`

3. **MCP tools not available**:
   - Ensure `.mcp.json` exists at project root (not `.mcp.json.example`)
   - Verify credentials in `.mcp.json` are correct (not placeholders)
   - Restart Claude Code to reload configuration
   - Check for syntax errors in `.mcp.json` (must be valid JSON)

### Database Access

To verify PostgreSQL read-only user:
```bash
# Connect as readonly_claude
docker exec -it bizass-postgres-dev psql -U readonly_claude -d bizass_platform

# Test SELECT permission (should work)
SELECT * FROM users LIMIT 1;

# Test INSERT permission (should fail)
INSERT INTO users (telegram_id, username) VALUES (999, 'test');
-- ERROR: permission denied for table users
```

## Additional Resources

- [MCP Specification](https://modelcontextprotocol.io/specification/2025-11-25)
- [MCP Security Best Practices](https://modelcontextprotocol.io/specification/2025-06-18/basic/security_best_practices)
- [GitHub MCP Server Documentation](https://github.com/github/github-mcp-server)
- [Context7 Documentation](https://github.com/upstash/context7)
- [DBHub Documentation](https://github.com/bytebase/dbhub)

## Version History

- **v1.2 (2026-01-06)**: Agent-OS MCP integration complete
  - Integrated Context7 into spec-writer, spec-shaper, product-planner agents
  - Made Playwright and IDE Diagnostics mandatory in implementer and verifier
  - Updated tasks-list-creator with mandatory Playwright testing for UI tasks
  - Created comprehensive Agent-OS MCP Integration Guide
  - Documented MCP usage by workflow phase and agent-specific examples

- **v1.1 (2026-01-06)**: Simplified configuration with embedded credentials
  - Changed `.mcp.json` to use embedded credentials (simpler, no environment variable loading needed)
  - Added `.mcp.json` to `.gitignore` (contains secrets)
  - Created `.mcp.json.example` template (version controlled)
  - Updated documentation to reflect new approach

- **v1.0 (2026-01-06)**: Initial MCP integration
  - Configured Tier 1 servers: PostgreSQL, GitHub, Git, Context7, Playwright, IDE Diagnostics
  - Configured Tier 2 servers: File System, Memory, Docker
  - Created read-only PostgreSQL user `readonly_claude`
  - Created MCP usage standards document
  - Updated implementer and implementation-verifier agents
  - Documented setup instructions and troubleshooting

---

# Claude Code Hooks Configuration

**Version:** v1.0 (2026-01-06)

This project uses Claude Code hooks to automate quality enforcement, safety checks, and contextual assistance during development.

**Integration Status:**
- ✅ PostToolUse: Auto-formatting (Prettier)
- ✅ PreToolUse: Dangerous command validation
- ✅ SessionStart: Project context display
- ✅ UserPromptSubmit: Intelligent context injection
- ✅ Stop: Quality gate verification

## Configured Hooks

### 1. PostToolUse: Auto-Formatting

**Hook:** `.claude/hooks/auto-format.sh`
**Triggers:** After `Edit` or `Write` operations
**Purpose:** Automatically format TypeScript/JavaScript files using Prettier

**Behavior:**
- Runs Prettier on any `.ts`, `.tsx`, `.js`, `.jsx` files modified
- Ensures consistent code formatting across all implementations
- Non-blocking: formatting failures don't prevent operations
- Execution time: ~30ms per file

**Example:**
```typescript
// Before Edit operation:
const test={name:"John",age:30};

// After Edit operation (auto-formatted):
const test = { name: "John", age: 30 };
```

---

### 2. PreToolUse: Dangerous Command Validation

**Hook:** `.claude/hooks/validate-bash.py`
**Triggers:** Before `Bash` tool execution
**Purpose:** Block potentially destructive or dangerous bash commands

**Blocked Patterns:**
- `rm -rf /` - Destructive file operations on root
- `git push --force` - Force push operations
- `DROP DATABASE` - Database destruction
- `DELETE FROM table;` - DELETE without WHERE clause
- `chmod/chown` on root paths

**Behavior:**
- Analyzes command before execution
- Returns clear error message if dangerous pattern detected
- Safe commands pass through without delay
- Execution time: <5ms per command

**Example:**
```bash
# Blocked command:
$ rm -rf /tmp/*
❌ Blocked: Dangerous: rm -rf on root path - please use specific paths

# Safe command:
$ ls -la
✅ Allowed
```

---

### 3. SessionStart: Project Context Display

**Hook:** `.claude/hooks/session-start.sh`
**Triggers:** Once at the beginning of each Claude Code session
**Purpose:** Display comprehensive project context automatically

**Information Displayed:**
- 📁 Project name and architecture (Monorepo: backend, frontend, shared)
- 📊 Git status (branch, modified files count)
- 🐳 Running Docker containers
- 📝 Recent specs (from `agent-os/specs/`)
- 🤖 Agent-OS quick reference (commands, agents, standards, skills)
- 🔧 MCP tools status

**Example Output:**
```
🚀 Agent-OS Session Starting
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 Project: biz-assess-platform
🏗️  Architecture: Monorepo (backend, frontend, shared)

📊 Git Status:
   Branch: main
   Modified files: 15 files changed

🐳 Docker Containers:
   bizass-frontend-dev  Up 2 hours
   bizass-backend-dev   Up 2 hours (healthy)
   bizass-postgres-dev  Up 2 hours (healthy)

📝 Recent Specs:
   2025-10-20-fix-report-generation
   2025-10-13-results-feature

🔧 MCP Tools Status:
   ✓ MCP configured (.mcp.json found)

✨ Ready for implementation! 🎯
```

**Benefits:**
- Immediate awareness of project state
- No need to manually check git status, docker containers, etc.
- Quick reference to recent work and available tools

---

### 4. UserPromptSubmit: Intelligent Context Injection

**Hook:** `.claude/hooks/inject-context.sh`
**Triggers:** When user submits a prompt
**Purpose:** Automatically add relevant project context based on query keywords

**Context Detection:**

| Keywords | Context Provided |
|----------|-----------------|
| `spec`, `feature`, `task`, `implement` | Recent specs in `agent-os/specs/` |
| `database`, `migration`, `schema`, `model` | PostgreSQL MCP tools, DB CLI access |
| `test`, `playwright`, `browser`, `ui` | Playwright MCP (mandatory for UI), IDE diagnostics |
| `api`, `endpoint`, `route`, `controller` | Backend standards, NestJS docs via Context7 |
| `frontend`, `react`, `component` | Frontend stack, Tailwind CSS, Zustand stores |
| `docker`, `container`, `dev.sh` | Development environment commands |
| `telegram`, `bot`, `webhook` | Telegram bot module, testing options |
| `mcp`, `context7`, `tools` | MCP usage guidelines, query limits |

**Example:**
```
User: "I need to create a migration for users table"

💡 Context: Current specs in agent-os/specs/:
   2025-10-20-fix-report-generation
   2025-10-13-results-feature

💡 Context: Database operations available:
   - PostgreSQL MCP: mcp__dbhub__schema (inspect schema)
   - PostgreSQL MCP: mcp__dbhub__query (execute SELECT queries)
   - Access DB CLI: ./dev.sh db
```

**Benefits:**
- Proactive context provision
- Reduces back-and-forth questions
- Guides users to relevant MCP tools and standards
- Faster onboarding and context awareness

---

### 5. Stop: Quality Gate Verification

**Hook:** Prompt-based LLM evaluation
**Triggers:** Before agent completes/stops
**Purpose:** Ensure all quality requirements met before completion

**Verification Checklist:**
1. ✅ All assigned tasks marked complete with `[x]` in `tasks.md`
2. ✅ IDE diagnostics run on all modified files
3. ✅ Playwright testing completed for any UI tasks
4. ✅ No critical errors or warnings remain

**Behavior:**
- Uses Claude to evaluate completion status
- Blocks completion if requirements not met
- Provides specific reason for blocking
- Continues work automatically if incomplete

**Example:**
```
# Incomplete work:
❌ Blocked: Quality gate not satisfied: IDE diagnostics not run on modified files

# Complete work:
✅ Approved: All quality requirements satisfied
```

---

## Hook Configuration

Hooks are configured in [`.claude/settings.json`](.claude/settings.json):

```json
{
  "hooks": {
    "PostToolUse": [...],
    "PreToolUse": [...],
    "SessionStart": [...],
    "UserPromptSubmit": [...],
    "Stop": [...]
  },
  "permissions": {
    "allow": [...],
    "deny": [...],
    "ask": [...]
  }
}
```

## Hook Scripts Location

All hook scripts are located in [`.claude/hooks/`](.claude/hooks/):

- `auto-format.sh` - PostToolUse auto-formatting
- `validate-bash.py` - PreToolUse safety validation
- `session-start.sh` - SessionStart context display
- `inject-context.sh` - UserPromptSubmit context injection

## Permissions Configuration

### Auto-Approved (allow)
- Read operations: `Read:**`, `Glob:**`, `Grep:**`
- Code editing: `Edit:backend/src/**/*.ts`, `Edit:frontend/src/**/*.tsx`
- Safe bash: `Bash(npm:*)`, `Bash(git:*)`, `Bash(docker:*)`

### Blocked (deny)
- Credentials: `.env`, `.env.*`, `.mcp.json`
- Lock files: `package-lock.json`
- System files: `.git/config`, `*.key`, `*.pem`

### Requires Approval (ask)
- Configuration changes: `Edit:.claude/**`, `Write:agent-os/config.yml`
- External requests: `Bash(curl:*)`, `Bash(wget:*)`, `WebFetch`

## Performance Metrics

| Hook | Average Execution Time | Blocking? |
|------|----------------------|-----------|
| auto-format.sh | ~30ms | No |
| validate-bash.py | <5ms | Yes (if dangerous) |
| session-start.sh | ~100ms | No |
| inject-context.sh | <10ms | No |
| Stop (LLM evaluation) | ~2s | Yes (if incomplete) |

**Total overhead:** <150ms for typical operations (well within acceptable limits)

## Troubleshooting

### Hook Not Executing

1. Check script is executable: `ls -la .claude/hooks/`
2. Verify settings.json syntax: `cat .claude/settings.json | jq`
3. Check hook script exists and is readable
4. Review Claude Code logs for errors

### Hook Blocking Operations

1. Check hook output for specific error message
2. Verify command/operation is safe and intended
3. Override if necessary (hooks can be bypassed manually)
4. Report false positives for pattern refinement

### Performance Issues

1. Check hook execution times in logs
2. Increase timeouts in settings.json if needed
3. Optimize hook scripts if causing delays
4. Disable specific hooks temporarily for debugging

## Version History

- **v1.0 (2026-01-06)**: Initial hooks configuration
  - Implemented PostToolUse auto-formatting with Prettier
  - Implemented PreToolUse dangerous command validation
  - Implemented SessionStart project context display
  - Implemented UserPromptSubmit intelligent context injection
  - Implemented Stop quality gate verification
  - Configured permissions (allow, deny, ask)
  - All hooks tested and validated
  - Documentation added to CLAUDE.md

---

# Agent-OS Subagent Configuration

**Version:** v1.0 (2026-01-06)

This project uses enhanced subagent configuration with permission modes and skill preloading to improve agent behavior, safety, and efficiency.

## Enhanced Agent Configuration

All agent-os subagents now include:
- **permissionMode**: Controls how agents request permissions for operations
- **skills** (implementer only): Preloaded coding standards for immediate access
- **model**: Optimized model selection per agent complexity

### Permission Modes

| Mode | Behavior | Used By |
|------|----------|---------|
| `default` | Ask user for sensitive operations | All agents except implementer |
| `acceptEdits` | Auto-approve file edits, ask for destructive actions | implementer |
| `plan` | Read-only mode, no execution | (Not currently used) |

### Agent Configuration Summary

| Agent | permissionMode | Skills Preloaded | Model | Purpose |
|-------|---------------|------------------|-------|---------|
| **implementer** | acceptEdits | ✅ 5 skills | inherit | Auto-approve edits during implementation |
| **implementation-verifier** | default | - | inherit | Ask before verification operations |
| **spec-verifier** | default | - | sonnet | Ask before creating verification report |
| **spec-writer** | default | - | inherit | Ask before creating spec files |
| **spec-shaper** | default | - | inherit | Ask before creating requirements |
| **tasks-list-creator** | default | - | inherit | Ask before creating tasks |
| **product-planner** | default | - | inherit | Ask before creating roadmap |
| **spec-initializer** | default | - | sonnet | Ask before initializing spec folder |

### Implementer Skills Preloading

The **implementer** agent preloads 5 essential coding standards for immediate access:

1. **global-coding-style** - SOLID, DRY, KISS, YAGNI principles
2. **global-error-handling** - Error handling patterns
3. **global-validation** - Input validation standards
4. **testing-test-writing** - Test-driven development guidelines
5. **global-conventions** - Project-wide conventions

**Benefits:**
- Skills loaded immediately, no lazy loading delay
- Ensures consistent adherence to coding standards
- Reduces context bloat (only relevant skills)

### Why Permission Modes?

**Problem:** Default behavior requires user approval for every file edit, creating friction during rapid implementation.

**Solution:**
- **implementer** uses `acceptEdits` mode to auto-approve file edits
- Other agents use `default` mode for safety (spec creation, verification)
- Settings.json permissions provide additional safety layer

**Safety Net:**
- `.claude/settings.json` permissions still apply
- Dangerous operations still blocked by PreToolUse hook
- Sensitive files (`.env`, `.mcp.json`) explicitly denied

### Model Optimization

| Agent | Model | Rationale |
|-------|-------|-----------|
| spec-verifier | sonnet | Simple validation, default capability sufficient |
| spec-initializer | sonnet | Simple folder creation, fast execution |
| All others | inherit | Inherit user's model choice for flexibility |

**Future Optimization:**
- Could use `haiku` for simple agents (faster, cheaper)
- Could use `opus` for complex planning (better reasoning)
- Current `inherit` provides good balance

## Configuration Files

Agent configurations located in: [`.claude/agents/agent-os/`](.claude/agents/agent-os/)

Example frontmatter (implementer):
```yaml
---
name: implementer
description: Use proactively to implement a feature
tools: Write, Read, Bash, WebFetch, [MCP tools], Skill
model: inherit
permissionMode: acceptEdits
skills: global-coding-style, global-error-handling, global-validation, testing-test-writing, global-conventions
---
```

## Benefits

### For Implementer (acceptEdits mode)
- ✅ Auto-approves file edits during implementation
- ✅ No friction for Edit/Write operations in allowed directories
- ✅ Skills preloaded for instant standard compliance
- ✅ Faster implementation workflow

### For Other Agents (default mode)
- ✅ User retains control over spec/verification file creation
- ✅ Prevents accidental overwrites of important files
- ✅ Clear visibility into agent operations

### For All Agents
- ✅ Consistent permission handling
- ✅ Combined with hooks for maximum safety
- ✅ Works with settings.json permissions layer

## Testing

All agents tested with enhanced configuration:
- ✅ All 8 agents have `permissionMode` configured
- ✅ Implementer has 5 skills preloaded
- ✅ No breaking changes to existing workflow
- ✅ Agents respect permission modes

## Version History

- **v1.0 (2026-01-06)**: Initial subagent enhancements
  - Added `permissionMode` to all 8 agent-os agents
  - Configured implementer with `acceptEdits` mode
  - Added skill preloading to implementer (5 core skills)
  - Configured model optimization (sonnet for simple agents)
  - Tested all agents with new configuration
  - No breaking changes to existing workflow

---

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

## Development Commands

### Build & Development
```bash
# Development environment (recommended)
./dev.sh up                    # Start all services with Docker
./dev.sh down                  # Stop all services
./dev.sh logs                  # View logs
./dev.sh rebuild               # Full rebuild

# Backend (NestJS)
cd backend
npm run start:dev              # Development server with hot reload
npm run build                  # Production build
npm run test                   # Run Jest tests
npm run test:watch             # Watch mode testing
npm run lint                   # ESLint with auto-fix

# Frontend (React + Vite)
cd frontend
npm run dev                    # Development server (Vite)
npm run build                  # Production build (tsc + vite build)
npm run test                   # Run Vitest tests
npm run lint                   # ESLint
npm run type-check             # TypeScript type checking

# Shared package
cd shared
npm run build                  # Build shared types
```

### Database Operations
```bash
./dev.sh db                    # Access PostgreSQL shell
# Or manually:
docker exec -it bizass-postgres-dev psql -U postgres -d bizass_platform
```

### Debug Mode

To debug the backend service in VSCode with breakpoints and step-through debugging:

#### Starting Debug Mode

```bash
# Stop any running services first
./dev.sh down

# Start services in debug mode
./dev.sh debug
```

This starts the backend with Node.js inspector listening on port 9229.

#### Connecting VSCode Debugger

1. Open VSCode and navigate to the Debug panel (Cmd+Shift+D / Ctrl+Shift+D)
2. Select the configuration: **"🐳 Backend: Attach to Docker"**
3. Press F5 or click "Start Debugging"
4. Set breakpoints in your backend code (e.g., [backend/src/main.ts](backend/src/main.ts))
5. Send a request to the API to trigger the breakpoint

#### Verifying Debug Connection

```bash
# Check that port 9229 is listening inside the container
docker exec bizass-backend-dev netstat -tln | grep 9229

# Should show:
# tcp        0      0 0.0.0.0:9229            0.0.0.0:*               LISTEN

# Check that Node.js is running with debug flag
docker exec bizass-backend-dev ps aux | grep debug

# Should show: --debug=0.0.0.0:9229 flag
```

#### Switching Back to Normal Mode

```bash
./dev.sh down
./dev.sh up
```

**Note:** Debug mode may be slightly slower than normal development mode due to debugger overhead. Use `./dev.sh up` for regular development and `./dev.sh debug` only when you need to debug with breakpoints.

## Architecture Overview

### Monorepo Structure
- **backend/**: NestJS API server with modular architecture
- **frontend/**: React SPA with Vite, Tailwind CSS, and Zustand state management
- **shared/**: Common TypeScript types and interfaces used by both frontend and backend

### Key Modules (Backend)
- **auth/**: JWT authentication and Telegram user validation
- **survey/**: Survey structure management and session handling
- **telegram/**: Telegram Bot API integration and webhook handling
- **payment/**: Telegram Payments integration for premium reports
- **report/**: PDF report generation with charts
- **entities/**: TypeORM database entities

### Frontend Architecture
- **components/**: Reusable UI components (AuthPrompt, QuestionScreen, etc.)
- **pages/**: Route-level components (ExpressPage, FullPage)
- **store/**: Zustand stores for global state (auth, survey progress)
- **services/**: API client (axios-based) and external service integrations
- **hooks/**: Custom React hooks (useAuthPrompt, survey navigation)

## Key Technologies & Patterns

### Shared Types System
The `shared` package provides type safety between frontend and backend:
```typescript
// Import shared types in both frontend and backend
import { Survey, SurveySession, User } from 'bizass-shared';
```

### Authentication Flow
1. **Telegram WebApp**: Users authenticate via Telegram initData
2. **JWT Tokens**: Short-lived tokens for initial authentication
3. **Session Tokens**: Longer-lived tokens for API access
4. **URL Token Handling**: Frontend parses tokens from URL parameters for bot integration

### API Client Patterns
- Centralized axios client in `frontend/src/services/api.ts`
- Automatic token injection via interceptors
- Error handling with auth store integration
- 401 responses trigger Telegram authentication prompts

### State Management (Zustand)
- **auth store**: Authentication state, user data, token management
- **survey store**: Survey progress, current question, answers
- Persistent storage for auth tokens and user data

## Telegram Bot Integration

### Bot Architecture
- **Webhook Endpoint**: `/api/telegram/webhook` handles all Telegram updates
- **Authentication**: Bot generates JWT tokens for WebApp access
- **Commands**: `/start`, `/help`, `/reports`, `/referral`
- **WebApp Buttons**: Direct links to surveys with authentication tokens

### WebApp Flow
1. User clicks WebApp button in Telegram
2. Frontend URL includes `?token=<jwt>&type=<express|full>`
3. Auth store processes URL token and authenticates user
4. User redirected to appropriate survey (`/express` or `/full`)

### Key Bot Methods
- `handleWebhook()`: Main webhook processor
- `generateAuthToken()`: Creates JWT for user
- `sendMessageWithKeyboard()`: Sends interactive messages
- `getBotInfo()`: Returns bot username for deep linking

## Deployment & Production

### Render.com Blueprint Deployment
- Configured via `render.yaml` for automatic deployment
- **Services**: PostgreSQL database, backend API, frontend static site
- **Environment**: Set `TELEGRAM_BOT_TOKEN` manually in Render dashboard
- **URLs**:
  - Backend: `https://bizass-backend.onrender.com`
  - Frontend: `https://bizass-frontend.onrender.com`

### Docker Configuration
- **Multi-stage builds** for optimized production images
- **nginx** reverse proxy for frontend with API proxying
- **Environment-aware**: Different configs for dev vs production

### Database Setup
- PostgreSQL with TypeORM migrations
- Auto-seeding of survey data on startup
- Connection via environment variables or Docker networking

## Important Development Notes

### Error Handling Patterns
- API client automatically handles 401 errors by triggering Telegram auth
- Frontend shows user-friendly prompts instead of raw error messages
- Backend uses structured logging (Pino) for debugging

### Environment Configuration
- Frontend uses `VITE_*` prefixed environment variables
- Backend reads from `.env` file or environment
- Different API URLs for development vs production

### Code Quality
- **Pre-commit hooks**: Husky + lint-staged for automatic formatting
- **ESLint**: Configured for both frontend and backend
- **TypeScript**: Strict mode enabled, shared types prevent drift
- **Prettier**: Consistent code formatting across monorepo

### Testing Strategy
- **Backend**: Jest unit and integration tests
- **Frontend**: Vitest for component and utility testing
- **E2E**: Manual testing via Telegram WebApp integration

### Local Development with Telegram WebApp

#### Option 1: Using ngrok (Recommended for Telegram testing)
```bash
# Install ngrok globally
npm install -g ngrok

# Start your development environment
./dev.sh up

# In a new terminal, expose frontend to internet
ngrok http 3000

# Copy the https URL (e.g., https://abc123.ngrok-free.app)
# Set this URL as your Telegram bot's WebApp URL via BotFather
# Open your bot in Telegram and test the WebApp
```

#### Option 2: Development Token Mode (For API testing without Telegram)
When running locally without Telegram WebApp context, the app will:
1. Try Telegram authentication first
2. Fallback to development token generation using `/api/auth/generate-token`
3. Create a test user with ID `123456789`

**Note**: The app will show authentication prompts when not accessed through Telegram, which is the intended behavior for security.

### Common Gotchas
- Always use shared types from `bizass-shared` package
- Frontend API calls must handle authentication flow properly
- **App should only be accessed through Telegram WebApp in production**
- For local development, use ngrok + Telegram bot or development token fallback
- nginx proxy configuration critical for frontend API routing
- URL token parameters must be cleaned after authentication
- This session is being continued from a previous conversation that ran out of context. The conversation is summarized below:
Analysis:
Looking at this conversation chronologically:

1. Initial user request showed two screenshots of a survey selection screen and requested implementation of survey selection with session-based routing. The requirements were:
   - When selecting a survey, clear session data and start a new survey
   - Navigate to `/survey_type/:session_id` (e.g., `/express/abc123`)
   - When survey completes, navigate to `/:surveyType/:sessionId/results`

2. I used the implementation-strategist agent to create a comprehensive plan, analyzing the existing codebase and proposing a phased implementation approach.

3. After analyzing the current code structure, I examined:
   - SurveySelectionScreen.tsx - Current selection component that navigates to `/express` or `/full`
   - api.ts - Has `startSurvey` method that creates sessions
   - App.tsx - Current routing uses wildcards `/express/*` and `/full/*`
   - ExpressPage.tsx and FullPage.tsx - Survey pages that use `useSurvey` hook
   - useSurvey.ts - Hook that manages survey state locally

4. Created an implementation plan with 5 phases:
   - Update SurveySelectionScreen to create sessions
   - Update routing to use session IDs
   - Update survey pages to extract session IDs
   - Modify useSurvey hook
   - Completion flow already working

5. User approved the plan with "continue"

6. I started implementation:
   - Created a todo list with 6 tasks
   - Updated SurveySelectionScreen to make handleSelectVariant async, create sessions via API, and navigate with session ID
   - Added loading state to prevent multiple clicks
   - Updated both survey selection buttons to show loading state

7. Encountered TypeScript errors:
   - `isLoading` not being used (fixed by adding it to button disabled state)
   - telegramId type mismatch (string vs number)
   - SurveySession vs UserSession type incompatibility

8. Fixed the first two issues but still working on the UserSession type issue when summary was requested.

The current implementation is partially complete - the survey selection now creates sessions and navigates with session IDs, but there's a remaining type error to fix regarding the UserSession interface missing a userId property.

Summary:
1. **Primary Request and Intent:**
   The user provided screenshots of a survey selection interface and requested implementation where:
   - Selecting a survey type (Express or Full) should clear existing session data and start a new session
   - Navigation should go to `/survey_type/:session_id` (e.g., `/express/abc123` or `/full/xyz789`)
   - After survey completion, automatically navigate to `/:surveyType/:sessionId/results`
   - The user wanted to use the implementation-strategist agent to create a thorough plan

2. **Key Technical Concepts:**
   - Session-based routing with session IDs in URLs
   - Survey session lifecycle management (creation, tracking, completion)
   - React Router parameterized routes
   - TypeScript interfaces for type safety
   - API session creation via POST `/surveys/start`
   - LocalStorage for session persistence
   - Async/await for API calls
   - Loading states to prevent duplicate submissions

3. **Files and Code Sections:**
   
   - **frontend/src/components/SurveySelectionScreen.tsx**
     - Central component for survey selection
     - Modified to create sessions via API before navigation
     ```typescript
     const handleSelectVariant = async (variant: SurveyVariant) => {
       try {
         setIsLoading(true);
         LocalStorageService.clearCurrentSession();
         const user = LocalStorageService.getCurrentUser();
         const telegramId = user?.telegramId ? parseInt(user.telegramId) : undefined;
         const { session, sessionToken } = await api.startSurvey(variant, telegramId);
         // Create UserSession object and navigate
         navigate(`/${variant}/${session.id}`);
       } catch (error) {
         console.error('Error starting survey:', error);
         navigate(`/${variant}`); // Fallback
       }
     }
     ```
     - Added loading states to buttons to prevent multiple clicks

   - **frontend/src/services/api.ts** (read, lines 180-197)
     - Contains `startSurvey` method that creates sessions
     - Returns `{ session: SurveySession; sessionToken: string }`

   - **frontend/src/App.tsx** (read, lines 43-55)
     - Current routing structure uses wildcards: `/express/*` and `/full/*`
     - Needs updating to: `/express/:sessionId` and `/full/:sessionId`

   - **frontend/src/pages/ExpressPage.tsx** (read, lines 10-49)
     - Survey page component using `useSurvey('express')` hook
     - Needs to extract sessionId from URL params

   - **frontend/src/hooks/useSurvey.ts** (read, lines 30-139)
     - Manages survey state and session initialization
     - Currently creates/loads sessions locally
     - Needs modification to accept sessionId parameter

4. **Errors and Fixes:**
   - **'isLoading' declared but never used**:
     - Fixed by adding `disabled={isLoading}` to both survey selection buttons
   - **telegramId type mismatch (string vs number)**:
     - Fixed by parsing: `parseInt(user.telegramId)`
   - **SurveySession vs UserSession type incompatibility**:
     - Attempted fix by creating UserSession object with required properties
     - Still has error: missing `userId` property in UserSession type

5. **Problem Solving:**
   - Successfully implemented async session creation in survey selection
   - Added proper error handling with fallback navigation
   - Implemented loading states to prevent race conditions
   - Working on resolving TypeScript type compatibility issues

6. **All User Messages:**
   - "[Image #1] [Image #2] при выборе опроса, нужно сбрасывать данные сессии и начинать новый опрос. новый опрос должен открываться по пути /survey_type/:session_id. когда все ответы по опросу получены, нужно открыть страницу результатов /:surveyType/:sessionId/results. используй implamentation-strategist для построения плана"
   - "continue"

7. **Pending Tasks:**
   - Fix UserSession type error (add userId property)
   - Update App.tsx routing to use session ID parameters
   - Update ExpressPage to extract and use session ID from URL
   - Update FullPage to extract and use session ID from URL
   - Modify useSurvey hook to accept and use session ID parameter
   - Test complete flow: selection → new session → survey → results

8. **Current Work:**
   Working on fixing the TypeScript type error in SurveySelectionScreen.tsx where the UserSession interface requires a `userId` property that wasn't being provided when creating the userSession object from the API response. The error occurs at line 38 where `LocalStorageService.setCurrentSession(userSession)` is called.

9. **Optional Next Step:**
   Fix the remaining TypeScript error by adding the missing `userId` property to the userSession object, likely using the user's telegramId or extracting it from the session data. This directly continues the current task of updating SurveySelectionScreen to properly handle session creation and navigation with session IDs..
Please continue the conversation from where we left it off without asking the user any further questions. Continue with the last task that you were asked to work on.