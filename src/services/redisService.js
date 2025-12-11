import { createClient } from 'redis';

let redisClient = null;

export async function initializeRedis() {
  try {
    const host = process.env.REDIS_HOST || '127.0.0.1';
    const port = process.env.REDIS_PORT || 6379;
    const password = process.env.REDIS_PASSWORD || undefined;

    // Create client with a reconnect strategy so temporary down-times don't throw
    redisClient = createClient({
      url: `redis://${host}:${port}`,
      password,
      socket: {
        reconnectStrategy(retries) {
          // exponential backoff capped at 30s
          return Math.min(1000 * Math.pow(1.5, retries), 30000);
        },
      },
    });

    redisClient.on('error', (err) => console.warn('Redis error (non-fatal):', err && err.message ? err.message : err));
    redisClient.on('connect', () => console.log('Redis connecting...'));
    redisClient.on('ready', () => console.log('Redis ready'));
    redisClient.on('end', () => console.log('Redis connection ended'));

    // Try to connect, but don't make a failed connection fatal for the server.
    // If connect fails, the client will keep retrying according to reconnectStrategy.
    try {
      await redisClient.connect();
      return redisClient;
    } catch (err) {
      // Log and return the client object (it will attempt reconnects).
      console.warn('Redis initial connect failed (will retry):', err && err.message ? err.message : err);
      return redisClient;
    }
  } catch (error) {
    console.warn('Failed to initialize Redis client object:', error && error.message ? error.message : error);
    // Ensure redisClient remains null on catastrophic failure
    redisClient = null;
    return null;
  }
}

export async function getRedisClient() {
  // Only return the client when it's available and open
  if (!redisClient) return null;
  // `isOpen` is true when the connection is ready to accept commands
  if (typeof redisClient.isOpen === 'boolean' && !redisClient.isOpen) return null;
  return redisClient;
}

// Session management functions
export async function saveSessionHistory(sessionId, message) {
  try {
    const client = await getRedisClient();
    if (!client) {
      // Redis unavailable; skip saving history
      return;
    }
    const key = `session:${sessionId}:history`;
    const ttl = 24 * 60 * 60; // 24 hours

    // Add message to sorted set with timestamp
    const timestamp = Date.now();
    await client.zAdd(key, {
      score: timestamp,
      value: JSON.stringify({ ...message, timestamp }),
    });

    // Set expiration
    await client.expire(key, ttl);
  } catch (error) {
    console.error('Error saving session history:', error);
  }
}

export async function getSessionHistory(sessionId, limit = 50) {
  try {
    const client = await getRedisClient();
    if (!client) {
      return [];
    }
    const key = `session:${sessionId}:history`;
    const messages = await client.zRange(key, 0, limit - 1);
    return messages.map((msg) => JSON.parse(msg));
  } catch (error) {
    console.error('Error retrieving session history:', error);
    return [];
  }
}

export async function clearSession(sessionId) {
  try {
    const client = await getRedisClient();
    if (!client) {
      return;
    }
    const key = `session:${sessionId}:history`;
    await client.del(key);
  } catch (error) {
    console.error('Error clearing session:', error);
  }
}

// Cache functions for embeddings
export async function cacheEmbedding(key, embedding) {
  try {
    const client = await getRedisClient();
    if (!client) {
      return;
    }
    const ttl = 7 * 24 * 60 * 60; // 7 days
    await client.setEx(`embedding:${key}`, ttl, JSON.stringify(embedding));
  } catch (error) {
    console.error('Error caching embedding:', error);
  }
}

export async function getCachedEmbedding(key) {
  try {
    const client = await getRedisClient();
    if (!client) {
      return null;
    }
    const cached = await client.get(`embedding:${key}`);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Error retrieving cached embedding:', error);
    return null;
  }
}
