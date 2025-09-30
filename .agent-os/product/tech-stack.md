# BizAssPlatform - Technology Stack

## Architecture Overview

BizAssPlatform follows a modern monorepo architecture with three main packages:
- **backend/**: NestJS API server
- **frontend/**: React SPA with Vite
- **shared/**: Common TypeScript types

## Backend Technology Stack

### Core Framework
- **NestJS 10.x**: Modern Node.js framework with TypeScript
- **Node.js**: Runtime environment
- **TypeScript**: Strict typing with latest ECMAScript features

### Database & ORM
- **PostgreSQL**: Primary database
- **TypeORM**: Object-relational mapping with decorators
- **Connection Pooling**: Optimized database connections

### Authentication & Security
- **JWT (jsonwebtoken)**: Token-based authentication
- **@nestjs/throttler**: Rate limiting and DDoS protection
- **Telegram WebApp**: Secure initData validation
- **CORS**: Cross-origin request handling

### API & Communication
- **RESTful APIs**: Standard HTTP endpoints
- **Axios**: HTTP client for external API calls
- **Class Validator**: Request/response validation
- **Class Transformer**: Data transformation

### Logging & Monitoring
- **Pino**: High-performance structured logging
- **Health Checks**: Application health monitoring endpoints

### Report Generation
- **PDFKit**: PDF document generation
- **Chart.js**: Chart rendering for reports
- **Canvas**: Chart rendering backend

### Key Dependencies
```json
{
  "@nestjs/core": "^10.0.0",
  "@nestjs/common": "^10.0.0",
  "@nestjs/typeorm": "^10.0.0",
  "typeorm": "^0.3.17",
  "pg": "^8.11.3",
  "jsonwebtoken": "^9.0.2",
  "axios": "^1.6.0",
  "pdfkit": "^0.14.0",
  "pino": "^8.15.0"
}
```

## Frontend Technology Stack

### Core Framework
- **React 18**: Modern UI library with hooks
- **TypeScript**: Strict type checking
- **Vite 5.x**: Fast build tool and dev server

### State Management
- **Zustand**: Lightweight state management
- **Zustand Persistence**: LocalStorage integration
- **Immer**: Immutable state updates

### Routing & Navigation
- **React Router v6**: Client-side routing
- **Parameterized Routes**: Session-based URLs
- **Navigation Guards**: Authentication routing

### Styling & UI
- **Tailwind CSS**: Utility-first CSS framework
- **Responsive Design**: Mobile-first approach
- **Heroicons**: Icon library
- **Lucide React**: Additional icon set

### Data Visualization
- **Recharts**: React chart library
- **Chart Components**: Bar charts, line charts, pie charts
- **Responsive Charts**: Mobile-optimized visualizations

### Animation & UX
- **Framer Motion**: Animation library
- **Loading States**: User feedback components
- **Progress Indicators**: Survey completion tracking

### HTTP & API
- **Axios**: HTTP client with interceptors
- **Request/Response Interceptors**: Automatic token handling
- **Error Handling**: 401 redirect to authentication

### Testing
- **Vitest**: Fast unit test runner
- **Testing Library**: Component testing utilities
- **Jest DOM**: Extended Jest matchers

### Key Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.15.0",
  "zustand": "^4.4.1",
  "tailwindcss": "^3.3.0",
  "axios": "^1.5.0",
  "recharts": "^2.8.0",
  "framer-motion": "^10.16.0",
  "vite": "^5.0.0"
}
```

## Shared Package

### Type System
- **Shared Types**: Common interfaces between frontend/backend
- **TypeScript Strict Mode**: Maximum type safety
- **Dual Build**: ESM and CommonJS outputs

### Build Configuration
- **Multiple TSConfig**: Different output formats
- **tsc**: TypeScript compiler
- **Dual Package Support**: ESM/CJS compatibility

```json
{
  "bizass-shared": "workspace:*",
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.js",
      "types": "./dist/types/index.d.ts"
    }
  }
}
```

## Infrastructure & DevOps

### Containerization
- **Docker**: Multi-stage builds
- **Docker Compose**: Development environment
- **nginx**: Reverse proxy for frontend

### Development Environment
- **Hot Reloading**: Real-time code updates
- **Volume Mounts**: Fast development feedback
- **Service Orchestration**: Database, backend, frontend

### Production Deployment
- **Render.com**: Cloud platform deployment
- **Automated CI/CD**: Git-based deployment
- **Environment Variables**: Secure configuration
- **Health Checks**: Service monitoring

### Development Scripts
```bash
./dev.sh up      # Start all services
./dev.sh down    # Stop all services
./dev.sh rebuild # Full rebuild
./dev.sh logs    # View service logs
./dev.sh db      # Access PostgreSQL
```

## Code Quality & Standards

### Linting & Formatting
- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **Husky**: Git hooks for pre-commit checks
- **lint-staged**: Stage-specific linting

### TypeScript Configuration
- **Strict Mode**: Maximum type safety
- **Path Mapping**: Clean import statements
- **Declaration Files**: Type definitions
- **Source Maps**: Debug support

### Testing Strategy
- **Unit Tests**: Jest (backend), Vitest (frontend)
- **Integration Tests**: API endpoint testing
- **Component Tests**: React component testing
- **Manual E2E**: Telegram WebApp testing

## External Integrations

### Telegram Platform
- **Telegram Bot API**: Webhook handling
- **WebApp API**: Secure authentication
- **Deep Linking**: Bot to WebApp navigation
- **Payments API**: Premium feature integration (planned)

### Third-Party Services
- **PostgreSQL Cloud**: Database hosting
- **CDN**: Static asset delivery
- **Monitoring**: Application performance tracking

## Security Stack

### Authentication Flow
```
Telegram WebApp → initData validation → JWT token → API access
```

### Security Measures
- **Rate Limiting**: Multiple time windows (1s, 1min, 15min)
- **CORS Policy**: Strict origin validation
- **Input Validation**: All API endpoints
- **JWT Security**: Short-lived tokens with refresh capability
- **Environment Variables**: Secure credential management

## Performance Optimizations

### Frontend
- **Code Splitting**: Route-based lazy loading
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Image and bundle size optimization
- **Caching**: Browser and API response caching

### Backend
- **Database Indexing**: Optimized query performance
- **Connection Pooling**: Efficient database connections
- **Response Caching**: API response optimization
- **Compression**: gzip response compression

## Development Workflow

### Package Management
- **npm workspaces**: Monorepo dependency management
- **Shared Dependencies**: Common packages across projects
- **Version Synchronization**: Consistent package versions

### Build Process
- **Parallel Builds**: Frontend and backend compilation
- **Type Checking**: Pre-build validation
- **Hot Module Replacement**: Development speed optimization
- **Production Optimization**: Minification and bundling

### Deployment Pipeline
```
Git Push → Render Build → Docker Build → Health Check → Live Deployment
```