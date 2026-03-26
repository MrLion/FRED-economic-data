import { AI_MODEL, ANALYZE_SYSTEM_PROMPT } from './shared/ai-config.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { apiKey: clientKey, seriesId, seriesTitle, units, frequency, seasonalAdjustment, dataSummary } = req.body || {};
  const apiKey = clientKey || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(400).json({ error: 'Anthropic API key is required' });
  }
  if (!dataSummary) {
    return res.status(400).json({ error: 'Data summary is required' });
  }

  const userMessage = `Analyze this FRED economic data series:

Series: ${seriesTitle} (${seriesId})
Units: ${units}
Frequency: ${frequency}
Seasonal Adjustment: ${seasonalAdjustment}

Statistical Summary:
${dataSummary}`;

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
        max_tokens: 1024,
        system: ANALYZE_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData?.error?.message || `Anthropic API error: ${response.status}`;
      return res.status(response.status === 401 ? 401 : 502).json({ error: msg });
    }

    const data = await response.json();
    const narrative = data?.content?.[0]?.text || 'No analysis generated.';
    return res.status(200).json({ narrative });
  } catch (err) {
    return res.status(500).json({ error: `Failed to analyze: ${err.message}` });
  }
}
