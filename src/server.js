import express from 'express';
import cors from 'cors';
import expressWs from 'express-ws';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeRedis } from './services/redisService.js';
import { initializeVectorDB } from './services/vectorService.js';
import { initializeGemini } from './services/geminiService.js';

dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

// Apply express-ws for WebSocket support
expressWs(app);

// Import routes after express-ws applied so router.ws is available
const { default: chatRoutes } = await import('./routes/chatRoutes.js');
const { default: sessionRoutes } = await import('./routes/sessionRoutes.js');

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize services
let redisClient = null;
let vectorDB = null;

// Route handlers
app.use('/api/chat', chatRoutes);
app.use('/api/session', sessionRoutes);

// If a production frontend build exists, serve it. Otherwise redirect root to health.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // Serve index.html for any non-API route (make sure API routes are mounted under /api)
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
    return res.sendFile(path.join(frontendDist, 'index.html'));
  });
  console.log('Serving frontend from', frontendDist);
} else {
  app.get('/', (req, res) => res.redirect('/api/health'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    redis: redisClient ? 'connected' : 'disconnected',
    vectorDB: vectorDB ? 'connected' : 'disconnected',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    status: err.status || 500,
  });
});

// Initialize and start server
async function startServer() {
  try {
    // Initialize Redis (non-fatal)
    try {
      redisClient = await initializeRedis();
      console.log('✓ Redis connected');
    } catch (err) {
      console.warn('⚠️ Could not connect to Redis. Continuing without Redis.');
      console.warn(err && err.message ? err.message : err);
      redisClient = null;
    }

    // Initialize Vector DB (fatal)
    vectorDB = await initializeVectorDB();
    console.log('✓ Vector Database initialized');

    // Initialize Gemini (LLM) — non-fatal but log status so issues surface on startup
    try {
      const geminiClient = await initializeGemini();
      if (geminiClient) {
        console.log('✓ Gemini LLM initialized');
        app.locals.geminiConfigured = true;
      } else {
        console.warn('⚠️ Gemini LLM not configured (GEMINI_API_KEY missing or invalid)');
        app.locals.geminiConfigured = false;
      }
    } catch (err) {
      console.warn('⚠️ Failed to initialize Gemini LLM on startup:', err && err.message ? err.message : err);
      app.locals.geminiConfigured = false;
    }

    // Attach services to app for use in routes
    app.locals.redisClient = redisClient;
    app.locals.vectorDB = vectorDB;

    app.listen(port, () => {
      console.log(`\n🚀 Server running on http://localhost:${port}`);
      console.log('📚 RAG Chatbot Backend initialized successfully\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
