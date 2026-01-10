#!/usr/bin/env python3
"""
Validate Bash commands to prevent dangerous operations
This hook runs before Bash tool execution to block potentially destructive commands
"""

import json
import sys
import re

# Read input from stdin
try:
    input_data = json.load(sys.stdin)
except json.JSONDecodeError:
    # If JSON parsing fails, allow the operation
    sys.exit(0)

# Extract command from tool input
command = input_data.get('tool_input', {}).get('command', '')

# Dangerous patterns to block
DANGEROUS_PATTERNS = [
    # Prevent destructive file operations
    (r'\brm\s+-rf\s+/', "Dangerous: rm -rf on root path - please use specific paths"),
    (r'\brm\s+-rf\s+~', "Dangerous: rm -rf on home directory - please be specific"),
    (r'\brm\s+-rf\s+\*', "Dangerous: rm -rf with wildcard - please be specific"),

    # Prevent force push operations
    (r'git\s+push\s+.*--force\b', "Dangerous: Force push detected - use --force-with-lease if needed"),
    (r'git\s+push\s+.*-f\b', "Dangerous: Force push detected - use --force-with-lease if needed"),

    # Prevent database destruction
    (r'DROP\s+DATABASE', "Dangerous: DROP DATABASE detected - use database CLI for such operations"),
    (r'DROP\s+TABLE', "Dangerous: DROP TABLE detected - please verify this is intentional"),

    # Prevent unsafe DELETE queries
    (r'DELETE\s+FROM\s+\w+\s*;', "Dangerous: DELETE without WHERE clause - this would delete all rows"),

    # Prevent npm/system package removal without verification
    (r'npm\s+uninstall\s+-g', "Warning: Global npm package removal - please verify"),
    (r'brew\s+uninstall', "Warning: Homebrew package removal - please verify"),

    # Prevent permission changes on critical directories
    (r'chmod\s+.*\s+/', "Dangerous: Changing permissions on root - please be specific"),
    (r'chown\s+.*\s+/', "Dangerous: Changing ownership on root - please be specific"),
]

# Check command against dangerous patterns
for pattern, message in DANGEROUS_PATTERNS:
    if re.search(pattern, command, re.IGNORECASE):
        # Block the operation and provide reason
        response = {
            "decision": "block",
            "reason": message,
            "systemMessage": f"Blocked command: {command[:100]}..."
        }
        print(json.dumps(response))
        sys.exit(0)

# If no dangerous patterns found, allow the operation
sys.exit(0)
