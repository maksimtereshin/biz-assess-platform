---
name: Global Validation
description: Implement comprehensive input validation with server-side validation (security), client-side validation (UX), fail-early patterns (KISS), specific error messages, allowlists over blocklists, and reusable validators (DRY). Use this skill when validating user input in forms, API endpoints, or data processing functions. Use when implementing validation rules for data types, formats, ranges, required fields, or business rules (SRP). Use when creating validator functions, validation schemas (Zod, Joi, Yup), form validation logic, or input sanitization to prevent injection attacks (SQL, XSS). Use when working with backend validators, frontend form libraries (React Hook Form, Formik), or consistent validation across web forms, API endpoints, and background jobs. Apply validation at multiple layers for defense in depth.
---

# Global Validation

This Skill provides Claude Code with specific guidance on input validation best practices across backend and frontend, including KISS, SRP, and DRY principles.

## When to use this skill

- When implementing input validation for user-submitted data
- When validating data in API endpoints, controllers, or route handlers
- When creating form validation logic in frontend components
- When writing validation schemas (Zod, Joi, Yup, class-validator)
- When validating data types, formats, ranges, or required fields
- When implementing business rule validation at appropriate application layers (SRP)
- When creating reusable validator functions or classes (DRY)
- When sanitizing user input to prevent injection attacks (SQL, XSS, command injection)
- When failing early and rejecting invalid data before processing (KISS)
- When providing clear, field-specific error messages to users
- When using allowlists instead of blocklists for input validation
- When ensuring consistent validation across all entry points (web forms, API, background jobs)
- When working with form libraries (React Hook Form, Formik, Angular Forms)
- When implementing server-side validation for security and client-side for UX

## Instructions

For details, refer to the information provided in this file:
[global validation](../../../agent-os/standards/global/validation.md)
