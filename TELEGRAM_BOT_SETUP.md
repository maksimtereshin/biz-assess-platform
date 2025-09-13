# Telegram Bot Setup & Testing Guide

## Overview
The Business Assessment Platform integrates with Telegram to provide seamless survey access through Telegram Web App functionality.

## How It Works

### 1. User Flow
1. User starts conversation with your Telegram bot (`/start`)
2. Bot presents two survey options as inline Web App buttons:
   - 🚀 Express Survey (Quick)
   - 📊 Full Survey (Comprehensive)
3. When user clicks a button, it opens the webapp directly with the selected survey type
4. The webapp shows the corresponding survey (/express or /full route)
5. User completes the survey in the Telegram Web App interface

### 2. Technical Implementation

#### Backend Changes (`telegram.service.ts`)
- Removed callback query handling for survey selection
- Added direct Web App buttons with URLs pointing to specific survey routes
- Express Survey → `${FRONTEND_URL}/express`
- Full Survey → `${FRONTEND_URL}/full`

#### Button Configuration
```javascript
{
  text: '🚀 Express Survey (Quick)', 
  web_app: { url: `${this.webAppUrl}/express` }
}
```

## Setting Up Your Telegram Bot

### 1. Create a Bot
1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow the prompts to create your bot
4. Save the bot token you receive

### 2. Configure Web App
1. Send `/mybots` to BotFather
2. Select your bot
3. Click "Bot Settings" → "Menu Button"
4. Set the Web App URL to your frontend URL (e.g., `http://localhost:5173` for development)

### 3. Set Environment Variables
Add your bot token to the `.env` file:
```env
TELEGRAM_BOT_TOKEN=your-bot-token-here
```

### 4. Configure Webhook (Production)
For production, you need to set up a webhook:
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-domain.com/api/telegram/webhook"}'
```

## Testing the Integration

### Local Development Testing

1. **Start the development environment:**
   ```bash
   ./dev.sh up
   ```

2. **Configure ngrok for local testing (if needed):**
   ```bash
   ngrok http 3001
   ```
   Then set the webhook to your ngrok URL.

3. **Test Bot Commands:**
   - `/start` - Shows welcome message with survey selection buttons
   - `/help` - Shows help information
   - `/reports` - View survey history (coming soon)
   - `/referral` - Get referral code

4. **Test Survey Selection:**
   - Click "🚀 Express Survey (Quick)" button
   - The webapp should open directly to `/express` route
   - Click "📊 Full Survey (Comprehensive)" button  
   - The webapp should open directly to `/full` route

### Verification Steps

1. **Check Backend Logs:**
   ```bash
   docker logs bizass-backend-dev -f
   ```
   Look for webhook received messages

2. **Check Frontend Access:**
   - Ensure webapp opens at correct route
   - Verify Telegram Web App SDK initializes
   - Check that survey questions load properly

3. **Test Authentication:**
   - The webapp should automatically authenticate using Telegram user data
   - User info should be passed from Telegram to the webapp

## Troubleshooting

### Bot doesn't respond
- Check `TELEGRAM_BOT_TOKEN` is set correctly
- Verify webhook is configured (for production)
- Check backend logs for errors

### Web App doesn't open
- Ensure `FRONTEND_URL` is set correctly in backend environment
- For local development, use ngrok or similar tunnel service
- Check that Web App URL is configured in BotFather

### Survey doesn't load
- Verify frontend routes are working (`/express`, `/full`)
- Check browser console for errors
- Ensure authentication is working properly

## Production Deployment

1. Deploy frontend to a public URL (e.g., https://yourdomain.com)
2. Update `FRONTEND_URL` in backend environment variables
3. Set up SSL certificate (required for Telegram Web Apps)
4. Configure webhook URL to your backend endpoint
5. Update bot's Web App URL in BotFather

## Security Notes

- Always use HTTPS in production
- Validate Telegram authentication data on backend
- Keep bot token secret and never commit it to version control
- Use environment variables for all sensitive configuration