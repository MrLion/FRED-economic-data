import { AI_MODEL, NL_SEARCH_SYSTEM_PROMPT } from './shared/ai-config.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { apiKey: clientKey, query } = req.body || {};
  const apiKey = clientKey || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ error: 'Anthropic API key is required' });
  }
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 256,
        system: NL_SEARCH_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: query }],
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData?.error?.message || `Anthropic API error: ${response.status}`;
      return res.status(response.status === 401 ? 401 : 502).json({ error: msg });
    }

    const data = await response.json();
    const text = data?.content?.[0]?.text || '';

    try {
      const parsed = JSON.parse(text);
      return res.status(200).json({
        searchTerms: parsed.searchTerms || [],
        explanation: parsed.explanation || '',
      });
    } catch {
      // If Claude didn't return valid JSON, extract what we can
      return res.status(200).json({
        searchTerms: [query],
        explanation: 'Could not interpret query — using original search terms.',
      });
    }
  } catch (err) {
    return res.status(500).json({ error: `Failed: ${err.message}` });
  }
}
