# Kottster Admin Panel - Production Deployment
# Multi-stage build for optimized production image

# ============================================================
# STAGE 1: Builder
# ============================================================
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package files and install all dependencies (including devDependencies)
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# ============================================================
# STAGE 2: Production
# ============================================================
FROM node:22-alpine
WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Copy built artifacts from builder stage
COPY --from=builder /app/dist ./dist

# Create directory for SQLite identity database (created at runtime)
RUN mkdir -p /app/data && chown -R node:node /app/data

# Environment variables (will be overridden by Render)
ENV NODE_ENV=production
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

# Start the server
CMD ["node", "dist/server/server.cjs"]