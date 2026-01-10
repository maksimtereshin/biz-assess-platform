#!/bin/sh
set -e

echo "🔄 Running database migrations..."
npx typeorm migration:run -d dist/src/data-source.js

echo "✅ Migrations completed successfully"
echo "🚀 Starting application..."

# Use exec to replace the shell with the node process
# This ensures proper signal handling for graceful shutdowns
exec "$@"
