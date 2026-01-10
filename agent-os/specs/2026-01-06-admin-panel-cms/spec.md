# Спецификация: Админ-панель для управления контентом (CMS)

## Цель

Создать полноценную систему управления контентом опросов через AdminJS, позволяющую администраторам создавать, редактировать и публиковать опросы БЕЗ участия разработчиков. Реализовать версионирование опросов для предотвращения поломки активных пользовательских сессий.

## User Stories

- Как администратор, я хочу войти в админ-панель по адресу `/admin` используя мой Telegram username, чтобы управлять опросами без доступа к коду
- Как администратор, я хочу создать новый опрос в статусе "Черновик", чтобы протестировать его перед публикацией для пользователей
- Как администратор, я хочу редактировать опубликованный опрос, чтобы создавалась новая версия и старые сессии пользователей не ломались
- Как администратор, я хочу опубликовать черновик опроса, чтобы новые пользователи видели актуальную версию
- Как администратор, я хочу управлять списком администраторов через UI, чтобы добавлять/удалять доступ к панели
- Как администратор, я хочу видеть историю всех версий опроса с датами публикации, чтобы отследить изменения
- Как разработчик, я хочу чтобы версионирование работало автоматически, чтобы пользователи в активных сессиях продолжали видеть свою версию опроса

## Специфические требования

**Аутентификация и авторизация**
- Новая таблица `admins` с полями: `id`, `telegram_username` (unique), `created_at`, `created_by`
- По умолчанию 2 администратора в seed данных (владелец + Богданов)
- Middleware проверяет username из Telegram initData против списка в таблице `admins`
- AdminJS session management через `express-session` с secure cookies
- Доступ к `/admin` только для пользователей из списка администраторов
- Логирование всех действий администраторов (audit log)

**Версионирование опросов (КРИТИЧНО)**
- Новая таблица `survey_versions` со следующими полями:
  - `id` (PK, auto-increment)
  - `survey_id` (FK to surveys, NOT NULL)
  - `version` (integer, auto-increment per survey, NOT NULL)
  - `name` (varchar 255, NOT NULL)
  - `type` (enum: EXPRESS/FULL, NOT NULL)
  - `structure` (JSONB, NOT NULL)
  - `status` (enum: DRAFT/PUBLISHED/ARCHIVED, default DRAFT)
  - `published_at` (timestamp, nullable)
  - `created_by` (FK to admins, NOT NULL)
  - `created_at` (timestamp, default NOW())
  - `updated_at` (timestamp, default NOW())
- Таблица `surveys` становится мастер-записью с полем `latest_published_version_id` (FK to survey_versions)
- Таблица `survey_sessions` добавляет FK `survey_version_id` (вместо прямой связи с `surveys`)
- При редактировании опубликованной версии создается новый draft с version = MAX(version) + 1
- При публикации версии обновляется `published_at`, статус = PUBLISHED, `surveys.latest_published_version_id` обновляется
- Старые сессии продолжают ссылаться на свою версию через `survey_version_id`
- Soft delete для опросов (поле `deleted_at`)

**CRUD опросов через AdminJS**
- AdminJS resource для `Survey` (мастер-запись)
- AdminJS resource для `SurveyVersion` (редактируемые версии)
- Custom action "Создать новую версию" — клонирует текущую версию в новый draft
- Custom action "Опубликовать версию" — меняет статус на PUBLISHED, обновляет `latest_published_version_id`
- Custom action "Снять с публикации" — меняет статус на ARCHIVED
- List view показывает: название, тип, текущую версию, статус, дату публикации, автора
- Edit view для редактирования JSONB структуры (категории → подкатегории → вопросы)
- Валидация структуры перед сохранением (проверка unique ID, обязательных полей)

**Управление структурой опроса**
- Иерархия: `Survey → Categories → Subcategories → Questions → AnswerOptions`
- Custom компонент для редактирования JSONB структуры (дерево с категориями/вопросами)
- Типы вопросов: только scale (1-10) в v1
- AnswerOption содержит: `id`, `text`, `value` (1-10), `color` (hex), `range` (строка)
- Валидация: уникальность ID категорий/подкатегорий/вопросов, обязательные поля, правильность диапазона значений

**Workflow черновик → публикация**
- Новый опрос создается со статусом DRAFT
- Редактирование draft не влияет на пользователей
- Кнопка "Опубликовать" делает версию PUBLISHED и доступной пользователям
- Редактирование PUBLISHED версии создает новый DRAFT (version + 1)
- Кнопка "Снять с публикации" меняет статус на ARCHIVED (скрывает от новых пользователей)

**Управление администраторами**
- AdminJS resource для таблицы `admins`
- CRUD операции: добавить/удалить администратора по Telegram username
- Self-reference FK `created_by` для отслеживания кто добавил администратора
- Предотвращение удаления последнего администратора (валидация)
- Отображение даты добавления и автора

**Визуальный предпросмотр**
- Custom компонент показывает структуру опроса в виде дерева
- Отображение категорий → подкатегорий → вопросов → ответов
- Подсветка некорректных данных (отсутствующие поля, неправильные ID)
- Кнопка "Предпросмотр" в edit view

**Интеграция с существующей системой**
- API endpoint `GET /api/surveys/:type/latest` возвращает последнюю PUBLISHED версию из `survey_versions`
- Метод `SurveyService.createNewSession()` использует `latest_published_version_id` и сохраняет `survey_version_id` в `survey_sessions`
- Существующий метод `SurveyService.getSurveyStructure()` переписывается для работы с версиями
- Shared types `Survey` остаются без изменений (только добавляются новые для AdminJS)

## Visual Design

Визуальные материалы относятся к общей системе (TroubleshooterBot, Calendar, Reports), НЕ к конкретному UI админ-панели. AdminJS использует стандартные компоненты с минимальной кастомизацией.

**`planning/visuals/highlevel-system-overview-sketch.png`**
- Показывает общую архитектуру системы: Admin Panel → TroubleshooterBot → Telegram WebApp → Surveys (Express/Full)
- Admin Panel управляет настройками календаря и сохраняет данные клиентов для аналитики
- Admin взаимодействует с системой через отдельный интерфейс
- Связь между Telegram ботом и опросами (Report Structure PDF, Payment Gateway, Referral Link, Retakes of Surveys)

## Existing Code to Leverage

**TypeORM Entities**
- `Survey` entity (`backend/src/entities/survey.entity.ts`) — текущая структура с JSONB полем `structure`
- Будет расширена: добавить поле `latest_published_version_id` (FK), `deleted_at` для soft delete
- Связь `OneToMany` с `SurveyVersion` entity
- Использовать существующий pattern с `@Entity`, `@Column`, `@OneToMany`

**Shared Types**
- `shared/src/types/survey.types.ts` содержит полную типизацию: `Survey`, `SurveyCategory`, `SurveySubcategory`, `SurveyQuestion`, `AnswerOption`
- Использовать эти типы для валидации JSONB структуры в AdminJS
- Не требуется изменений в shared types (версии — только backend concern)
- Типы используются для type-safe работы с AdminJS resources

**SurveyService**
- `backend/src/survey/survey.service.ts` — существующая логика создания сессий и получения структуры
- Метод `createNewSession()` (строки 34-77) — добавить сохранение `survey_version_id` в `survey_sessions`
- Метод `getSurveyStructure()` (строки 119-131) — переписать для чтения из `survey_versions` вместо JSON файла
- Использовать паттерн `@InjectRepository` для новых entities (`SurveyVersion`, `Admin`)

**TypeORM Patterns**
- Использовать существующий database connection из `app.module.ts`
- Следовать паттерну с миграциями (`typeorm migration:create`, `typeorm migration:run`)
- Индексы для производительности (пример: `@Index()` на часто запрашиваемых полях)
- Query Builder для эффективных запросов (пример из `getUserSessions()`)

**NestJS Module Structure**
- Создать новый модуль `admin` в `backend/src/admin/`
- Структура: `admin.module.ts`, `admin.controller.ts`, `admin.service.ts`
- Импортировать `TypeOrmModule.forFeature([SurveyVersion, Admin])` в `AdminModule`
- Интеграция AdminJS через middleware в `main.ts`

## Technical Approach

**AdminJS Integration с NestJS**
- Установить зависимости: `adminjs@^7.x`, `@adminjs/nestjs@^6.x`, `@adminjs/typeorm@^5.x`, `express-session@^1.x`
- Создать `AdminModule` с использованием `@adminjs/nestjs` package
- AdminJS ресурсы автоматически генерируются из TypeORM entities с помощью `@adminjs/typeorm` adapter
- Custom компоненты для редактирования JSONB (React компоненты в `adminjs-components/`)
- Маршрут `/admin` через `AdminJS.bundle()` и Express middleware

**Database Migration Strategy**
- Миграция #1: Создать таблицы `survey_versions` и `admins`
- Миграция #2: Мигрировать существующие опросы в `survey_versions` (создать версию 1 для каждого)
- Миграция #3: Добавить FK `survey_version_id` в `survey_sessions`, заполнить значениями из существующих данных
- Миграция #4: Добавить `latest_published_version_id` и `deleted_at` в `surveys`
- Rollback план: каждая миграция имеет метод `down()` для отката изменений

**JSONB Performance Optimization**
- GIN индекс на `survey_versions.structure` для быстрого поиска по JSONB
- Partial index на `status = 'PUBLISHED'` для быстрого получения активных версий
- Кеширование последней опубликованной версии в памяти (TTL 5 минут, invalidation при публикации)
- Валидация JSONB структуры перед сохранением (предотвращает некорректные данные)

**Validation & Security**
- Class-validator decorators для валидации DTO
- Custom validators для JSONB структуры (проверка соответствия `SurveyCategory[]` интерфейсу)
- Предотвращение SQL injection через TypeORM prepared statements
- CSRF protection для AdminJS forms
- Только HTTPS в production (настроено на Render.com)

## Out of Scope

- Управление пользователями и сессиями через админку (только в Phase 3)
- Аналитические дашборды и статистика (Phase 3)
- Управление платежами и отчетами через админ-панель (Phase 3)
- A/B тестирование различных формулировок вопросов (Phase 4)
- Типы вопросов: multiple choice, single choice, text input (добавятся в Phase 2.5)
- Настройка весов вопросов/категорий (используются фиксированные равные веса)
- Drag-and-drop конструктор опросов (AdminJS использует стандартные формы)
- Кастомизация UI AdminJS (используем out-of-the-box компоненты)
- Email уведомления администраторам при изменениях (Phase 3)
- Детальный audit log с diff версий (базовое логирование в v1, расширенное в Phase 3)
