# Multi-stage Dockerfile for production-ready React application
# Optimized for Render.com deployment with nginx proxy

# Stage 1: Build stage
FROM node:18-alpine AS builder

# Build shared library first
WORKDIR /shared
COPY ./shared/package*.json ./
RUN npm ci
COPY ./shared/ ./
RUN npm run build

# Build frontend
WORKDIR /app

# Copy package files
COPY ./frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY ./frontend/ ./

# Build with relative API URLs (no environment variables needed)
RUN npx vite build

# Stage 2: Production stage with nginx
FROM nginx:alpine AS production

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration template
COPY ./frontend/nginx.conf.template /etc/nginx/nginx.conf.template

# Copy startup script that configures nginx with backend URL
COPY ./frontend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create nginx user and set permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start with our custom script
CMD ["/docker-entrypoint.sh"]