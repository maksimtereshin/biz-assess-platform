# Raw Feature Idea: Admin Panel for Content Management (CMS)

## Original Description (from Product Roadmap)

**Админ-панель для управления контентом (CMS)** — Система для создания и редактирования опросов, вопросов, ответов, категорий БЕЗ привлечения разработчика. Админ заходит в систему → конфигурирует опросы → изменения применяются автоматически.

### Key Requirements

Включает:
- CRUD опросов (Express/Full/отраслевые)
- Управление вопросами с типами (single choice, multiple choice, scale)
- Настройка категорий и весов для расчета результатов
- Визуальный редактор с предпросмотром

### Technical Recommendation

Рекомендуемая технология: AdminJS с TypeORM интеграцией.

### Priority & Complexity

- Priority: Critical (Phase 2)
- Complexity: XL
- Phase: Phase 2: Admin Panel & Core Features — NEXT 3 MONTHS (PRIORITY)

## Context

This is the first critical feature in Phase 2 of the product roadmap. The admin panel will enable non-developers to create and manage survey content, which is essential for scaling the product without constant developer involvement.

Current system requires hardcoded surveys in the database via migrations/seeds. The goal is to replace this with a user-friendly CMS where admins can:
1. Create new surveys (Express, Full, industry-specific)
2. Manage questions with different types (single choice, multiple choice, scale)
3. Configure categories and weights for result calculations
4. Preview changes before publishing
5. Apply changes automatically without database migrations

## Date Initialized

2026-01-14
