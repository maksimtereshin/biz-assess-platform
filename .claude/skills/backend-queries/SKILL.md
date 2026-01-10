---
name: Backend Queries
description: Write optimized and secure database queries using parameterized queries, eager loading, strategic indexing, and proper transaction management. Use this skill when writing database queries, repository methods, or data fetching logic that interacts with SQL or NoSQL databases. Use when implementing query builders, ORM query methods, raw SQL queries, or database service functions. Use when working with files containing database access code (repositories.ts, services.ts, queries.py, dao.java), when optimizing N+1 query problems, implementing query caching strategies, or writing queries with JOINs and WHERE clauses. Use when preventing SQL injection vulnerabilities, setting up query timeouts, or wrapping related operations in database transactions.
---

# Backend Queries

This Skill provides Claude Code with specific guidance on how to adhere to coding standards for writing secure and optimized database queries.

## When to use this skill

- When writing database query code in services, repositories, or data access layers
- When working with files containing database queries (services.ts, repositories.ts, queries.py, dao.java, etc.)
- When using query builders or ORM query methods (TypeORM QueryBuilder, Sequelize queries, SQLAlchemy queries)
- When writing raw SQL queries or stored procedure calls
- When optimizing N+1 query problems with eager loading or joins
- When selecting specific columns instead of using SELECT *
- When implementing query caching for expensive or frequent queries
- When wrapping related database operations in transactions
- When adding indexes to optimize WHERE, JOIN, or ORDER BY clauses
- When preventing SQL injection by using parameterized queries
- When setting query timeouts to prevent runaway queries
- When implementing pagination or data filtering logic

## Instructions

For details, refer to the information provided in this file:
[backend queries](../../../agent-os/standards/backend/queries.md)
