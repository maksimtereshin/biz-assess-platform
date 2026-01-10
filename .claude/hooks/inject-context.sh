#!/bin/bash
# User Prompt Submit Hook - Inject contextual information based on user query
# This hook analyzes the user's prompt and adds relevant project context

# Read input from stdin
INPUT=$(cat)

# Extract the user's prompt text
PROMPT=$(echo "$INPUT" | jq -r '.prompt // empty' 2>/dev/null)

# If prompt extraction failed, exit silently
if [ -z "$PROMPT" ]; then
  exit 0
fi

# Flag to track if we've added any context
CONTEXT_ADDED=false

# Check if user mentioned specs/features/tasks
if echo "$PROMPT" | grep -Eqi 'spec|feature|task|implement|build|create'; then
  if [ "$CONTEXT_ADDED" = false ]; then
    echo ""
    CONTEXT_ADDED=true
  fi

  echo "💡 Context: Current specs in agent-os/specs/:"
  if [ -d "agent-os/specs" ]; then
    ls -1t agent-os/specs/ 2>/dev/null | head -5 | sed 's/^/   /'
  else
    echo "   No specs found"
  fi
fi

# Check if user mentioned database/migration/schema
if echo "$PROMPT" | grep -Eqi 'database|migration|schema|model|entity|typeorm|postgres|sql'; then
  if [ "$CONTEXT_ADDED" = false ]; then
    echo ""
    CONTEXT_ADDED=true
  fi

  echo "💡 Context: Database operations available:"
  echo "   - PostgreSQL MCP: mcp__dbhub__schema (inspect schema)"
  echo "   - PostgreSQL MCP: mcp__dbhub__query (execute SELECT queries)"
  echo "   - Access DB CLI: ./dev.sh db"
fi

# Check if user mentioned testing/playwright
if echo "$PROMPT" | grep -Eqi 'test|playwright|browser|ui|screenshot|verify'; then
  if [ "$CONTEXT_ADDED" = false ]; then
    echo ""
    CONTEXT_ADDED=true
  fi

  echo "💡 Context: Testing tools available:"
  echo "   - Playwright MCP (MANDATORY for UI tasks)"
  echo "   - IDE Diagnostics MCP (MANDATORY after code changes)"
  echo "   - Test runner: npm run test (in backend/ or frontend/)"
fi

# Check if user mentioned API/endpoints/routes
if echo "$PROMPT" | grep -Eqi '\bapi\b|endpoint|route|controller|nestjs|express'; then
  if [ "$CONTEXT_ADDED" = false ]; then
    echo ""
    CONTEXT_ADDED=true
  fi

  echo "💡 Context: API development:"
  echo "   - Backend: NestJS monorepo structure"
  echo "   - Standards: agent-os/standards/backend/api.md"
  echo "   - Context7 available for NestJS docs queries"
fi

# Check if user mentioned frontend/react/components
if echo "$PROMPT" | grep -Eqi 'frontend|react|component|ui|page|view|tailwind|vite'; then
  if [ "$CONTEXT_ADDED" = false ]; then
    echo ""
    CONTEXT_ADDED=true
  fi

  echo "💡 Context: Frontend development:"
  echo "   - Framework: React + Vite + Tailwind CSS"
  echo "   - Standards: agent-os/standards/frontend/"
  echo "   - State: Zustand stores in frontend/src/store/"
  echo "   - Context7 available for React/Vite docs queries"
fi

# Check if user mentioned docker/containers
if echo "$PROMPT" | grep -Eqi 'docker|container|dev\.sh|development environment'; then
  if [ "$CONTEXT_ADDED" = false ]; then
    echo ""
    CONTEXT_ADDED=true
  fi

  echo "💡 Context: Development environment:"
  echo "   - Start: ./dev.sh up"
  echo "   - Stop: ./dev.sh down"
  echo "   - Logs: ./dev.sh logs"
  echo "   - Rebuild: ./dev.sh rebuild"
fi

# Check if user mentioned telegram/bot
if echo "$PROMPT" | grep -Eqi 'telegram|bot|webhook|webapp|initdata'; then
  if [ "$CONTEXT_ADDED" = false ]; then
    echo ""
    CONTEXT_ADDED=true
  fi

  echo "💡 Context: Telegram bot integration:"
  echo "   - Bot module: backend/src/telegram/"
  echo "   - Telegram MCP available for bot testing (optional)"
  echo "   - Testing: Use ngrok for WebApp testing"
fi

# Check if user mentioned MCP/tools/context7
if echo "$PROMPT" | grep -Eqi '\bmcp\b|context7|playwright mcp|mcp tools|mcp server'; then
  if [ "$CONTEXT_ADDED" = false ]; then
    echo ""
    CONTEXT_ADDED=true
  fi

  echo "💡 Context: MCP Tools usage:"
  echo "   - Guidelines: agent-os/standards/global/mcp-tools-usage.md"
  echo "   - Context7: Max 3 queries per task group"
  echo "   - Playwright: MANDATORY for UI tasks"
  echo "   - IDE Diagnostics: MANDATORY after code changes"
fi

# If we added context, add a blank line for readability
if [ "$CONTEXT_ADDED" = true ]; then
  echo ""
fi

# Exit successfully
exit 0
