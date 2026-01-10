# Tech Stack Documentation

## Overview

Biz Assess Platform использует современный монорепозиторий с разделением на backend (NestJS), frontend (React), и shared (общие TypeScript типы). Вся инфраструктура контейнеризирована с Docker и задеплоена на Render.com.

---

## Backend Stack

### Core Framework
- **NestJS** (v10+)
  - Выбор: Модульная архитектура, встроенная поддержка TypeScript, DI контейнер, отличная поддержка REST API и WebSockets
  - Используется для: API endpoints, бизнес-логика, интеграция с внешними сервисами

### Database & ORM
- **PostgreSQL** (v15+)
  - Выбор: Надежность, ACID-транзакции, rich типизация, отличная производительность для реляционных данных
  - Используется для: Хранение пользователей, опросов, сессий, ответов, платежей

- **TypeORM** (v0.3+)
  - Выбор: Нативная поддержка TypeScript, декларативные entities, миграции, Active Record pattern
  - Используется для: Entities (User, Survey, SurveySession, Answer), миграции, query builder

### Authentication & Security
- **JWT (jsonwebtoken)**
  - Используется для: Аутентификация пользователей Telegram через initData
  - Двухуровневая система: короткие JWT токены + долгоживущие session tokens

- **Passport.js**
  - Используется для: Стратегии аутентификации, middleware для защиты роутов

### External Integrations
- **Telegram Bot API** (node-telegram-bot-api)
  - Используется для: Webhook обработка, отправка сообщений, inline keyboards, WebApp buttons
  - Команды: `/start`, `/help`, `/reports`, `/referral`

- **Telegram Payments API**
  - Используется для: Прием оплаты за премиум-отчеты (500₽), обработка callback query

### Logging & Monitoring
- **Pino**
  - Выбор: Высокая производительность, структурированные логи (JSON), минимальный overhead
  - Используется для: Request/response logging, error tracking, debugging

### Testing
- **Jest**
  - Используется для: Unit tests, integration tests, e2e tests
  - Coverage: сервисы, контроллеры, entities

---

## Frontend Stack

### Core Framework
- **React** (v18+)
  - Выбор: Индустриальный стандарт, богатая экосистема, отличная поддержка TypeScript
  - Используется для: UI компоненты, страницы опросов, результаты

- **Vite** (v5+)
  - Выбор: Быстрый HMR, нативный ESM, оптимизированный production build
  - Используется для: Development server, production build

### State Management
- **Zustand**
  - Выбор: Минималистичный, без boilerplate, отличная поддержка TypeScript
  - Stores: auth store (токены, пользователь), survey store (прогресс, ответы)
  - Persistent storage: LocalStorage для auth tokens

### Styling
- **Tailwind CSS** (v3+)
  - Выбор: Utility-first, быстрая разработка, минимальный CSS bundle, responsive by default
  - Используется для: Все UI компоненты, responsive design, Telegram WebApp themes

### HTTP Client
- **Axios**
  - Используется для: API calls, interceptors (автоматическая инъекция токенов), error handling
  - Централизованный клиент в `services/api.ts`

### Testing
- **Vitest**
  - Выбор: Совместимость с Vite, быстрая работа, Jest-compatible API
  - Используется для: Component tests, utility tests, hooks tests

### Linting & Formatting
- **ESLint**
  - Используется для: Code quality, React best practices, TypeScript rules

- **Prettier**
  - Используется для: Code formatting, consistency

---

## Shared Package

### Type System
- **TypeScript** (v5+)
  - Strict mode enabled для максимальной type safety
  - Используется для: Shared types, interfaces, enums между frontend и backend

### Shared Types
- **bizass-shared** (internal package)
  - Типы: `User`, `Survey`, `SurveySession`, `Answer`, `Report`, `Payment`
  - Обеспечивает type safety между frontend и backend, предотвращает drift

---

## DevOps & Infrastructure

### Containerization
- **Docker** (v24+)
  - Multi-stage builds для оптимизированных production images
  - Сервисы: backend, frontend, PostgreSQL
  - Development: `./dev.sh` скрипт для управления Docker Compose

### Deployment
- **Render.com**
  - Blueprint deployment через `render.yaml`
  - Сервисы:
    - PostgreSQL Database (managed)
    - Backend API (Docker container)
    - Frontend Static Site (nginx)

### Web Server
- **nginx**
  - Используется для: Frontend static hosting, API reverse proxy, SSL termination
  - Конфигурация в `frontend/nginx.conf`

### CI/CD
- **Husky + lint-staged**
  - Pre-commit hooks: автоматический lint и format
  - Предотвращает коммиты с ошибками

---

## MCP (Model Context Protocol) Integration

### Tier 1: Essential Development Tools
- **PostgreSQL/Database (DBHub)**
  - Используется для: Инспекция схемы базы данных, выполнение SELECT запросов
  - Read-only пользователь: `readonly_claude` (password: `claude_readonly_2026`)

- **GitHub MCP**
  - Используется для: Code review, issue management, PR workflows
  - Требует: Personal Access Token с scopes `repo`, `read:org`, `workflow`

- **Git MCP**
  - Используется для: Локальное управление репозиторием, автоматические коммиты

- **Context7**
  - Используется для: Запросы актуальной документации фреймворков (NestJS, React, TypeORM)
  - Лимит: Максимум 3 запроса на task group

- **Playwright**
  - Используется для: Browser testing, visual verification, UI тестирование
  - MANDATORY для всех UI tasks

- **IDE Diagnostics**
  - Используется для: TypeScript/ESLint error detection
  - MANDATORY после изменений кода

### Tier 2: Workflow Enhancement
- **File System MCP**
  - Используется для: Monorepo-aware file operations

- **Memory MCP**
  - Используется для: Persistent project context, architectural decisions

- **Docker MCP**
  - Используется для: Container lifecycle management

### Tier 3: Advanced Capabilities (Optional)
- **Sequential Thinking MCP**
  - Используется для: Complex problem decomposition, multi-step reasoning
  - Optional: Только для genuinely complex features

- **Telegram MCP**
  - Используется для: Testing bot commands без ngrok, validating message formats
  - Backend only: Ограничено bot API capabilities

---

## Phase 2 Tech Stack Additions (Next 3 Months)

### Admin Panel (PRIORITY)

Для реализации CMS-системы управления опросами рассматриваются следующие варианты:

#### Option 1: AdminJS (Recommended)
- **Pros:**
  - Автоматическая генерация admin UI из TypeORM entities
  - Нативная интеграция с NestJS
  - Customizable: можно добавлять custom actions, pages
  - Authentication из коробки
  - WYSIWYG редактор для контента

- **Cons:**
  - Ограниченные возможности визуального конструктора опросов
  - Может потребоваться custom UI для сложных конфигураций

- **Stack:**
  - `@adminjs/nestjs` — NestJS адаптер
  - `@adminjs/typeorm` — TypeORM адаптер
  - `adminjs` — Core library

#### Option 2: React Admin
- **Pros:**
  - Полностью кастомизируемый frontend
  - Rich ecosystem компонентов
  - Поддержка drag-and-drop для конструктора опросов

- **Cons:**
  - Требует отдельного REST API для админки
  - Больше кода для написания
  - Отдельный frontend bundle

- **Stack:**
  - `react-admin` — Frontend framework
  - Custom NestJS REST API для админки
  - `react-dnd` — Drag-and-drop для конструктора

#### Option 3: Custom Solution (Headless CMS)
- **Pros:**
  - Максимальная гибкость
  - Точное соответствие требованиям

- **Cons:**
  - Долгая разработка
  - Больше maintenance
  - Нужно писать все с нуля

**Рекомендация:** **AdminJS** для Phase 2 с возможностью миграции на Custom Solution в Phase 3/4 при необходимости более продвинутого конструктора опросов.

### Booking System (Запись на встречи)

#### Google Calendar API Integration
- **Используется для:**
  - Синхронизация доступных слотов экспертов
  - Создание events при бронировании
  - Отправка calendar invites

- **Stack:**
  - `googleapis` (Node.js client)
  - OAuth2 для аутентификации
  - Webhook для изменений в календаре
  - `node-cron` — планирование отправки напоминаний за 24ч и 1ч до встречи
  - Telegram Bot API — отправка уведомлений

#### Alternative: Calendly API
- **Pros:**
  - Готовое решение для booking
  - Встроенная логика слотов, напоминаний

- **Cons:**
  - Внешняя зависимость
  - Платный план для API доступа

**Рекомендация:** Google Calendar API для полного контроля и бесплатного использования.

### Notifications
- **Telegram Bot API** — уведомления за 24ч и 1ч до встречи
- **node-cron** — планирование отправки напоминаний
- **Optional:** Email notifications через SendGrid/AWS SES для отправки PDF отчетов

---

## Development Tools

### Code Quality
- **TypeScript Strict Mode** — максимальная type safety
- **ESLint** — code quality rules
- **Prettier** — consistent formatting
- **Husky** — pre-commit hooks

### Monitoring & Debugging
- **Pino** — structured logging
- **Render.com Logs** — centralized log aggregation
- **Optional (Future):** Sentry для error tracking

### Database Management
- **TypeORM CLI** — миграции, schema sync
- **./dev.sh db** — быстрый доступ к PostgreSQL shell
- **pgAdmin** (optional) — GUI для database management

### Local Development
- **Docker Compose** — локальная разработка с полным стеком
- **ngrok** — туннелирование для тестирования Telegram WebApp
- **./dev.sh** — Bash скрипты для автоматизации (up, down, rebuild, logs)

---

## Security Best Practices

### Secrets Management
- **Environment Variables** — все секреты в `.env` (git-ignored)
- **Render.com Environment Variables** — production secrets
- **MCP Configuration** — `.mcp.json` содержит credentials (git-ignored)

### Database Security
- **Read-only MCP User** — `readonly_claude` с SELECT-only permissions
- **Connection Limit** — max 5 concurrent connections для MCP
- **Prepared Statements** — TypeORM защищает от SQL injection

### API Security
- **JWT Short-Lived Tokens** — короткие JWT для initial auth
- **Session Tokens** — долгоживущие токены для API access
- **CORS** — настроен для конкретных доменов
- **Telegram Validation** — проверка initData hash
- **HTTPS** — обязательно для production
- **Rate Limiting** (TODO Phase 3) — защита от abuse

---

## Performance Optimization

### Backend
- **Connection Pooling** — PostgreSQL connection pool в TypeORM
- **Caching** (TODO Phase 3) — Redis для кеширования отчетов, session data
- **Query Optimization** — TypeORM query builder для эффективных запросов

### Frontend
- **Code Splitting** — Vite автоматически split chunks
- **Lazy Loading** — React.lazy для survey components
- **Bundle Optimization** — Vite production build минимизирует bundle size

### Database
- **Indexes** — на часто запрашиваемых полях (telegram_id, session_id)
- **Migrations** — структурированные изменения схемы

---

## Future Tech Stack Considerations

### Phase 3/4 Additions

- **Redis** — для caching, session storage, rate limiting
- **Sentry** — error tracking и monitoring
- **AWS S3** — хранение PDF отчетов (вместо in-memory генерации)
- **ElasticSearch** — для поиска по отчетам, analytics
- **GraphQL** (optional) — для более flexible API если frontend требует
- **Microservices** (Phase 4) — если нужно scaling: отдельные сервисы для payments, reports, analytics

---

## Version History

- **v1.0 (Initial)** — Foundation tech stack: NestJS, React, PostgreSQL, Telegram Bot API, Docker, Render.com
- **v1.1 (MCP Integration)** — Added MCP servers: PostgreSQL DBHub, GitHub, Context7, Playwright, IDE Diagnostics
- **v1.2 (Phase 2 Planning)** — AdminJS для CMS, Google Calendar API для booking system, node-cron для напоминаний
