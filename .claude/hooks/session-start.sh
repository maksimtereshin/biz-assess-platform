#!/bin/bash
# Session Start Hook - Display project context at session start
# This hook runs once when a new Claude Code session begins

echo ""
echo "🚀 Agent-OS Session Starting"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📁 Project: biz-assess-platform"
echo "🏗️  Architecture: Monorepo (backend, frontend, shared)"
echo "⚙️  Config: agent-os/config.yml"
echo ""

# Display current git status
echo "📊 Git Status:"
if git rev-parse --git-dir > /dev/null 2>&1; then
  BRANCH=$(git branch --show-current 2>/dev/null)
  echo "   Branch: $BRANCH"

  # Show short status
  STATUS=$(git status --short 2>/dev/null)
  if [ -n "$STATUS" ]; then
    echo "   Modified files:"
    echo "$STATUS" | head -5 | sed 's/^/   /'
    FILE_COUNT=$(echo "$STATUS" | wc -l | xargs)
    if [ "$FILE_COUNT" -gt 5 ]; then
      echo "   ... and $((FILE_COUNT - 5)) more files"
    fi
  else
    echo "   ✓ Working directory clean"
  fi
else
  echo "   Not in git repository"
fi
echo ""

# Display running Docker containers
echo "🐳 Docker Containers:"
# Check if Docker is available before running docker commands
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  CONTAINERS=$(docker ps --format "{{.Names}}\t{{.Status}}" 2>/dev/null | grep bizass)
  if [ -n "$CONTAINERS" ]; then
    echo "$CONTAINERS" | sed 's/^/   /'
  else
    echo "   No bizass containers running"
    echo "   💡 Start with: ./dev.sh up"
  fi
else
  echo "   Docker unavailable or not running"
  echo "   💡 Start Docker to see container status"
fi
echo ""

# Display recent specs
echo "📝 Recent Specs:"
if [ -d "agent-os/specs" ]; then
  SPECS=$(ls -1t agent-os/specs/ 2>/dev/null | head -3)
  if [ -n "$SPECS" ]; then
    echo "$SPECS" | sed 's/^/   /'
  else
    echo "   No specs found"
  fi
else
  echo "   agent-os/specs/ directory not found"
fi
echo ""

# Agent-OS quick reference
echo "🤖 Agent-OS Quick Reference:"
echo "   Commands: .claude/commands/agent-os/"
echo "   Agents: .claude/agents/agent-os/"
echo "   Standards: agent-os/standards/"
echo "   Skills: .claude/skills/"
echo ""

# MCP Tools status
echo "🔧 MCP Tools Status:"
if [ -f ".mcp.json" ]; then
  echo "   ✓ MCP configured (.mcp.json found)"
  echo "   📊 PostgreSQL, GitHub, Git, Context7, Playwright, IDE Diagnostics"
else
  echo "   ⚠️  MCP not configured (copy .mcp.json.example to .mcp.json)"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Ready for implementation! 🎯"
echo ""

# Exit successfully
exit 0
