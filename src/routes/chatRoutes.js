import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getEmbeddings } from '../services/embeddingService.js';
import { searchDocuments } from '../services/vectorService.js';
import { generateAnswer, streamAnswer, formatContext } from '../services/geminiService.js';
import { saveSessionHistory, getSessionHistory } from '../services/redisService.js';

const router = express.Router();

// Minimum relevance score (cosine similarity) to include a document as context
// Score ranges from 0 to 1 (1 = identical). 0.5 = 50% similar
const RELEVANCE_THRESHOLD = 0.5;

/**
 * POST /api/chat/send - Send a message and get AI response
 */
router.post('/send', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({ error: 'Message and sessionId required' });
    }

    // Get embedding for the query
    const queryEmbedding = await getEmbeddings(message);

    // Search for relevant documents
    const topK = 5;
    const searchResults = searchDocuments(queryEmbedding, topK);

    // Filter by relevance threshold: only use documents with high similarity
    // If no documents meet the threshold, use empty array (triggers conversational mode)
    const relevantDocs = searchResults.filter((doc) => doc.score >= RELEVANCE_THRESHOLD);

    console.log(`Query: "${message}" | Found ${searchResults.length} results, ${relevantDocs.length} above threshold (${RELEVANCE_THRESHOLD})`);

    // Generate answer using Gemini (hybrid mode: RAG if context exists, general conversation otherwise)
    const answer = await generateAnswer(message, relevantDocs);

    // Format context for response
    const formattedContext = formatContext(relevantDocs);

    // Save to session history
    await saveSessionHistory(sessionId, {
      role: 'user',
      content: message,
    });
    await saveSessionHistory(sessionId, {
      role: 'assistant',
      content: answer,
      context: formattedContext,
    });

    res.json({
      answer,
      context: formattedContext,
      sessionId,
    });
  } catch (error) {
    console.error('Error in /send:', error);
    res.status(500).json({
      error: 'Failed to process message',
      details: error.message,
    });
  }
});

/**
 * WebSocket endpoint for streaming responses
 * WS /api/chat/stream
 */
router.ws('/stream', async (ws, req) => {
  try {
    ws.on('message', async (msg) => {
      try {
        const { message, sessionId } = JSON.parse(msg);

        if (!message || !sessionId) {
          ws.send(JSON.stringify({ error: 'Message and sessionId required' }));
          return;
        }

        // Get embedding for query
        const queryEmbedding = await getEmbeddings(message);

        // Search documents
        const searchResults = searchDocuments(queryEmbedding, 5);

        // Filter by relevance threshold
        const relevantDocs = searchResults.filter((doc) => doc.score >= RELEVANCE_THRESHOLD);

        console.log(`Stream Query: "${message}" | Found ${searchResults.length} results, ${relevantDocs.length} above threshold (${RELEVANCE_THRESHOLD})`);

        // Send context if available
        if (relevantDocs.length > 0) {
          ws.send(
            JSON.stringify({
              type: 'context',
              content: formatContext(relevantDocs),
            })
          );
        }

        // Stream answer (hybrid mode)
        let fullAnswer = '';
        for await (const chunk of streamAnswer(message, relevantDocs)) {
          fullAnswer += chunk;
          ws.send(
            JSON.stringify({
              type: 'answer_chunk',
              content: chunk,
            })
          );
        }

        // Save to history
        await saveSessionHistory(sessionId, {
          role: 'user',
          content: message,
        });
        await saveSessionHistory(sessionId, {
          role: 'assistant',
          content: fullAnswer,
        });

        ws.send(JSON.stringify({ type: 'done' }));
      } catch (error) {
        console.error('WebSocket error:', error);
        ws.send(JSON.stringify({ error: error.message }));
      }
    });
  } catch (error) {
    console.error('WebSocket connection error:', error);
  }
});

export default router;
