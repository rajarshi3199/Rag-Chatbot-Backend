# Render Deployment Guide for RAG Chatbot Backend

## Quick Deploy to Render

1. **Sign up/Login to Render**: Go to [render.com](https://render.com)

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository: `Rag-Chatbot-Backend`
   - Configure the service:

3. **Service Configuration**:
   ```
   Name: rag-chatbot-backend
   Region: Choose closest to you
   Branch: main
   Runtime: Node
   Build Command: npm install
   Start Command: node src/server.js
   ```

4. **Environment Variables** (Critical):
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   DISABLE_REDIS=true
   PORT=10000
   NODE_ENV=production
   CORS_ORIGIN=*
   ```

5. **Plan**: Select "Free" tier

6. **Deploy**: Click "Create Web Service"

## Your Backend URL

After deployment completes (5-10 minutes), you'll get a URL like:
```
https://rag-chatbot-backend-XXXX.onrender.com
```

## Test Your Backend

Visit: `https://your-backend-url.onrender.com/api/health`

You should see: `{"status":"ok","message":"RAG Chatbot API is running"}`

## Important Notes

⚠️ **Free Tier Limitations**:
- Backend spins down after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds to wake up
- No Redis support (set `DISABLE_REDIS=true`)

💡 **Keep Backend Awake** (Optional):
Use a service like [UptimeRobot](https://uptimerobot.com/) to ping `/api/health` every 14 minutes

## Troubleshooting

**503 Errors**: Backend is sleeping, wait 60 seconds and retry
**LLM Errors**: Check `GEMINI_API_KEY` in environment variables
**CORS Errors**: Verify `CORS_ORIGIN=*` is set
