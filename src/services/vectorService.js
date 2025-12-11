import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let vectorDB = null;

export async function initializeVectorDB() {
  try {
    vectorDB = {
      documents: [],
      embeddingIndex: new Map(),
      dataFilePath: path.join(__dirname, '../../data/vector_db.json'),
    };

    // Load existing documents if they exist
    if (fs.existsSync(vectorDB.dataFilePath)) {
      const data = JSON.parse(fs.readFileSync(vectorDB.dataFilePath, 'utf-8'));
      vectorDB.documents = data.documents || [];
      vectorDB.embeddingIndex = new Map(data.embeddingIndex || []);
      console.log(`Loaded ${vectorDB.documents.length} documents from vector store`);
    }

    return vectorDB;
  } catch (error) {
    console.error('Failed to initialize Vector DB:', error);
    throw error;
  }
}

export function getVectorDB() {
  if (!vectorDB) {
    throw new Error('Vector DB not initialized');
  }
  return vectorDB;
}

/**
 * Add documents to vector store
 */
export function addDocuments(documents) {
  try {
    const db = getVectorDB();
    
    documents.forEach((doc) => {
      const docWithId = {
        id: doc.id || `doc_${Date.now()}_${Math.random()}`,
        ...doc,
      };
      db.documents.push(docWithId);
      db.embeddingIndex.set(docWithId.id, docWithId.embedding);
    });

    saveVectorDB();
    console.log(`Added ${documents.length} documents to vector store`);
  } catch (error) {
    console.error('Error adding documents:', error);
  }
}

/**
 * Search documents by embedding similarity
 */
export function searchDocuments(queryEmbedding, topK = 5) {
  try {
    const db = getVectorDB();

    if (db.documents.length === 0) {
      return [];
    }

    // Calculate similarity scores
    const scores = db.documents.map((doc) => {
      const similarity = cosineSimilarity(queryEmbedding, doc.embedding);
      return { doc, similarity };
    });

    // Sort by similarity and return top-k
    return scores
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .map((item) => ({
        ...item.doc,
        score: item.similarity,
      }));
  } catch (error) {
    console.error('Error searching documents:', error);
    return [];
  }
}

/**
 * Get document by ID
 */
export function getDocumentById(docId) {
  try {
    const db = getVectorDB();
    return db.documents.find((doc) => doc.id === docId);
  } catch (error) {
    console.error('Error getting document:', error);
    return null;
  }
}

/**
 * Clear all documents
 */
export function clearDocuments() {
  try {
    const db = getVectorDB();
    db.documents = [];
    db.embeddingIndex.clear();
    saveVectorDB();
    console.log('Vector DB cleared');
  } catch (error) {
    console.error('Error clearing vector DB:', error);
  }
}

/**
 * Get total document count
 */
export function getDocumentCount() {
  try {
    const db = getVectorDB();
    return db.documents.length;
  } catch (error) {
    console.error('Error getting document count:', error);
    return 0;
  }
}

/**
 * Save vector DB to disk
 */
function saveVectorDB() {
  try {
    const db = getVectorDB();
    const data = {
      documents: db.documents,
      embeddingIndex: Array.from(db.embeddingIndex),
      savedAt: new Date().toISOString(),
    };

    // Ensure data directory exists
    const dataDir = path.dirname(db.dataFilePath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(db.dataFilePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving vector DB:', error);
  }
}

/**
 * Calculate cosine similarity between two embeddings
 */
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) {
    return 0;
  }

  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}
