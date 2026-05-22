import { OLLAMA_BASE_URL, OLLAMA_MODEL, ANALYZE_SYSTEM_PROMPT } from './shared/ai-config.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { seriesId, seriesTitle, units, frequency, seasonalAdjustment, dataSummary } = req.body || {};

  if (!OLLAMA_BASE_URL || !OLLAMA_MODEL) {
    return res.status(500).json({ error: 'Ollama is not configured on the server' });
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
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: 'system', content: ANALYZE_SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData?.error || `Ollama API error: ${response.status}`;
      return res.status(response.status === 401 ? 401 : 502).json({ error: msg });
    }

    const data = await response.json();
    const narrative = data?.message?.content || 'No analysis generated.';
    return res.status(200).json({ narrative });
  } catch (err) {
    return res.status(500).json({ error: `Failed to analyze: ${err.message}` });
  }
}
