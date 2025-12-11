import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;

export async function initializeGemini() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not set — Gemini LLM disabled (using fallback responses)');
      genAI = null;
      return null;
    }

    genAI = new GoogleGenerativeAI(apiKey);

    // Try to list available models via the REST endpoint so we can log which models the API key can access.
    try {
      const listResp = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
      if (listResp.ok) {
        const listJson = await listResp.json();
        const models = listJson.models || [];
        const modelNames = models.map((m) => (m.name || m.displayName || '').toString());
        console.log('Available Gemini models (REST):', modelNames.length ? modelNames.join(', ') : '<none>');
        // Prefer models that support generateContent
        const genModels = models.filter((m) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'));
        genAI._availableModels = genModels.map((m) => m.name.split('/').pop());
        console.log('Models supporting generateContent:', genAI._availableModels.join(', '));
      } else {
        console.log('Could not fetch model list via REST, status:', listResp.status);
      }
    } catch (err) {
      console.warn('Could not list Gemini models via REST:', err && err.message ? err.message : err);
    }

    return genAI;
  } catch (error) {
    console.error('Failed to initialize Gemini:', error && error.message ? error.message : error);
    // Keep genAI null and allow callers to fallback
    genAI = null;
    return null;
  }
}

export function getGemini() {
  if (!genAI) {
    // Attempt to initialize; may return null when no key configured
    return initializeGemini();
  }
  return genAI;
}

/**
 * Generate answer using Gemini with RAG context
 */
export async function generateAnswer(query, context = []) {
  try {
    const genAI = getGemini();

    // If Gemini is not configured, return a sensible fallback answer.
    if (!genAI) {
      // If we have context, provide a short summary-like reply using the first context item.
      if (Array.isArray(context) && context.length > 0) {
        const first = context[0];
        const snippet = (first.content || first.text || '').slice(0, 300);
        return `(LLM not configured) I found a relevant source: ${first.source || 'Unknown'}. Here's a short excerpt: ${snippet}${snippet.length >= 300 ? '...' : ''}`;
      }

      // No context — respond conversationally with a generic fallback
      return `I don't have the language model configured to generate a full answer. To enable full responses, set the environment variable GEMINI_API_KEY with your Google Gemini API key.`;
    }

    // Use the first available model from REST listing (guaranteed to work)
    let model = null;
    const availableModels = genAI._availableModels || [];

    if (availableModels.length === 0) {
      console.error('No Gemini models available for generateContent in this account');
      if (Array.isArray(context) && context.length > 0) {
        const first = context[0];
        const snippet = (first.content || first.text || '').slice(0, 300);
        return `(LLM unavailable) No compatible model found for your API key. Found source: ${first.source || 'Unknown'}. Excerpt: ${snippet}${snippet.length >= 300 ? '...' : ''}`;
      }
      return `Language model unavailable. No compatible Gemini model found for your API key. Please check your GEMINI_API_KEY.`;
    }

    // Get the first compatible model
    const modelName = availableModels[0];
    try {
      model = genAI.getGenerativeModel({ model: modelName });
      console.log(`✓ Using model: ${modelName}`);
    } catch (err) {
      console.error(`Failed to initialize model ${modelName}:`, err && err.message ? err.message : err);
      if (Array.isArray(context) && context.length > 0) {
        const first = context[0];
        const snippet = (first.content || first.text || '').slice(0, 300);
        return `(LLM error) Could not initialize model. Found source: ${first.source || 'Unknown'}. Excerpt: ${snippet}${snippet.length >= 300 ? '...' : ''}`;
      }
      return `Failed to initialize language model. Please try again later.`;
    }

    let contextText = '';
    let systemPrompt;

    if (Array.isArray(context) && context.length > 0) {
      systemPrompt = `You are a helpful news assistant chatbot. Use the provided context from news articles to answer questions accurately. Always cite the source articles when providing information. If the context doesn't contain relevant information for a specific factual claim, say you don't have that information available.`;

      contextText = context
        .map(
          (doc, i) =>
            `[Source ${i + 1}]: ${doc.source || 'Unknown'}\n${doc.content || doc.text || ''}`
        )
        .join('\n\n');
    } else {
      systemPrompt = `You are a helpful, friendly conversational assistant. Answer casual user questions (greetings, small talk, general advice) politely and clearly. If a user asks for facts not in your knowledge, be honest about your limits.`;
    }

    const fullPrompt = `${systemPrompt}\n\n${contextText ? `Context from news articles:\n${contextText}\n\n` : ''}User Question: ${query}\n\nPlease provide a helpful answer based on the context above.`;

    try {
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating answer with Gemini:', error && error.message ? error.message : error);
      // If Gemini call fails (model not found, API mismatch, etc.), return a safe fallback.
      if (Array.isArray(context) && context.length > 0) {
        const first = context[0];
        const snippet = (first.content || first.text || '').slice(0, 300);
        return `(LLM error) I couldn't generate a full answer due to an upstream API issue. I did find a relevant source: ${first.source || 'Unknown'}. Excerpt: ${snippet}${snippet.length >= 300 ? '...' : ''}`;
      }
      return `I couldn't generate a full answer due to an upstream language model error. Please try again later or configure a valid GEMINI_API_KEY.`;
    }
  } catch (error) {
    console.error('Error preparing Gemini prompt:', error && error.message ? error.message : error);
    // Fallback safe message
    if (Array.isArray(context) && context.length > 0) {
      const first = context[0];
      const snippet = (first.content || first.text || '').slice(0, 300);
      return `(LLM error) Unable to prepare request. Found a relevant source: ${first.source || 'Unknown'}. Excerpt: ${snippet}${snippet.length >= 300 ? '...' : ''}`;
    }
    return 'I could not prepare a language model request. Please try again later.';
  }
}

/**
 * Stream answer generation (returns chunks)
 */
export async function* streamAnswer(query, context) {
  try {
    const genAI = getGemini();

    // If Gemini is not configured, yield a short fallback message as a single chunk
    if (!genAI) {
      if (Array.isArray(context) && context.length > 0) {
        const first = context[0];
        const snippet = (first.content || first.text || '').slice(0, 300);
        yield `(LLM not configured) Found source: ${first.source || 'Unknown'}. Excerpt: ${snippet}${snippet.length >= 300 ? '...' : ''}`;
      } else {
        yield `LLM not configured. Set GEMINI_API_KEY to enable full answers.`;
      }
      return;
    }

    // Use the first available model from REST listing (guaranteed to work)
    let model = null;
    const availableModels = genAI._availableModels || [];

    if (availableModels.length === 0) {
      console.error('No Gemini models available for streaming in this account');
      if (Array.isArray(context) && context.length > 0) {
        const first = context[0];
        const snippet = (first.content || first.text || '').slice(0, 300);
        yield `(LLM unavailable) No compatible model found. Found source: ${first.source || 'Unknown'}. Excerpt: ${snippet}${snippet.length >= 300 ? '...' : ''}`;
      } else {
        yield `Language model unavailable. No compatible Gemini model found for your API key.`;
      }
      return;
    }

    // Get the first compatible model
    const modelName = availableModels[0];
    try {
      model = genAI.getGenerativeModel({ model: modelName });
      console.log(`✓ Streaming with model: ${modelName}`);
    } catch (err) {
      console.error(`Failed to initialize model ${modelName} for streaming:`, err && err.message ? err.message : err);
      if (Array.isArray(context) && context.length > 0) {
        const first = context[0];
        const snippet = (first.content || first.text || '').slice(0, 300);
        yield `(LLM error) Could not initialize model for streaming. Found source: ${first.source || 'Unknown'}. Excerpt: ${snippet}${snippet.length >= 300 ? '...' : ''}`;
      } else {
        yield `Failed to initialize language model for streaming. Please try again later.`;
      }
      return;
    }

    let contextText = '';
    let systemPrompt;
    if (Array.isArray(context) && context.length > 0) {
      systemPrompt = `You are a helpful news assistant chatbot. Use the provided context to answer questions accurately. Always cite the provided sources when using them.`;

      contextText = context
        .map(
          (doc, i) =>
            `[Source ${i + 1}]: ${doc.source || 'Unknown'}\n${doc.content || doc.text || ''}`
        )
        .join('\n\n');
    } else {
      systemPrompt = `You are a helpful, friendly conversational assistant. Answer casual user questions (greetings, small talk, general advice) politely and clearly.`;
    }

    const fullPrompt = `${systemPrompt}\n\n${contextText ? `Context from news articles:\n${contextText}\n\n` : ''}User Question: ${query}\n\nPlease provide a helpful answer based on the context above.`;

    try {
      const result = await model.generateContentStream(fullPrompt);

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          yield text;
        }
      }
    } catch (error) {
      console.error('Error streaming answer from Gemini:', error && error.message ? error.message : error);
      // Yield a single fallback chunk and finish
      if (Array.isArray(context) && context.length > 0) {
        const first = context[0];
        const snippet = (first.content || first.text || '').slice(0, 300);
        yield `(LLM error) Couldn't stream answer. Found source: ${first.source || 'Unknown'}. Excerpt: ${snippet}${snippet.length >= 300 ? '...' : ''}`;
      } else {
        yield 'LLM streaming error. Set a valid GEMINI_API_KEY or try again later.';
      }
      return;
    }
  } catch (error) {
    console.error('Error preparing streaming prompt:', error && error.message ? error.message : error);
    if (Array.isArray(context) && context.length > 0) {
      const first = context[0];
      const snippet = (first.content || first.text || '').slice(0, 300);
      yield `(LLM error) Couldn't prepare request. Found source: ${first.source || 'Unknown'}. Excerpt: ${snippet}${snippet.length >= 300 ? '...' : ''}`;
    } else {
      yield 'LLM preparation error. Please try again later.';
    }
    return;
  }
}

/**
 * Format context for display
 */
export function formatContext(documents) {
  return documents
    .map((doc, i) => ({
      index: i + 1,
      source: doc.source || 'Unknown',
      summary: doc.content || doc.text || '',
      score: doc.score || 0,
    }))
    .sort((a, b) => b.score - a.score);
}
