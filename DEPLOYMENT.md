# Deployment Guide for Render.com

This guide covers deploying the Business Assessment Platform to Render.com.

## Prerequisites

1. **Render.com Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Push your code to a GitHub repository
3. **Environment Variables**: Prepare the necessary environment variables

## Deployment Steps

### 1. Connect GitHub Repository

1. Log into your Render dashboard
2. Click "New" → "Blueprint"
3. Connect your GitHub repository containing this project

### 2. Deploy Using Blueprint

The `render.yaml` file will automatically configure:
- **Database**: PostgreSQL database (`bizass-postgres`)
- **Backend**: Node.js API service (`bizass-backend`)
- **Frontend**: Static site service (`bizass-frontend`)

### 3. Configure Environment Variables

After deployment, manually set these environment variables in the Render dashboard:

#### Backend Service (`bizass-backend`)
- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token (set via Render dashboard)

All other environment variables are automatically configured through the render.yaml file.

### 4. Database Setup

The PostgreSQL database will be automatically:
- Created with the name `bizass_platform`
- Connected to the backend service
- Initialized with the uuid-ossp extension

## File Structure

### Docker Configuration
- `backend/Dockerfile`: Multi-stage production build for backend
- `frontend/Dockerfile`: Multi-stage production build for frontend with nginx
- `frontend/nginx.conf`: Nginx configuration for serving React app
- `.dockerignore`: Optimized Docker build context

### Deployment Configuration
- `render.yaml`: Render.com blueprint configuration
- `DEPLOYMENT.md`: This deployment guide

## Production Features

### Backend
- Multi-stage Docker build for smaller image size
- Non-root user for security
- Health checks configured
- Canvas dependencies for PDF generation
- CORS configured for frontend communication

### Frontend  
- Nginx server for static file serving
- Gzip compression enabled
- Security headers configured
- React Router support (try_files)
- Cache headers for static assets

### Database
- PostgreSQL with persistent storage
- UUID extension enabled
- Automatic connection to backend

## Environment Variables Reference

### Auto-configured by Render
- `NODE_ENV=production`
- `PORT=3001` (backend)
- Database connection variables (auto-populated from database service)
- `JWT_SECRET` (auto-generated)
- `FRONTEND_URL` and `VITE_API_URL` (auto-configured between services)

### Manual Configuration Required
- `TELEGRAM_BOT_TOKEN`: Set in Render dashboard for the backend service

## Post-Deployment Verification

1. **Health Check**: Visit `https://your-backend.onrender.com/health`
2. **Frontend**: Visit `https://your-frontend.onrender.com`
3. **Database**: Backend logs should show successful database connection

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that shared library builds successfully
   - Verify all dependencies are installed
   - Check Docker build logs

2. **Database Connection Issues**
   - Verify database service is running
   - Check environment variable configuration
   - Review connection logs

3. **CORS Issues**
   - Verify FRONTEND_URL is correctly set
   - Check that domain names match between services

### Logs Access
- Backend logs: Available in Render dashboard under the backend service
- Frontend logs: Available in Render dashboard under the frontend service
- Database logs: Available in Render dashboard under the database service

## Scaling Considerations

- **Free Plan**: Suitable for development and testing (services spin down after inactivity)
- **Paid Plans**: Recommended for production (always-on services, better performance)
- **Database**: Free tier has limitations; consider upgrading for production workloads

## Security Notes

- All services run with non-root users where applicable
- Environment variables are managed securely through Render
- Database connections use SSL in production
- Security headers are configured in nginx