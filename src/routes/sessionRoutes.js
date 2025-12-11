import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getSessionHistory, clearSession } from '../services/redisService.js';

const router = express.Router();

/**
 * POST /api/session/create - Create a new session
 */
router.post('/create', (req, res) => {
  try {
    const sessionId = uuidv4();
    res.json({
      sessionId,
      createdAt: new Date().toISOString(),
      message: 'Session created successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/session/:sessionId/history - Get session chat history
 */
router.get('/:sessionId/history', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50 } = req.query;

    const history = await getSessionHistory(sessionId, parseInt(limit));
    res.json({
      sessionId,
      history,
      count: history.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/session/:sessionId - Clear session history
 */
router.delete('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    await clearSession(sessionId);

    res.json({
      sessionId,
      message: 'Session cleared successfully',
      clearedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/session/:sessionId - Get session info
 */
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = await getSessionHistory(sessionId, 1);

    res.json({
      sessionId,
      isActive: history.length > 0,
      lastActivity: history.length > 0 ? history[history.length - 1].timestamp : null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
