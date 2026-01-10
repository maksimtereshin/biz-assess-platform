---
name: Backend Migrations
description: Create and manage database migrations with reversible up/down methods, zero-downtime deployment strategies, and proper schema versioning. Use this skill when creating database migration files, altering table schemas, adding or modifying database indexes, or implementing data migrations. Use when working with migration tools like TypeORM migrations, Sequelize migrations, Alembic (Python), Rails migrations, Flyway, or Liquibase. Use when writing migration files (e.g., YYYYMMDDHHMMSS_migration_name.ts, 001_create_table.sql, versions/*.py) or when modifying database schema in a version-controlled manner. Use when handling backwards compatibility for high-availability deployments or when separating schema changes from data migrations.
---

# Backend Migrations

This Skill provides Claude Code with specific guidance on how to adhere to coding standards for database migrations and schema versioning.

## When to use this skill

- When creating new database migration files for schema changes
- When working with migration files (.ts, .js, .py, .sql) in migrations directories
- When altering table structures (adding/removing columns, changing types)
- When creating or modifying database indexes on tables
- When implementing data migrations or backfilling existing data
- When writing reversible migration rollback methods (down/rollback functions)
- When handling zero-downtime deployments with backwards-compatible schema changes
- When separating schema changes from data transformations
- When using migration tools (TypeORM, Sequelize, Alembic, Rails Active Record, Flyway, Liquibase)
- When managing database version control and migration history

## Instructions

For details, refer to the information provided in this file:
[backend migrations](../../../agent-os/standards/backend/migrations.md)
