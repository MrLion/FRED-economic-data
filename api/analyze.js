export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { apiKey, seriesId, seriesTitle, units, frequency, seasonalAdjustment, dataSummary } = req.body || {};

  if (!apiKey) {
    return res.status(400).json({ error: 'Anthropic API key is required' });
  }
  if (!dataSummary) {
    return res.status(400).json({ error: 'Data summary is required' });
  }

  const systemPrompt = `You are an expert economic data analyst. You explain economic data series from the Federal Reserve Economic Data (FRED) database in clear, accessible language.

Given a statistical summary of a data series, provide a concise narrative (3-5 paragraphs) that covers:
1. What this indicator measures and why it matters
2. The overall trend over the available time period
3. Notable patterns, peaks, troughs, or inflection points
4. Recent behavior and what it suggests about current economic conditions
5. Brief context about how this indicator relates to the broader economy

Keep the tone professional but accessible — imagine explaining to someone with basic economic knowledge. Use specific numbers from the summary. Do not use markdown formatting — write in plain paragraphs.`;

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
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        system: systemPrompt,
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
