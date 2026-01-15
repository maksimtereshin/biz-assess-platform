# Production Deployment Guide

Comprehensive guide for deploying biz-assess-platform to Render.com.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Deployment Steps](#deployment-steps)
- [Post-Deployment Verification](#post-deployment-verification)
- [Cost Breakdown](#cost-breakdown)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)

---

## Overview

The biz-assess-platform consists of four main services deployed on Render.com:

1. **Backend API** (NestJS) - Telegram bot and API server
2. **Frontend** (React + Vite) - Static site for Telegram WebApp
3. **PostgreSQL Database** - Managed database service
4. **Kottster Admin Panel** - Low-code admin interface for data management

**Total Monthly Cost:** $21/month ($7 backend + $0 frontend + $7 database + $7 admin panel)

---

## Architecture

**Service URLs:**
- Frontend: `https://biz-assess-platform.onrender.com`
- Backend API: `https://bizass-backend.onrender.com`
- Admin Panel: `https://bizass-admin-panel.onrender.com`
- Database: Internal only (not publicly accessible)

---

## Prerequisites

### 1. GitHub Repository

Ensure your code is pushed to GitHub:
```bash
git status
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### 2. Telegram Bot Token

Get your bot token from [@BotFather](https://t.me/BotFather):
1. Send `/newbot` to BotFather
2. Follow the prompts to create your bot
3. Save the bot token (format: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 3. Generate Secure Secrets

Generate secure random values for Kottster admin panel:

```bash
# Generate secret key (32 bytes)
openssl rand -base64 32

# Generate API token (32 bytes)
openssl rand -base64 32

# Generate JWT salt (16 bytes)
openssl rand -base64 16
```

Save these values - you'll need them in Render dashboard.

### 4. Choose Admin Credentials

**CRITICAL:** Do NOT use default `admin/admin` credentials in production.

Choose secure credentials:
- **Username:** Unique, not "admin" (e.g., `admin_yourname_2026`)
- **Password:** Strong password with at least 16 characters

---

## Environment Variables

### Backend Service (bizass-backend)

**Auto-configured by Render:**
- Database credentials (DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME)
- DATABASE_URL, JWT_SECRET, ADMIN_SESSION_SECRET

**Manually set:**
- `TELEGRAM_BOT_TOKEN` - Your bot token from BotFather
- `ADMIN_TELEGRAM_USERNAME` - First admin Telegram username (optional)

### Kottster Admin Panel (bizass-admin-panel)

**Auto-configured:**
- Database credentials
- KOTTSTER_SECRET_KEY, KOTTSTER_JWT_SALT

**Manually set:**
- `KOTTSTER_API_TOKEN` - From `openssl rand -base64 32`
- `ROOT_USERNAME` - Your secure admin username (NOT "admin")
- `ROOT_PASSWORD` - Your strong password (NOT "admin")

---

## Deployment Steps

### Step 1: Connect GitHub to Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Blueprint"
3. Connect your GitHub account
4. Select repository: `your-username/biz-assess-platform`
5. Render will detect `render.yaml`
6. Click "Apply"

### Step 2: Set Manual Environment Variables

#### Backend (bizass-backend)
1. Navigate to bizass-backend → Environment
2. Add:
   - `TELEGRAM_BOT_TOKEN` = `your_bot_token`
   - `ADMIN_TELEGRAM_USERNAME` = `your_username`
3. Save Changes

#### Admin Panel (bizass-admin-panel)
1. Navigate to bizass-admin-panel → Environment
2. Add:
   - `KOTTSTER_API_TOKEN` = `[from openssl]`
   - `ROOT_USERNAME` = `your_secure_username`
   - `ROOT_PASSWORD` = `your_strong_password`
3. Save Changes

### Step 3: Configure Telegram Webhook

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://bizass-backend.onrender.com/api/telegram/webhook"
```

---

## Post-Deployment Verification

### Health Checks

```bash
# Backend
curl https://bizass-backend.onrender.com/api/health

# Frontend headers
curl -I https://biz-assess-platform.onrender.com

# Admin panel
curl https://bizass-admin-panel.onrender.com/
```

### Manual Testing

- [ ] Telegram bot responds to `/start`
- [ ] WebApp opens survey interface
- [ ] Complete survey flow works
- [ ] Admin panel login successful
- [ ] Database tables visible in admin

---

## Cost Breakdown

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| Backend | Starter | $7 |
| Frontend | Free | $0 |
| PostgreSQL | Basic 256MB | $7 |
| Admin Panel | Starter | $7 |
| **Total** | | **$21** |

---

## Troubleshooting

### Backend Issues
- Check logs in Render dashboard
- Verify TELEGRAM_BOT_TOKEN is set
- Test webhook with getWebhookInfo

### Admin Panel Issues
- Verify ROOT_USERNAME and ROOT_PASSWORD
- Check database connection in logs
- Ensure DB_HOST points to PostgreSQL service

### Frontend Issues
- Verify VITE_API_URL points to backend
- Check security headers with curl -I
- Verify sourcemaps are disabled

---

## Security Best Practices

- ✅ Never use `admin/admin` in production
- ✅ Rotate secrets every 90 days
- ✅ Sourcemaps disabled (no code exposure)
- ✅ Security headers configured
- ✅ Database not publicly accessible
- ✅ HTTPS enforced on all services

---

## Support

- [Render Documentation](https://render.com/docs)
- [CLAUDE.md](./CLAUDE.md) - Development guide
- [GitHub Issues](https://github.com/your-repo/issues)

---

**Version:** 1.0 (2026-01-15)