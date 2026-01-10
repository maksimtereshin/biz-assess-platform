#!/bin/bash
# Auto-format TypeScript/JavaScript files after editing
# This hook runs after Edit or Write operations to ensure consistent code formatting

# Read input from stdin (tool use data)
INPUT=$(cat)

# Extract file path from the tool input
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

# If no file path found, exit successfully (nothing to format)
if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# Only format TypeScript/JavaScript files
if [[ "$FILE_PATH" =~ \.(ts|tsx|js|jsx)$ ]]; then
  # Run prettier on the file
  # Suppress errors to prevent hook failure from blocking operations
  npx prettier --write "$FILE_PATH" 2>/dev/null || true

  # Log successful formatting (optional)
  # echo "✓ Formatted: $FILE_PATH" >&2
fi

# Always exit successfully (don't block operations)
exit 0
