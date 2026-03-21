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

  const systemPrompt = `You are a FRED (Federal Reserve Economic Data) search assistant. Given a natural language question about economic data, extract 1-3 optimal search terms that would find the most relevant FRED data series.

Rules:
- Return FRED series IDs when you know them (e.g., "CPIAUCSL" for CPI, "UNRATE" for unemployment rate, "GDP" for GDP)
- Also include descriptive search terms as fallbacks (e.g., "consumer price index", "unemployment rate")
- Maximum 3 search terms, ordered by relevance
- Keep the explanation brief (one sentence)

You MUST respond with valid JSON only, no other text. Format:
{"searchTerms": ["TERM1", "TERM2"], "explanation": "Brief explanation of what you're searching for"}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 256,
        system: systemPrompt,
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
