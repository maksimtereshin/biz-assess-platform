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
