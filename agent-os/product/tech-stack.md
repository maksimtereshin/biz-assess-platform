# Технический стек

## Framework & Runtime
- **Application Framework:** NestJS (backend), React (frontend)
- **Language/Runtime:** Node.js v18+, TypeScript 5.x
- **Package Manager:** npm

## Frontend
- **JavaScript Framework:** React 18 с React Router v6
- **CSS Framework:** Tailwind CSS
- **UI Components:** Кастомные компоненты с Tailwind
- **Сборщик:** Vite
- **State Management:** Zustand
- **HTTP клиент:** Axios с interceptors

## Backend
- **Framework:** NestJS с модульной архитектурой
- **API:** RESTful с JWT аутентификацией
- **Валидация:** class-validator, class-transformer
- **Логирование:** Pino
- **Конфигурация:** @nestjs/config с .env файлами

## Database & Storage
- **Database:** PostgreSQL 15+
- **ORM/Query Builder:** TypeORM
- **Caching:** В памяти (планируется Redis)
- **Миграции:** TypeORM migrations
- **Сессии:** База данных с TTL

## Testing & Quality
- **Test Framework:** Jest (backend), Vitest (frontend)
- **Linting/Formatting:** ESLint, Prettier
- **Pre-commit hooks:** Husky, lint-staged
- **Типизация:** TypeScript strict mode
- **Shared Types:** Monorepo с пакетом bizass-shared

## Deployment & Infrastructure
- **Hosting:** Render.com (PaaS)
- **CI/CD:** Merge в main запускает деплоймент на Render.com
- **Контейнеризация:** Docker, docker-compose
- **Reverse Proxy:** nginx
- **Мониторинг:** Render logs (планируется Sentry)

## Third-Party Services
- **Authentication:** Telegram WebApp SDK, JWT
- **Платежи:** Telegram Payments API
- **AI/ML:** OpenAI API для генерации отчётов
- **PDF генерация:** jsPDF, html2canvas
- **Графики:** Chart.js, react-chartjs-2

## Telegram Integration
- **Bot Framework:** node-telegram-bot-api
- **WebApp SDK:** Telegram WebApp SDK
- **Webhook:** Express middleware для обработки
- **Deep Linking:** URL-based сессии с JWT токенами

## Development Tools
- **Локальная разработка:** Docker Compose
- **Туннелирование:** ngrok для Telegram WebApp тестирования
- **Скрипты:** Bash скрипты для автоматизации (dev.sh)
- **Документация:** Markdown файлы в репозитории

## Архитектурные решения
- **Монорепозиторий:** Единый репозиторий для backend, frontend и shared
- **Модульная архитектура:** NestJS модули для изоляции функциональности
- **Типобезопасность:** Общие типы между frontend и backend
- **Session-based routing:** URL содержат ID сессии для прямого доступа
- **JWT токены:** Короткоживущие для аутентификации, долгоживущие для сессий

## Безопасность
- **CORS:** Настроенный для конкретных доменов
- **Rate Limiting:** Планируется для API endpoints
- **Валидация входных данных:** На уровне DTO в NestJS
- **Шифрование:** HTTPS обязательно, JWT подписи
- **Telegram валидация:** Проверка initData hash