# RAG Chatbot - Backend

This is the backend service for the RAG (Retrieval-Augmented Generation) News Chatbot. It handles embedding, retrieval, session management, and connection to Redis, Vector DB, and Gemini API.

---

## 🚀 Features

- REST APIs for chat, session creation, history, and reset
- Redis-based session caching
- Vector DB retrieval for RAG (File-based JSON)
- Embedding generation (Deterministic hash-based embeddings)
- Gemini API for final answer generation
- News ingestion script to index ~150 news articles
- WebSocket support for streaming responses
- Hybrid RAG mode (switches between document-based and conversational)
- Relevance threshold filtering for high-quality responses

---

## 📁 Folder Structure

```
backend/
├── src/
│   ├── server.js                 # Express server entry point
│   ├── routes/
│   │   ├── chatRoutes.js         # Chat and streaming endpoints
│   │   └── sessionRoutes.js      # Session management endpoints
│   ├── services/
│   │   ├── geminiService.js      # Gemini LLM integration
│   │   ├── embeddingService.js   # Embedding generation
│   │   ├── vectorService.js      # Vector DB and search
│   │   └── redisService.js       # Redis client
│   └── middleware/               # (Express middleware, future auth)
├── data/
│   └── vector_db.json            # Persisted vector store with documents
├── scripts/
│   └── seedCorpus.js             # Populate vector DB with news articles
├── .env                          # Environment configuration
├── .env.example                  # Example environment file
├── package.json                  # Dependencies and scripts
└── README.md                     # This file
```

---

## 🛠 Tech Stack

- **Node.js** (18+) with ES Modules
- **Express.js** - REST API framework
- **express-ws** - WebSocket support
- **Google Generative AI SDK** - Gemini LLM integration
- **Redis** - Session caching (optional, graceful fallback)
- **File-based Vector Store** - JSON-based document storage
- **Axios** - HTTP client for API calls

---

## 🔧 Installation

### Prerequisites

- Node.js 18+
- npm or yarn
- Google Gemini API key ([Get one here](https://ai.google.dev/))
- Redis (optional, for session persistence)

### Steps

1. **Install dependencies**
```bash
cd backend
npm install
```

2. **Create `.env` file**
```bash
cp .env.example .env
```

3. **Configure environment variables**

Edit `backend/.env`:
```env
# API Keys
GEMINI_API_KEY=your_google_gemini_api_key_here

# Redis Configuration (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Server Configuration
PORT=5000
NODE_ENV=development
```

4. **Seed the vector database** (optional, if needed)
```bash
npm run seed
```

---

## 🚀 Running the Server

### Development Mode
```bash
npm run dev
```

Server starts on `http://localhost:5000`

### Production Mode
```bash
npm start
```

---

## 📡 API Reference

### Session Management

#### Create Session
```http
POST /api/session/create
Content-Type: application/json

Response:
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Get Session History
```http
GET /api/session/:sessionId
```

#### Delete Session
```http
DELETE /api/session/:sessionId

Response:
{
  "message": "Session deleted"
}
```

### Chat Endpoints

#### Send Message (REST)
```http
POST /api/chat/send
Content-Type: application/json

Request:
{
  "message": "What is renewable energy?",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}

Response:
{
  "answer": "Renewable energy refers to...",
  "context": [
    {
      "source": "Solar Power Initiative",
      "score": 0.87,
      "content": "..."
    }
  ],
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Stream Message (WebSocket)
```javascript
// Connect
ws://localhost:5000/api/chat/stream

// Send
{
  "message": "What about wind energy?",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}

// Receive (streaming)
{
  "type": "context",
  "content": [
    {
      "source": "Wind Energy Report",
      "score": 0.82,
      "content": "..."
    }
  ]
}

{
  "type": "answer_chunk",
  "content": "Wind energy is a "
}

{
  "type": "answer_chunk",
  "content": "renewable source..."
}

{
  "type": "done"
}
```

---

## 🔌 Service Architecture

### GeminiService (`src/services/geminiService.js`)

Handles LLM integration with auto-model detection:

- **`initializeGemini()`**: Queries Google REST API to fetch available models, stores first compatible model (e.g., `gemini-2.5-flash`)
- **`generateAnswer(query, context)`**: Hybrid mode
  - If `context.length > 0`: RAG mode with citations
  - Else: Conversational mode with general knowledge
- **`streamAnswer(query, context)`**: Same logic with streaming support

**Key Features:**
- Auto-model detection (no hardcoded model names)
- Relevance filtering integrated
- Context-aware system prompts

### VectorService (`src/services/vectorService.js`)

Manages document storage and retrieval:

- **`loadVectorDB()`**: Loads documents from `data/vector_db.json`
- **`searchSimilar(query, topK)`**: Cosine similarity search
- **`getDocuments()`**: Returns all stored documents

**Search Algorithm:**
- Deterministic embeddings (hash-based, 384-dim)
- Cosine similarity scoring
- Top-K retrieval (default K=5)

### RedisService (`src/services/redisService.js`)

Handles session management:

- **`saveSession(sessionId, messages)`**: Cache session history
- **`getSession(sessionId)`**: Retrieve session history
- **`deleteSession(sessionId)`**: Clear session
- **Graceful fallback**: Works without Redis

### EmbeddingService (`src/services/embeddingService.js`)

Generates embeddings (deterministic for consistency):

- **`generateEmbedding(text)`**: Hash-based 384-dimensional vector
- Deterministic (same input = same output)
- Fast, no external API calls

---

## 🎯 Hybrid RAG Mode

The chatbot automatically switches between two modes:

### RAG Mode (Document-Based)
- **Trigger**: Query finds relevant documents (similarity ≥ 0.5 threshold)
- **Behavior**: Answers with citations from documents
- **Example**: "What renewable energy solutions are being developed?"

**Flow:**
```
User Query
    ↓
Search Vector DB
    ↓
Filter: score ≥ 0.5 ?
    ├─ YES → RAG Mode (with context)
    └─ NO  → Conversational Mode (no context)
    ↓
Generate Answer (Gemini)
    ↓
Return + Citations
```

### Conversational Mode (General Knowledge)
- **Trigger**: No relevant documents found
- **Behavior**: Uses LLM general knowledge without citations
- **Example**: "Tell me a joke"

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | - | ✅ Yes |
| `REDIS_HOST` | Redis server hostname | `localhost` | ❌ No |
| `REDIS_PORT` | Redis server port | `6379` | ❌ No |
| `REDIS_PASSWORD` | Redis authentication password | (empty) | ❌ No |
| `PORT` | Backend server port | `5000` | ❌ No |
| `NODE_ENV` | Environment (development/production) | `development` | ❌ No |

### Code Configuration

**Relevance Threshold** (`src/routes/chatRoutes.js`):
```javascript
const RELEVANCE_THRESHOLD = 0.5; // 0.0 to 1.0
// Adjust to filter document matches
// Higher = stricter (fewer documents used)
// Lower = lenient (more documents used)
```

**Model Selection** (`src/services/geminiService.js`):
```javascript
// Auto-selects first available model from API
// Currently: gemini-2.5-flash
// No manual configuration needed
```

---

## 📊 Data Management

### Vector Database Structure

`data/vector_db.json` format:
```json
{
  "documents": [
    {
      "id": "doc_001",
      "source": "Article Title",
      "content": "Full article text...",
      "embedding": [0.123, 0.456, ...],
      "metadata": {
        "date": "2024-01-15",
        "category": "Technology"
      }
    }
  ]
}
```

### Seeding Documents

Edit `scripts/seedCorpus.js` to add custom articles:

```javascript
const corpus = [
  {
    id: "custom_001",
    source: "My Article",
    content: "Article content...",
    metadata: { date: "2024-01-20", category: "Custom" }
  }
];
```

Run seeding:
```bash
npm run seed
```

---

## 🐛 Troubleshooting

### Server won't start
**Issue**: `EADDRINUSE: address already in use :::5000`
```bash
# Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Issue**: `GEMINI_API_KEY not found`
- Check `.env` file exists in `backend/` folder
- Verify API key is valid: Visit [Google AI Studio](https://aistudio.google.com/app/apikey)

### No responses (fallback mode)
**Issue**: Bot always says "Unable to generate response"
- Check Gemini API key validity
- Verify backend can reach Google API: `curl https://generativelanguage.googleapis.com/v1/models?key=YOUR_KEY`
- Check backend logs for errors

### Redis connection errors
**Issue**: `Error: connect ECONNREFUSED 127.0.0.1:6379`
- Redis is optional; app continues without it
- To use Redis, start Redis server: `redis-server`
- Or disable Redis in code (graceful fallback enabled)

### Vector search returns no results
**Issue**: `No relevant documents found` for valid queries
- Check `data/vector_db.json` has documents
- Lower `RELEVANCE_THRESHOLD` (e.g., 0.3 instead of 0.5)
- Run `npm run seed` to repopulate vector DB

### WebSocket connection fails
**Issue**: `WebSocket is closed before the connection is established`
- Ensure backend is running
- Check frontend backend URL matches: `http://localhost:5000`
- Verify no firewall blocking port 5000

---

## 🔍 Debugging

### Enable Detailed Logging

Edit `src/routes/chatRoutes.js`:
```javascript
console.log(`Query: "${message}"`);
console.log(`Found ${searchResults.length} results, ${relevantDocs.length} above threshold`);
console.log('Selected documents:', relevantDocs);
```

### Test Endpoints Manually

**Using curl:**
```bash
# Create session
curl -X POST http://localhost:5000/api/session/create

# Send message
curl -X POST http://localhost:5000/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{"message":"hello","sessionId":"your-id"}'
```

**Using Postman:**
- Import collection or manually test endpoints
- Set Content-Type to `application/json`
- Copy sessionId from create response

---

## 🧪 Development Tips

### Hot Reload
```bash
npm run dev
# Uses nodemon to auto-restart on file changes
```

### File Modifications
1. Edit service files in `src/services/`
2. Changes auto-apply with `npm run dev`
3. No need to restart manually

### Adding New Routes
1. Create new file in `src/routes/`
2. Export Express router
3. Mount in `src/server.js`: `app.use('/api/new', newRouter);`

---

## 📦 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.x | REST API framework |
| express-ws | ^5.x | WebSocket support |
| @google/generative-ai | ^0.x | Gemini API SDK |
| redis | ^4.x | Session caching |
| axios | ^1.x | HTTP requests |
| dotenv | ^16.x | Environment variables |
| nodemon | ^3.x | Dev hot-reload |

---

## 🔐 Security Considerations

1. **API Key**: Never commit `.env` to Git (added to `.gitignore`)
2. **CORS**: Currently allows all origins (set `CORS_ORIGIN` in production)
3. **Input Validation**: Validate user input before processing
4. **Rate Limiting**: Consider adding rate limiting in production
5. **Session Tokens**: Use secure, random sessionIds (currently UUID)

---

## 📈 Performance Tips

1. **Caching**: Redis caches frequently accessed sessions
2. **Vector Search**: Optimize `topK` parameter based on use case
3. **Batch Processing**: Future: batch multiple queries for efficiency
4. **Connection Pooling**: Redis client auto-pools connections

---

## 🤝 Contributing

See main README for guidelines.

---

## 📝 License

MIT License - see ../LICENSE for details

---

Built with Node.js, Express, and Google Gemini API
