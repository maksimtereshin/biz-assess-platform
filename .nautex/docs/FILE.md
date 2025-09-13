Document: Files Tree [FILE]
  └── Files Tree
      ├── .github                                 // Directory for CI/CD pipelines as per DevOps requirements.
      ├── backend                                 // Directory for the Core API (backend) application.
      │   ├── src                                 // Backend source code directory.
      │   │   ├── main.ts                         // Initializes and bootstraps the NestJS backend.
      │   │   ├── app.module.ts                   // Imports and configures all other application modules.
      │   │   ├── auth                            // Module for authentication and authorization logic.
      │   │   ├── common                          // Common utilities for the backend application.
      │   │   │   └── utils                       // Directory for backend utility helpers.
      │   │   │       ├── analytics-calculator.util.ts     // Implements the analytics calculation formula.
      │   │   │       └── pdf-generator.util.ts     // Implements the PDF generation logic for reports.
      │   │   ├── payment                         // Module for all payment-related logic.
      │   │   ├── report                          // Module for report generation logic.
      │   │   ├── survey                          // Module for core survey functionality.
      │   │   │   ├── survey.controller.ts        // Exposes endpoints for starting surveys and submitting answers.
      │   │   │   ├── survey.service.ts           // Manages survey sessions, answers, and completion.
      │   │   │   └── dto                         // Defines shapes for survey API request bodies.
      │   │   └── telegram                        // Telegram Bot gateway module.
      │   ├── Dockerfile                          // Containerization setup for the Core API.
      │   └── .env.example                        // Template for backend environment variables.
      ├── frontend                                // Directory for the React web application (frontend).
      │   ├── src                                 // Frontend source code directory.
      │   │   ├── components                      // Directory for shared UI components.
      │   │   │   └── survey                      // UI components related to the survey taking experience.
      │   │   │       ├── ProgressBar.tsx         // Renders overall and category progress bars.
      │   │   │       ├── QuestionCard.tsx        // Handles question display and answer submission.
      │   │   │       └── SurveyHeader.tsx        // Displays current category and subcategory.
      │   │   ├── pages                           // Directory for main application views or pages.
      │   │   ├── services                        // API client services.
      │   │   └── store                           // Global state management for the frontend.
      │   ├── Dockerfile                          // Containerization setup for the web application.
      │   ├── tailwind.config.js                  // Defines the design system tokens for styling.
      │   └── vite.config.ts                      // Build tool configuration for the frontend application.
      ├── shared                                  // Shared data models to ensure type safety (DRY).
      │   └── src                                 // Contains the source files for the shared package.
      │       └── types                           // Directory for all shared data model interfaces.
      │           └── survey.types.ts             // Defines core models like User, Survey, SurveySession.
      ├── docker-compose.yml                      // Defines services for local development environment.
      └── README.md                               // Main project documentation file.