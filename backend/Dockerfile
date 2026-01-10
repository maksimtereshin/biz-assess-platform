# Multi-stage Dockerfile for production-ready Node.js application
# Based on TRD-109 requirements

# Stage 1: Build stage
FROM node:18-alpine AS builder

# Install canvas dependencies
RUN apk add --no-cache \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    python3 \
    make \
    g++

# Build shared library first
WORKDIR /shared
COPY ./shared/package*.json ./
RUN npm ci
COPY ./shared/ ./
RUN npm run build

# Build backend
WORKDIR /app

# Copy package files
COPY ./backend/package*.json ./
COPY ./backend/tsconfig*.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY ./backend/src/ ./src/

# Create dist directory
RUN mkdir -p dist

# Build the application
RUN npm run build

# Copy data files that TypeScript doesn't copy
COPY ./backend/src/data/ ./dist/data/

# Stage 2: Production stage
FROM node:18-alpine AS production

# Install runtime canvas dependencies and build tools for npm install
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    musl \
    giflib \
    pixman \
    pangomm \
    libjpeg-turbo \
    freetype \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Create app user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

WORKDIR /app

# Copy package files
COPY ./backend/package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built shared library from builder stage
COPY --from=builder --chown=nestjs:nodejs /shared ./node_modules/bizass-shared

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Copy AdminJS component source files (required for runtime bundling)
COPY --from=builder --chown=nestjs:nodejs /app/src/admin/components ./src/admin/components

# Copy migrations directory
COPY --chown=nestjs:nodejs ./backend/migrations ./migrations

# Create uploads directory for file storage
RUN mkdir -p uploads && chown nestjs:nodejs uploads

# Create .adminjs directory for component bundling (AdminJS ComponentLoader needs write access)
RUN mkdir -p .adminjs && chown nestjs:nodejs .adminjs

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3001

# Health check (use /api/health since all routes have /api prefix)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application (NestJS builds to dist/main.js in production)
CMD ["node", "dist/main.js"]
