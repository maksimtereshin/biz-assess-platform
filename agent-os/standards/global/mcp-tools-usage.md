# MCP Tools Usage Standards

This document defines standards for using Model Context Protocol (MCP) tools in the agent-os workflow.

## Table of Contents
1. [Available MCP Tools](#available-mcp-tools)
2. [Query Limits by Agent](#query-limits-by-agent)
3. [Decision Trees](#decision-trees)
4. [Usage Guidelines](#usage-guidelines)
5. [Graceful Degradation](#graceful-degradation)
6. [Security Best Practices](#security-best-practices)

---

## Available MCP Tools

### Tier 1: Essential Development Tools

#### PostgreSQL/Database (DBHub)
- **Purpose:** Database schema inspection, query execution, migration assistance
- **Use Cases:**
  - Schema inspection for TypeORM entities
  - Query building for survey data
  - Report generation data validation
  - Development data seeding utilities
  - Database debugging without CLI context switching
- **Security:** Read-only access with SELECT-only permissions
- **Tools:** `dbhub_*` functions

#### GitHub MCP
- **Purpose:** AI-assisted code review, issue management, PR workflows
- **Use Cases:**
  - Create issues from bugs found during implementation
  - Manage GitHub Actions workflow runs
  - Search code across repositories
  - Track agent-os refactoring progress
- **Security:** Fine-grained token with repo, read:org, workflow scopes
- **Tools:** `github_*` functions

#### Git MCP
- **Purpose:** Local repository management, automated commits, branch operations
- **Use Cases:**
  - Automated commit creation with standardized messages
  - Branch management for feature implementations
  - Diff analysis for spec verification
  - Git history exploration for pattern discovery
- **Tools:** `git_*` functions

#### Context7
- **Purpose:** Up-to-date framework documentation
- **Use Cases:**
  - Query NestJS, React, TypeORM, Telegram Bot API, Vite, Zustand docs
  - Understand framework-specific patterns
  - Verify API availability and usage
- **Security:** API key required
- **Tools:** `mcp__context7__resolve-library-id`, `mcp__context7__query-docs`

#### Playwright
- **Purpose:** Browser testing and visual verification
- **Use Cases:**
  - Test survey selection screen (ExpressPage, FullPage)
  - Verify Telegram WebApp authentication flow
  - Screenshot capture for verification
  - Survey question navigation testing
- **Tools:** `mcp__playwright__*` functions

#### IDE Diagnostics
- **Purpose:** TypeScript/ESLint error detection
- **Use Cases:**
  - Check for type errors after implementation
  - Validate code quality before marking tasks complete
  - Systematic error detection
- **Tools:** `mcp__ide__getDiagnostics`, `mcp__ide__executeCode`

### Tier 2: Workflow Enhancement Tools

#### File System MCP
- **Purpose:** Monorepo-aware file operations
- **Use Cases:**
  - Navigate backend, frontend, shared packages
  - Resolve TypeScript path aliases
  - Manage build artifacts
- **Tools:** `filesystem_*` functions

#### Memory MCP
- **Purpose:** Persistent project context
- **Use Cases:**
  - Store architectural decisions
  - Remember coding patterns
  - Track technical debt
- **Tools:** `memory_*` functions

#### Docker MCP
- **Purpose:** Container lifecycle management
- **Use Cases:**
  - Manage development containers
  - Stream logs with filtering
  - Health check monitoring
- **Tools:** `docker_*` functions

### Tier 3: Advanced Capabilities (Optional)

#### Sequential Thinking MCP
- **Purpose:** Complex problem decomposition and multi-step reasoning
- **Use Cases:**
  - Spec decomposition for complex features
  - Task dependency analysis
  - Multi-step debugging
  - Architectural decision making
- **Tools:** `sequential-thinking_*` functions

#### Telegram MCP
- **Purpose:** Telegram bot testing and validation
- **Use Cases:**
  - Test bot commands without ngrok (/start, /help, /reports)
  - Validate message formatting (HTML, Markdown)
  - Test inline keyboard responses
  - Verify bot state management
- **Security:** Use development bot token, NOT production
- **Tools:** `telegram_*` functions

---

## Query Limits by Agent

### Specification Agents
- **product-planner:** Max 3 Context7 queries per product
- **spec-shaper:** Max 2 Context7 queries per spec
- **spec-writer:** Max 3 Context7 queries per spec
- **task-list-creator:** Max 2 Context7 queries per spec

### Implementation Agents
- **implementer:** Max 3 Context7 queries per task group
  - IDE diagnostics: MANDATORY on all modified files
  - Playwright testing: MANDATORY for all UI tasks
  - PostgreSQL queries: As needed for database operations
  - Git operations: As needed for commits

### Verification Agents
- **implementation-verifier:**
  - IDE diagnostics: MANDATORY on entire codebase
  - Playwright: MANDATORY for visual regression testing
  - PostgreSQL queries: As needed for data validation

### Advanced Agents (Optional Tier 3)
- **spec-shaper (optional):** Sequential Thinking for complex requirement analysis
- **spec-writer (optional):** Sequential Thinking for complex feature decomposition
- **task-list-creator (optional):** Sequential Thinking for dependency analysis
- **implementer (backend, optional):** Telegram MCP for bot command testing
- **implementation-verifier (backend, optional):** Telegram MCP for bot verification

---

## Decision Trees

### Should I Query Context7?

```
Is this unfamiliar framework API?
├─ YES → Query Context7
└─ NO
   ├─ Can I find this in existing code?
   │  ├─ YES → Search codebase instead
   │  └─ NO → Continue
   ├─ Is this basic programming?
   │  ├─ YES → Use existing knowledge
   │  └─ NO → Continue
   └─ Have I reached query limit?
      ├─ YES → Use existing knowledge
      └─ NO → Query Context7
```

### Should I Use Playwright?

```
Is this a UI task?
├─ YES → MANDATORY - Use Playwright
└─ NO → Not needed
```

### Should I Run IDE Diagnostics?

```
Have I modified code files?
├─ YES → MANDATORY - Run IDE diagnostics
└─ NO → Not needed
```

---

## Usage Guidelines

### Context7 Guidelines

**When to Use:**
- Unfamiliar framework API or pattern
- Need to verify if a feature exists in the framework
- Understanding framework-specific best practices
- Checking latest framework version capabilities

**When NOT to Use:**
- Basic programming concepts (loops, conditionals, etc.)
- Patterns already present in the codebase
- Simple syntax questions
- After reaching query limit

**Best Practices:**
1. Always call `resolve-library-id` before `query-docs`
2. Be specific in queries: "How to implement JWT guards in NestJS" vs "authentication"
3. Focus on official documentation patterns
4. Reference both Context7 results AND existing code patterns
5. Include framework versions in queries when relevant

**Example Queries:**
- ✅ "How to implement JWT authentication guard in NestJS 10"
- ✅ "React 18 useEffect cleanup function best practices"
- ✅ "TypeORM migration syntax for adding foreign key constraint"
- ❌ "auth" (too vague)
- ❌ "how to use variables" (too basic)

---

### Playwright Guidelines

**Mandatory Usage:**
- ALL UI implementation tasks MUST include Playwright testing
- NOT conditional - always required for user-facing features

**Testing Process:**
1. Navigate to the implemented feature
2. Test user interactions (click, type, submit, navigate)
3. Take screenshots of key states
4. Store screenshots in `agent-os/specs/[spec]/verification/screenshots/`
5. Verify against mockups in `agent-os/specs/[spec]/planning/visuals/`

**Screenshot Naming:**
- Format: `[component]-[state]-[timestamp].png`
- Examples:
  - `survey-selection-initial-20260106.png`
  - `express-page-question1-20260106.png`
  - `results-page-complete-20260106.png`

**Best Practices:**
- Test as a user would (don't test implementation details)
- Capture error states and edge cases
- Use headless browser for speed
- Document any visual differences from mockups

---

### IDE Diagnostics Guidelines

**Mandatory Usage:**
- Run on ALL modified files after implementation
- Run on entire codebase during verification

**Process:**
1. Implement feature
2. Run IDE diagnostics: `mcp__ide__getDiagnostics({ files: ["path/to/file.ts"] })`
3. Fix critical errors (type errors, syntax errors)
4. Document remaining warnings
5. **NEVER mark task complete with critical errors**
6. Re-run diagnostics until clean or warnings only

**Error Priority:**
- **Critical:** Type errors, syntax errors, undefined variables → MUST fix
- **High:** ESLint errors, potential bugs → Should fix
- **Medium:** ESLint warnings, style issues → Document if not fixing
- **Low:** Formatting, comments → Can ignore

**Graceful Fallback:**
If IDE diagnostics MCP fails:
1. Try `npm run lint` in affected directory
2. Try `tsc --noEmit` for type checking
3. Document the need for manual verification
4. Create TODO for future fix

---

### PostgreSQL/Database Guidelines

**When to Use:**
- Understanding database schema before implementation
- Building queries for data access
- Validating migration scripts
- Debugging data-related issues
- Verifying report generation data

**Best Practices:**
- Use schema inspection before writing TypeORM entities
- Test complex queries before implementing in code
- Validate data relationships
- Never modify data (read-only access enforced)

**Security:**
- Only SELECT queries allowed
- Connection limit: 5 concurrent connections
- No write, update, or delete operations possible

---

### Sequential Thinking Guidelines

**When to Use:**
- Complex specs with multiple interconnected features
- Features requiring careful dependency management
- Architectural decisions with multiple trade-offs
- Multi-step debugging of complex issues

**When NOT to Use:**
- Simple, straightforward features
- Well-understood patterns from existing code
- Tasks with clear, linear implementation paths
- After establishing this adds no value to workflow

**Best Practices:**
1. Use for spec decomposition, not simple task lists
2. Focus on complex logical reasoning
3. Document reasoning steps in spec/tasks
4. Evaluate if this adds value over standard approach
5. Don't overuse - only for genuinely complex problems

**Example Use Cases:**
- Breaking down multi-phase feature with unclear dependencies
- Analyzing optimal implementation order for interconnected changes
- Systematic exploration of architectural trade-offs
- Multi-step root cause analysis for complex bugs

---

### Telegram MCP Guidelines

**When to Use:**
- Backend implementation involving Telegram bot
- Testing bot commands during development
- Validating message formats and keyboards
- Verifying bot response logic

**When NOT to Use:**
- Frontend-only features
- Features not involving Telegram bot
- Full WebApp context testing (use manual testing instead)
- Payment flow testing (requires manual testing)

**Best Practices:**
1. Use development bot token, never production
2. Test bot commands without ngrok dependency
3. Validate inline keyboard responses
4. Document bot testing in verification report
5. Combine with manual testing for full coverage

**Limitations:**
- Cannot simulate Telegram WebApp context (URL tokens, initData)
- Cannot test Telegram Payments natively
- Requires actual bot token and test Telegram user
- Limited to Bot API capabilities

**Example Use Cases:**
- Testing `/start`, `/help`, `/reports` commands without deploying
- Validating HTML/Markdown formatting in bot messages
- Testing inline keyboard button responses
- Verifying bot state management across conversations

---

### Git Guidelines

**When to Use:**
- Creating commits after task completion
- Analyzing git history for patterns
- Managing branches for features
- Reviewing diffs for verification

**Commit Message Standards:**
- Follow existing project commit message style
- Reference spec/task in commit message
- Use conventional commits format when applicable
- Example: `feat(survey): implement session-based routing`

**Best Practices:**
1. Always check git status before committing
2. Review git diff before creating commit
3. Use descriptive commit messages
4. Link commits to specs/tasks when relevant

---

### GitHub Guidelines

**When to Use:**
- Creating issues for bugs discovered during implementation
- Managing pull requests
- Tracking implementation progress via issues
- Searching codebase patterns across repos

**Best Practices:**
1. Create issues with clear reproduction steps
2. Link PRs to issues
3. Use labels and milestones for organization
4. Document implementation decisions in issue comments

---

## Graceful Degradation

All MCP tools must have fallback behavior when unavailable.

### Context7 Fallback
```
IF Context7 query fails:
1. Continue with existing knowledge
2. Search existing codebase for patterns
3. Log warning: "Context7 unavailable, using existing knowledge"
4. Document assumption in spec/implementation
```

### Playwright Fallback
```
IF Playwright fails:
1. Document need for manual testing
2. Create TODO: "Manual testing required: [feature]"
3. Describe expected user flows
4. Mark verification as incomplete
```

### IDE Diagnostics Fallback
```
IF IDE diagnostics fails:
1. Try alternative: `npm run lint`
2. Try alternative: `tsc --noEmit`
3. Document need for manual verification
4. Create TODO: "Manual type check required"
```

### PostgreSQL Fallback
```
IF database MCP fails:
1. Use CLI: `./dev.sh db`
2. Check existing TypeORM entities
3. Review migration files
4. Document schema assumptions
```

### Git Fallback
```
IF Git MCP fails:
1. Use Bash tool: `git status`, `git diff`, `git log`
2. Standard git CLI operations
3. Manual commit creation
```

### GitHub Fallback
```
IF GitHub MCP fails:
1. Use `gh` CLI tool via Bash
2. Manual issue/PR creation
3. Web interface for code review
```

---

## Security Best Practices

### Credential Management
1. **NEVER** hardcode credentials in `.mcp.json`
2. Always use environment variables
3. Store credentials in `.env.mcp` (git-ignored)
4. Use fine-grained tokens with minimum required scopes
5. Rotate tokens regularly (90 days recommended)

### Database Access
1. Use read-only user: `readonly_claude`
2. No write/update/delete permissions
3. Connection limit enforced (5 connections)
4. Monitor connection usage
5. Never expose production database

### GitHub Token
1. Use fine-grained personal access tokens
2. Minimum scopes: `repo`, `read:org`, `workflow`
3. Set token expiration
4. Never commit tokens to version control
5. Revoke compromised tokens immediately

### Context7 API Key
1. Store in environment variables
2. Never commit to version control
3. Use separate keys for different projects
4. Monitor usage for anomalies

---

## Alignment with Agent-OS Principles

### SOLID Principles
- **Single Responsibility:** Each MCP tool has one clear purpose
- **Open/Closed:** MCP tools extend capabilities without modifying core workflow

### DRY (Don't Repeat Yourself)
- Single source of truth for MCP usage standards
- All agents reference this document
- Consistent patterns across all agents

### KISS (Keep It Simple, Stupid)
- Simple integration enhances existing workflow
- Agents work without MCP (graceful degradation)
- Clear decision trees for when to use each tool

### YAGNI (You Aren't Gonna Need It)
- Build only needed capabilities
- No speculative MCP integrations
- Query limits prevent overuse
- Use MCP tools only when they add clear value

---

## Examples

### Example 1: Implementer Using IDE Diagnostics

```markdown
Task: Implement UserController.ts

Workflow:
1. Write UserController.ts code
2. Run IDE diagnostics:
   mcp__ide__getDiagnostics({ files: ["src/api/user.controller.ts"] })
3. Found 3 type errors:
   - Property 'email' does not exist on type 'User'
   - Cannot find name 'validateEmail'
   - Type 'string | undefined' is not assignable to type 'string'
4. Fix all 3 errors
5. Re-run IDE diagnostics → Clean
6. Mark task complete
```

### Example 2: Spec Writer Using Context7

```markdown
Task: Write spec for JWT authentication

Workflow:
1. Read requirements
2. Search existing code for auth patterns
3. Query Context7 (1/3):
   - resolve-library-id("nestjs")
   - query-docs("/nestjs/nestjs", "JWT authentication guard implementation")
4. Found: NestJS JWT guards pattern with @UseGuards decorator
5. Write spec referencing:
   - Existing auth patterns in codebase
   - Official NestJS JWT guard pattern from Context7
6. Include both approaches in spec.md
```

### Example 3: Implementer Using Playwright (Mandatory)

```markdown
Task: Implement dashboard component

Workflow:
1. Implement Dashboard component
2. Run IDE diagnostics → Fix type errors
3. Use Playwright (MANDATORY):
   - Navigate to http://localhost:3000/dashboard
   - Test user interactions:
     * Click "New Survey" button
     * Verify modal opens
     * Fill form and submit
     * Verify dashboard updates
   - Take screenshots:
     * dashboard-initial-20260106.png
     * dashboard-modal-open-20260106.png
     * dashboard-after-submit-20260106.png
   - Store in: agent-os/specs/[spec]/verification/screenshots/
4. Compare screenshots to mockup in planning/visuals/dashboard-mockup.png
5. Document any differences
6. Mark task complete
```

### Example 4: Verifier with Visual Regression

```markdown
Task: Verify dashboard implementation

Workflow:
1. Check all tasks marked complete
2. Run test suite → All tests pass
3. Run IDE diagnostics on entire codebase:
   - Found 2 warnings (non-critical)
   - 0 errors
4. Visual regression testing (AUTOMATIC):
   - Read planning/visuals/dashboard-mockup.png
   - Use Playwright to capture actual dashboard
   - Compare screenshots:
     * Layout: ✅ Matches
     * Colors: ⚠️ Button color slightly different (#007bff vs #0056b3)
     * Typography: ✅ Matches
     * Spacing: ✅ Matches
5. Create verification report:
   - Overall: PASS with 1 minor difference
   - Recommendation: Update mockup or adjust button color
6. Mark verification complete
```

---

## Summary

### Key Takeaways

1. **Context7:** Use for unfamiliar APIs, respect query limits, always search codebase first
2. **Playwright:** MANDATORY for all UI tasks, not conditional
3. **IDE Diagnostics:** MANDATORY after code changes, fix critical errors before completing
4. **PostgreSQL:** Use for schema inspection and query building, read-only access
5. **Git/GitHub:** Use for repository management and issue tracking
6. **Graceful Degradation:** All MCP tools must have fallback behavior
7. **Security:** Never commit credentials, use environment variables, minimum token scopes

### Quick Reference

| Tool | When to Use | Mandatory? | Fallback |
|------|-------------|------------|----------|
| Context7 | Unfamiliar API, framework patterns | No (with limits) | Existing knowledge, codebase search |
| Playwright | All UI tasks | **YES** | Manual testing, TODO |
| IDE Diagnostics | After code changes | **YES** | `npm run lint`, `tsc` |
| PostgreSQL | Schema inspection, query building | No | CLI, existing entities |
| Git | Commits, diffs, history | No | Bash git commands |
| GitHub | Issues, PRs, code search | No | `gh` CLI, web interface |
| File System | Monorepo navigation | No | Standard file tools |
| Memory | Context persistence | No | Documentation |
| Docker | Container management | No | `./dev.sh`, docker CLI |
| Sequential Thinking | Complex problem decomposition | No (optional) | Standard reasoning |
| Telegram MCP | Bot testing, command validation | No (optional) | Manual ngrok testing |

---

## Version History

- **v1.1 (2026-01-06):** Added Tier 3 MCP tools (Sequential Thinking, Telegram)
  - Added Sequential Thinking MCP for complex spec decomposition
  - Added Telegram MCP for bot testing without ngrok
  - Added usage guidelines for both tools
  - Updated query limits for optional tier 3 agents

- **v1.0 (2026-01-06):** Initial MCP tools usage standards
  - Defined all Tier 1 and Tier 2 MCP tools
  - Established query limits for each agent
  - Created decision trees for tool usage
  - Documented graceful degradation patterns
  - Added security best practices
