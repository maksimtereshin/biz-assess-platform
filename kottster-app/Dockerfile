# Kottster Admin Panel - TEMPORARY DEVELOPMENT MODE FOR RENDER
# Running in development mode to enable visual builder for datasource/page configuration
# TODO: Revert to production build after configuration is complete
# BACKUP: Dockerfile.prod.backup

FROM node:22-alpine
WORKDIR /app

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Copy package files and install ALL dependencies (including devDependencies for dev mode)
COPY package*.json ./
RUN npm install

# Rebuild better-sqlite3 for the current architecture
RUN npm rebuild better-sqlite3

# Copy application source
COPY . .

# Create directory for SQLite identity database (created at runtime)
RUN mkdir -p /app/data && chown -R node:node /app/data

# Environment variables (will be overridden by Render)
ENV NODE_ENV=development
ENV PORT=5480
ENV DB_HOST=localhost
ENV DB_PORT=5432
ENV DB_USER=postgres
ENV DB_PASSWORD=
ENV DB_NAME=bizass_platform
ENV KOTTSTER_SECRET_KEY=
ENV KOTTSTER_API_TOKEN=
ENV KOTTSTER_JWT_SALT=
ENV ROOT_USERNAME=
ENV ROOT_PASSWORD=

# Expose the application port
EXPOSE $PORT

# Health check endpoint
# Kottster doesn't have a built-in /health endpoint, so we check the main page
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT}/', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Run as non-root user for security
USER node

# Start the development server (enables visual builder)
CMD ["npm", "run", "dev"]