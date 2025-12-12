# Render Deployment Configuration

## Environment Variables for Render

Set these in your Render dashboard (Dashboard → Environment):

### Required:
```
GEMINI_API_KEY=your_actual_gemini_api_key_here
NODE_ENV=production
DISABLE_REDIS=true
```

### Optional:
```
PORT=5000
CORS_ORIGIN=https://your-frontend-url.onrender.com
```

## Build Command:
```
npm install
```

## Start Command:
```
npm start
```

## Important Notes:

1. **Redis is disabled** - Render free tier doesn't include Redis, so we disable it via `DISABLE_REDIS=true`
2. **Session persistence** - Without Redis, chat sessions won't persist across deployments
3. **CORS** - Update `CORS_ORIGIN` to match your frontend URL
4. **API Key** - Add your Gemini API key in Render's environment variables (never in code!)

## Deployment Steps:

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect your GitHub repository
4. Set environment variables (see above)
5. Deploy!

## Health Check Endpoint:
```
https://your-app.onrender.com/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T...",
  "redis": "disconnected",
  "vectorDB": "connected"
}
```

This is normal and expected without Redis!
