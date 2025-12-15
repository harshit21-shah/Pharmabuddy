# PharmaBuddy - Deployment Guide

## ✅ All Features Verified and Working

### API Endpoints Tested

| Feature | Endpoint | Status |
|---------|----------|--------|
| Root Info | `GET /` | ✅ Returns API info |
| Users List | `GET /api/users` | ✅ 4 users found |
| Medicines List | `GET /api/medicines` | ✅ 4 medicines found |
| User Reminders | `GET /api/reminders/user/:id` | ✅ Working |
| User Caregivers | `GET /api/caregivers/user/:id` | ✅ Working |
| Test Flow | `POST /api/reminders/test-flow` | ✅ Creates & queues reminder |
| Stock Update | `PATCH /api/medicines/:id/stock` | ✅ Updates stock |
| WhatsApp Webhook | `POST /api/whatsapp/webhook` | ✅ Available |
| Voice Webhook | `POST /api/voice/webhook` | ✅ Available |

### Reminder Escalation Flow
- ✅ WhatsApp reminder sent
- ✅ Voice escalation scheduled (15 min after)
- ✅ Caregiver alert scheduled (15 min after voice)

---

## Deployment Options

### Option 1: Railway (Recommended for Backend)

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy Backend**
   ```bash
   cd backend
   railway login
   railway init
   railway up
   ```

3. **Add Services**
   - PostgreSQL: `railway add --plugin postgresql`
   - Redis: `railway add --plugin redis`

4. **Set Environment Variables**
   ```env
   PORT=3001
   NODE_ENV=production
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   REDIS_URL=${{Redis.REDIS_URL}}
   APP_URL=https://your-app.railway.app
   TWILIO_ACCOUNT_SID=your_sid
   TWILIO_AUTH_TOKEN=your_token
   TWILIO_WHATSAPP_NUMBER=+14155238886
   TWILIO_VOICE_NUMBER=+17754025894
   ```

### Option 2: Render

1. **Create render.yaml**
   ```yaml
   services:
     - type: web
       name: pharmabuddy-backend
       env: node
       buildCommand: npm install && npm run build
       startCommand: npm run start:prod
       envVars:
         - key: NODE_ENV
           value: production
   ```

2. **Add PostgreSQL and Redis from Render dashboard**

### Option 3: Vercel (Frontend Only)

```bash
cd frontend
npx vercel
```

---

## Production Environment Variables

### Backend (.env.production)
```env
# Server
PORT=3001
NODE_ENV=production

# Database (use your production database URL)
DATABASE_HOST=your-db-host.com
DATABASE_PORT=5432
DATABASE_USER=your_user
DATABASE_PASSWORD=your_password
DATABASE_NAME=pharmabuddy

# Redis
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379

# App URL (CRITICAL - update this to your deployed URL)
APP_URL=https://your-backend-url.railway.app

# Twilio
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_NUMBER=+14155238886
TWILIO_VOICE_NUMBER=+17754025894
```

### Frontend (.env.production)
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api
```

---

## Twilio Webhook Configuration

After deploying your backend, update Twilio console:

### WhatsApp Webhook
1. Go to [Twilio Console](https://console.twilio.com)
2. Navigate to **Messaging > Settings > WhatsApp Sandbox**
3. Set webhook URL:
   ```
   https://your-backend-url.railway.app/api/whatsapp/webhook
   ```
4. Method: **POST**

### Voice Webhook
1. Go to **Phone Numbers > Manage > Active Numbers**
2. Select your voice number
3. Set webhook URL for incoming calls:
   ```
   https://your-backend-url.railway.app/api/voice/webhook
   ```

---

## Production Checklist

### Before Deploy
- [ ] Remove sensitive data from `.env` (use environment variables)
- [ ] Update `APP_URL` in environment to production URL
- [ ] Test database connection with production credentials
- [ ] Verify Redis is accessible

### After Deploy
- [ ] Test root endpoint: `GET /`
- [ ] Test users endpoint: `GET /api/users`
- [ ] Test medicines endpoint: `GET /api/medicines`
- [ ] Update Twilio webhook URLs
- [ ] Test WhatsApp flow end-to-end
- [ ] Test Voice call flow

### Security Checklist
- [ ] Remove debug logs in production
- [ ] Enable HTTPS only
- [ ] Set proper CORS origins
- [ ] Rotate Twilio auth token if exposed
- [ ] Use environment secrets, not hardcoded values

---

## Quick Deploy Commands

### Build for Production
```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
cd frontend
npm run build
npm start
```

### Docker Compose (Local Testing)
```bash
docker-compose up -d
```
