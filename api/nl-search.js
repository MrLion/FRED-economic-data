import { OLLAMA_BASE_URL, OLLAMA_MODEL, NL_SEARCH_SYSTEM_PROMPT } from './shared/ai-config.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body || {};

  if (!OLLAMA_BASE_URL || !OLLAMA_MODEL) {
    return res.status(500).json({ error: 'Ollama is not configured on the server' });
  }
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: 'system', content: NL_SEARCH_SYSTEM_PROMPT },
          { role: 'user', content: query },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = String(errData?.error || '') || `Ollama API error: ${response.status}`;
      return res.status(502).json({ error: msg });
    }

    const data = await response.json();
    const text = data?.message?.content || '';

    try {
      const parsed = JSON.parse(text);
      return res.status(200).json({
        searchTerms: parsed.searchTerms || [],
        explanation: parsed.explanation || '',
      });
    } catch {
      return res.status(200).json({
        searchTerms: [query],
        explanation: 'Could not interpret query — using original search terms.',
      });
    }
  } catch (err) {
    return res.status(500).json({ error: `Failed: ${err.message}` });
  }
}
