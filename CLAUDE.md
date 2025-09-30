# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- NAUTEX_SECTION_START -->

# Nautex MCP Integration

This project uses Nautex Model-Context-Protocol (MCP). Nautex manages requirements and task-driven LLM assisted development.

Whenever user requests to operate with nautex, the following applies:

- read full Nautex workflow guidelines from `.nautex/CLAUDE.md`
- note that all paths managed by nautex are relative to the project root
- note primary workflow commands: `next_scope`, `tasks_update`
- NEVER edit files in `.nautex` directory

<!-- NAUTEX_SECTION_END -->

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

## Development Commands

### Build & Development
```bash
# Development environment (recommended)
./dev.sh up                    # Start all services with Docker
./dev.sh down                  # Stop all services
./dev.sh logs                  # View logs
./dev.sh rebuild               # Full rebuild

# Backend (NestJS)
cd backend
npm run start:dev              # Development server with hot reload
npm run build                  # Production build
npm run test                   # Run Jest tests
npm run test:watch             # Watch mode testing
npm run lint                   # ESLint with auto-fix

# Frontend (React + Vite)
cd frontend
npm run dev                    # Development server (Vite)
npm run build                  # Production build (tsc + vite build)
npm run test                   # Run Vitest tests
npm run lint                   # ESLint
npm run type-check             # TypeScript type checking

# Shared package
cd shared
npm run build                  # Build shared types
```

### Database Operations
```bash
./dev.sh db                    # Access PostgreSQL shell
# Or manually:
docker exec -it bizass-postgres-dev psql -U postgres -d bizass_platform
```

## Architecture Overview

### Monorepo Structure
- **backend/**: NestJS API server with modular architecture
- **frontend/**: React SPA with Vite, Tailwind CSS, and Zustand state management
- **shared/**: Common TypeScript types and interfaces used by both frontend and backend

### Key Modules (Backend)
- **auth/**: JWT authentication and Telegram user validation
- **survey/**: Survey structure management and session handling
- **telegram/**: Telegram Bot API integration and webhook handling
- **payment/**: Telegram Payments integration for premium reports
- **report/**: PDF report generation with charts
- **entities/**: TypeORM database entities

### Frontend Architecture
- **components/**: Reusable UI components (AuthPrompt, QuestionScreen, etc.)
- **pages/**: Route-level components (ExpressPage, FullPage)
- **store/**: Zustand stores for global state (auth, survey progress)
- **services/**: API client (axios-based) and external service integrations
- **hooks/**: Custom React hooks (useAuthPrompt, survey navigation)

## Key Technologies & Patterns

### Shared Types System
The `shared` package provides type safety between frontend and backend:
```typescript
// Import shared types in both frontend and backend
import { Survey, SurveySession, User } from 'bizass-shared';
```

### Authentication Flow
1. **Telegram WebApp**: Users authenticate via Telegram initData
2. **JWT Tokens**: Short-lived tokens for initial authentication
3. **Session Tokens**: Longer-lived tokens for API access
4. **URL Token Handling**: Frontend parses tokens from URL parameters for bot integration

### API Client Patterns
- Centralized axios client in `frontend/src/services/api.ts`
- Automatic token injection via interceptors
- Error handling with auth store integration
- 401 responses trigger Telegram authentication prompts

### State Management (Zustand)
- **auth store**: Authentication state, user data, token management
- **survey store**: Survey progress, current question, answers
- Persistent storage for auth tokens and user data

## Telegram Bot Integration

### Bot Architecture
- **Webhook Endpoint**: `/api/telegram/webhook` handles all Telegram updates
- **Authentication**: Bot generates JWT tokens for WebApp access
- **Commands**: `/start`, `/help`, `/reports`, `/referral`
- **WebApp Buttons**: Direct links to surveys with authentication tokens

### WebApp Flow
1. User clicks WebApp button in Telegram
2. Frontend URL includes `?token=<jwt>&type=<express|full>`
3. Auth store processes URL token and authenticates user
4. User redirected to appropriate survey (`/express` or `/full`)

### Key Bot Methods
- `handleWebhook()`: Main webhook processor
- `generateAuthToken()`: Creates JWT for user
- `sendMessageWithKeyboard()`: Sends interactive messages
- `getBotInfo()`: Returns bot username for deep linking

## Deployment & Production

### Render.com Blueprint Deployment
- Configured via `render.yaml` for automatic deployment
- **Services**: PostgreSQL database, backend API, frontend static site
- **Environment**: Set `TELEGRAM_BOT_TOKEN` manually in Render dashboard
- **URLs**:
  - Backend: `https://bizass-backend.onrender.com`
  - Frontend: `https://bizass-frontend.onrender.com`

### Docker Configuration
- **Multi-stage builds** for optimized production images
- **nginx** reverse proxy for frontend with API proxying
- **Environment-aware**: Different configs for dev vs production

### Database Setup
- PostgreSQL with TypeORM migrations
- Auto-seeding of survey data on startup
- Connection via environment variables or Docker networking

## Important Development Notes

### Error Handling Patterns
- API client automatically handles 401 errors by triggering Telegram auth
- Frontend shows user-friendly prompts instead of raw error messages
- Backend uses structured logging (Pino) for debugging

### Environment Configuration
- Frontend uses `VITE_*` prefixed environment variables
- Backend reads from `.env` file or environment
- Different API URLs for development vs production

### Code Quality
- **Pre-commit hooks**: Husky + lint-staged for automatic formatting
- **ESLint**: Configured for both frontend and backend
- **TypeScript**: Strict mode enabled, shared types prevent drift
- **Prettier**: Consistent code formatting across monorepo

### Testing Strategy
- **Backend**: Jest unit and integration tests
- **Frontend**: Vitest for component and utility testing
- **E2E**: Manual testing via Telegram WebApp integration

### Local Development with Telegram WebApp

#### Option 1: Using ngrok (Recommended for Telegram testing)
```bash
# Install ngrok globally
npm install -g ngrok

# Start your development environment
./dev.sh up

# In a new terminal, expose frontend to internet
ngrok http 3000

# Copy the https URL (e.g., https://abc123.ngrok-free.app)
# Set this URL as your Telegram bot's WebApp URL via BotFather
# Open your bot in Telegram and test the WebApp
```

#### Option 2: Development Token Mode (For API testing without Telegram)
When running locally without Telegram WebApp context, the app will:
1. Try Telegram authentication first
2. Fallback to development token generation using `/api/auth/generate-token`
3. Create a test user with ID `123456789`

**Note**: The app will show authentication prompts when not accessed through Telegram, which is the intended behavior for security.

### Common Gotchas
- Always use shared types from `bizass-shared` package
- Frontend API calls must handle authentication flow properly
- **App should only be accessed through Telegram WebApp in production**
- For local development, use ngrok + Telegram bot or development token fallback
- nginx proxy configuration critical for frontend API routing
- URL token parameters must be cleaned after authentication
- This session is being continued from a previous conversation that ran out of context. The conversation is summarized below:
Analysis:
Looking at this conversation chronologically:

1. Initial user request showed two screenshots of a survey selection screen and requested implementation of survey selection with session-based routing. The requirements were:
   - When selecting a survey, clear session data and start a new survey
   - Navigate to `/survey_type/:session_id` (e.g., `/express/abc123`)
   - When survey completes, navigate to `/:surveyType/:sessionId/results`

2. I used the implementation-strategist agent to create a comprehensive plan, analyzing the existing codebase and proposing a phased implementation approach.

3. After analyzing the current code structure, I examined:
   - SurveySelectionScreen.tsx - Current selection component that navigates to `/express` or `/full`
   - api.ts - Has `startSurvey` method that creates sessions
   - App.tsx - Current routing uses wildcards `/express/*` and `/full/*`
   - ExpressPage.tsx and FullPage.tsx - Survey pages that use `useSurvey` hook
   - useSurvey.ts - Hook that manages survey state locally

4. Created an implementation plan with 5 phases:
   - Update SurveySelectionScreen to create sessions
   - Update routing to use session IDs
   - Update survey pages to extract session IDs
   - Modify useSurvey hook
   - Completion flow already working

5. User approved the plan with "continue"

6. I started implementation:
   - Created a todo list with 6 tasks
   - Updated SurveySelectionScreen to make handleSelectVariant async, create sessions via API, and navigate with session ID
   - Added loading state to prevent multiple clicks
   - Updated both survey selection buttons to show loading state

7. Encountered TypeScript errors:
   - `isLoading` not being used (fixed by adding it to button disabled state)
   - telegramId type mismatch (string vs number)
   - SurveySession vs UserSession type incompatibility

8. Fixed the first two issues but still working on the UserSession type issue when summary was requested.

The current implementation is partially complete - the survey selection now creates sessions and navigates with session IDs, but there's a remaining type error to fix regarding the UserSession interface missing a userId property.

Summary:
1. **Primary Request and Intent:**
   The user provided screenshots of a survey selection interface and requested implementation where:
   - Selecting a survey type (Express or Full) should clear existing session data and start a new session
   - Navigation should go to `/survey_type/:session_id` (e.g., `/express/abc123` or `/full/xyz789`)
   - After survey completion, automatically navigate to `/:surveyType/:sessionId/results`
   - The user wanted to use the implementation-strategist agent to create a thorough plan

2. **Key Technical Concepts:**
   - Session-based routing with session IDs in URLs
   - Survey session lifecycle management (creation, tracking, completion)
   - React Router parameterized routes
   - TypeScript interfaces for type safety
   - API session creation via POST `/surveys/start`
   - LocalStorage for session persistence
   - Async/await for API calls
   - Loading states to prevent duplicate submissions

3. **Files and Code Sections:**
   
   - **frontend/src/components/SurveySelectionScreen.tsx**
     - Central component for survey selection
     - Modified to create sessions via API before navigation
     ```typescript
     const handleSelectVariant = async (variant: SurveyVariant) => {
       try {
         setIsLoading(true);
         LocalStorageService.clearCurrentSession();
         const user = LocalStorageService.getCurrentUser();
         const telegramId = user?.telegramId ? parseInt(user.telegramId) : undefined;
         const { session, sessionToken } = await api.startSurvey(variant, telegramId);
         // Create UserSession object and navigate
         navigate(`/${variant}/${session.id}`);
       } catch (error) {
         console.error('Error starting survey:', error);
         navigate(`/${variant}`); // Fallback
       }
     }
     ```
     - Added loading states to buttons to prevent multiple clicks

   - **frontend/src/services/api.ts** (read, lines 180-197)
     - Contains `startSurvey` method that creates sessions
     - Returns `{ session: SurveySession; sessionToken: string }`

   - **frontend/src/App.tsx** (read, lines 43-55)
     - Current routing structure uses wildcards: `/express/*` and `/full/*`
     - Needs updating to: `/express/:sessionId` and `/full/:sessionId`

   - **frontend/src/pages/ExpressPage.tsx** (read, lines 10-49)
     - Survey page component using `useSurvey('express')` hook
     - Needs to extract sessionId from URL params

   - **frontend/src/hooks/useSurvey.ts** (read, lines 30-139)
     - Manages survey state and session initialization
     - Currently creates/loads sessions locally
     - Needs modification to accept sessionId parameter

4. **Errors and Fixes:**
   - **'isLoading' declared but never used**:
     - Fixed by adding `disabled={isLoading}` to both survey selection buttons
   - **telegramId type mismatch (string vs number)**:
     - Fixed by parsing: `parseInt(user.telegramId)`
   - **SurveySession vs UserSession type incompatibility**:
     - Attempted fix by creating UserSession object with required properties
     - Still has error: missing `userId` property in UserSession type

5. **Problem Solving:**
   - Successfully implemented async session creation in survey selection
   - Added proper error handling with fallback navigation
   - Implemented loading states to prevent race conditions
   - Working on resolving TypeScript type compatibility issues

6. **All User Messages:**
   - "[Image #1] [Image #2] при выборе опроса, нужно сбрасывать данные сессии и начинать новый опрос. новый опрос должен открываться по пути /survey_type/:session_id. когда все ответы по опросу получены, нужно открыть страницу результатов /:surveyType/:sessionId/results. используй implamentation-strategist для построения плана"
   - "continue"

7. **Pending Tasks:**
   - Fix UserSession type error (add userId property)
   - Update App.tsx routing to use session ID parameters
   - Update ExpressPage to extract and use session ID from URL
   - Update FullPage to extract and use session ID from URL
   - Modify useSurvey hook to accept and use session ID parameter
   - Test complete flow: selection → new session → survey → results

8. **Current Work:**
   Working on fixing the TypeScript type error in SurveySelectionScreen.tsx where the UserSession interface requires a `userId` property that wasn't being provided when creating the userSession object from the API response. The error occurs at line 38 where `LocalStorageService.setCurrentSession(userSession)` is called.

9. **Optional Next Step:**
   Fix the remaining TypeScript error by adding the missing `userId` property to the userSession object, likely using the user's telegramId or extracting it from the session data. This directly continues the current task of updating SurveySelectionScreen to properly handle session creation and navigation with session IDs..
Please continue the conversation from where we left it off without asking the user any further questions. Continue with the last task that you were asked to work on.