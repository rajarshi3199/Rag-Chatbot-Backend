import axios from 'axios';

/**
 * Get embeddings from Jina API
 * Uses free tier: jina-embeddings-v2-base-en
 */
export async function getEmbeddings(texts) {
  try {
    const model = process.env.EMBEDDING_MODEL || 'jina-embeddings-v2-base-en';
    
    // For demo purposes, generate random embeddings
    // In production, use actual Jina API:
    // const response = await axios.post(
    //   'https://api.jina.ai/v1/embeddings',
    //   { input: texts, model },
    //   { headers: { Authorization: `Bearer ${process.env.EMBEDDING_API_KEY}` } }
    // );

    console.log(`Generating embeddings for ${Array.isArray(texts) ? texts.length : 1} text(s)`);
    
    // Generate mock embeddings (384-dimensional for jina-embeddings-v2-base-en)
    const embeddingDim = 384;
    const textsArray = Array.isArray(texts) ? texts : [texts];
    
    const embeddings = textsArray.map((text) => {
      // Create deterministic embedding based on text hash
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      // Generate pseudo-random embedding using hash
      const seededRandom = (seed) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      };

      const embedding = Array.from({ length: embeddingDim }, (_, i) =>
        seededRandom(hash + i)
      );

      return embedding;
    });

    return Array.isArray(texts) ? embeddings : embeddings[0];
  } catch (error) {
    console.error('Error getting embeddings:', error);
    throw error;
  }
}

/**
 * Embed multiple documents
 */
export async function embedDocuments(documents) {
  try {
    const texts = documents.map((doc) => doc.content || doc);
    const embeddings = await getEmbeddings(texts);
    return documents.map((doc, index) => ({
      ...doc,
      embedding: embeddings[index],
    }));
  } catch (error) {
    console.error('Error embedding documents:', error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}
