# Business Assessment Platform

A comprehensive business self-assessment tool delivered through a Telegram bot and integrated web application.

## Architecture

This project follows a monorepo structure with three main components:

- **Backend** (`/backend`): NestJS API server with TypeScript
- **Frontend** (`/frontend`): React web application with Vite
- **Shared** (`/shared`): Common TypeScript types and interfaces

## Technology Stack

- **Backend**: Node.js, NestJS, TypeScript, PostgreSQL, TypeORM
- **Frontend**: React, Vite, TypeScript, Tailwind CSS
- **Database**: PostgreSQL
- **Containerization**: Docker & Docker Compose
- **Authentication**: JWT tokens via Telegram integration

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BizAssPlatform
   ```

2. **Start the development environment**
   ```bash
   docker-compose up -d
   ```

   This will start:
   - PostgreSQL database on port 5432
   - Backend API on port 3001
   - Frontend (optional) on port 3000

3. **Install dependencies locally (for development)**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   
   # Shared
   cd ../shared
   npm install
   ```

### Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp backend/.env.example backend/.env
```

Update the following variables in `backend/.env`:
- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
- `TELEGRAM_PAYMENTS_PROVIDER_TOKEN`: Your Telegram Payments provider token
- `JWT_SECRET`: A secure secret key for JWT tokens

## Project Structure

```
├── backend/                 # NestJS API server
│   ├── src/
│   │   ├── entities/        # TypeORM database entities
│   │   ├── survey/          # Survey management module
│   │   ├── payment/         # Payment processing module
│   │   ├── report/          # Report generation module
│   │   ├── telegram/        # Telegram bot integration
│   │   ├── auth/            # Authentication module
│   │   └── common/          # Shared utilities
│   ├── Dockerfile           # Production container
│   └── .env.example         # Environment configuration
├── frontend/                # React web application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Application pages
│   │   ├── services/        # API client services
│   │   └── store/           # State management
│   └── Dockerfile.dev       # Development container
├── shared/                  # Shared TypeScript types
│   └── src/types/           # Common interfaces
├── docker-compose.yml       # Local development setup
└── README.md               # This file
```

## API Endpoints

### Survey Management
- `POST /survey/start` - Start a new survey session
- `POST /survey/answer` - Submit an answer
- `GET /survey/structure/:type` - Get survey structure
- `GET /survey/session/:sessionId` - Get session details

### Payment Processing
- `POST /payment/create-invoice` - Create payment invoice
- `POST /payment/webhook` - Handle payment webhooks

### Telegram Integration
- `POST /telegram/webhook` - Handle Telegram bot webhooks

## Database Schema

The application uses PostgreSQL with the following main entities:

- **Users**: Telegram user information
- **Surveys**: Survey definitions and structure
- **SurveySessions**: User survey sessions
- **Answers**: Individual question responses
- **Reports**: Generated assessment reports
- **Payments**: Payment transaction records
- **ReferralCodes**: User referral codes
- **ReferralUsage**: Referral code usage tracking

## Admin Panel

The platform includes a comprehensive admin panel powered by AdminJS for managing surveys, viewing user sessions, and monitoring system health.

### Accessing the Admin Panel

**For Administrators:**
1. Open the Telegram bot
2. Click the "🔧 Админ-панель" button (visible only to authorized administrators)
3. The admin panel will open automatically with authenticated access at `/admin`

**Authentication:**
- Administrators are automatically authenticated via Telegram WebApp integration
- The system uses JWT tokens to validate admin access
- Only users registered in the `admins` table can access the admin panel
- Non-admin users receive a 403 Forbidden error when attempting to access `/admin`

### Key Features

- **Survey Management**: View and edit survey structures (Express and Full assessments)
- **Survey Versioning**: Create, edit, publish, and unpublish survey versions with draft/published workflow
- **Session Monitoring**: Track user survey sessions and responses in real-time
- **Admin Management**: Manage administrator access and permissions
- **Custom Actions**: Publish versions, create new versions, and unpublish surveys
- **JSONB Structure Editor**: Visual editor for complex survey question structures

### Survey Versioning System

The admin panel implements a complete versioning system for surveys:

- **Versions**: Each survey can have multiple versions (draft and published)
- **Session Isolation**: User sessions are always tied to a specific survey version
- **Safe Editing**: Create drafts, make changes, and publish when ready without affecting active users
- **Version History**: Track all versions with creation dates and status

### Documentation

- **Administrator Guide**: See [agent-os/specs/2026-01-06-admin-panel-cms/docs/admin-guide.md](agent-os/specs/2026-01-06-admin-panel-cms/docs/admin-guide.md) for detailed workflows, FAQ, and troubleshooting
- **API Documentation**: See [agent-os/specs/2026-01-06-admin-panel-cms/docs/api-documentation.md](agent-os/specs/2026-01-06-admin-panel-cms/docs/api-documentation.md) for versioning endpoints and API reference
- **Database Schema**: See [agent-os/specs/2026-01-06-admin-panel-cms/docs/versioning-schema.md](agent-os/specs/2026-01-06-admin-panel-cms/docs/versioning-schema.md) for ER diagrams and version lifecycle

## Development Workflow

1. **Backend Development**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Frontend Development**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Database Management**
   ```bash
   # Access PostgreSQL
   docker-compose exec postgres psql -U postgres -d bizass_platform
   ```

## Production Deployment

The application is containerized and ready for deployment on platforms like:
- AWS Fargate
- Google Cloud Run
- Heroku
- Render

### Environment Variables

Ensure the following environment variables are set in production:

- `NODE_ENV=production`
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_PAYMENTS_PROVIDER_TOKEN`
- `FRONTEND_URL`

## Contributing

1. Follow the existing code structure and patterns
2. Use TypeScript for all new code
3. Write tests for new functionality
4. Update documentation as needed

## License

[Add your license information here]
