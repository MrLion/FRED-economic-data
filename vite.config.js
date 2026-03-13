import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev-only middleware to handle /api/analyze (mirrors the Vercel serverless function)
function analyzeApiPlugin() {
  return {
    name: 'analyze-api',
    configureServer(server) {
      server.middlewares.use('/api/analyze', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        for await (const chunk of req) body += chunk;
        const { apiKey, seriesId, seriesTitle, units, frequency, seasonalAdjustment, dataSummary } = JSON.parse(body);

        if (!apiKey || !dataSummary) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing apiKey or dataSummary' }));
          return;
        }

        const systemPrompt = `You are an expert economic data analyst. You explain economic data series from the Federal Reserve Economic Data (FRED) database in clear, accessible language.

Given a statistical summary of a data series, provide a concise narrative (3-5 paragraphs) that covers:
1. What this indicator measures and why it matters
2. The overall trend over the available time period
3. Notable patterns, peaks, troughs, or inflection points
4. Recent behavior and what it suggests about current economic conditions
5. Brief context about how this indicator relates to the broader economy

Keep the tone professional but accessible. Use specific numbers from the summary. Do not use markdown formatting — write in plain paragraphs.`;

        const userMessage = `Analyze this FRED economic data series:\n\nSeries: ${seriesTitle} (${seriesId})\nUnits: ${units}\nFrequency: ${frequency}\nSeasonal Adjustment: ${seasonalAdjustment}\n\nStatistical Summary:\n${dataSummary}`;

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
              max_tokens: 1024,
              system: systemPrompt,
              messages: [{ role: 'user', content: userMessage }],
            }),
          });

          const data = await response.json();
          res.setHeader('Content-Type', 'application/json');

          if (!response.ok) {
            res.statusCode = response.status === 401 ? 401 : 502;
            res.end(JSON.stringify({ error: data?.error?.message || `API error: ${response.status}` }));
            return;
          }

          const narrative = data?.content?.[0]?.text || 'No analysis generated.';
          res.end(JSON.stringify({ narrative }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: `Failed: ${err.message}` }));
        }
      });
    },
  };
}

// Dev-only middleware to handle /api/nl-search (mirrors the Vercel serverless function)
function nlSearchApiPlugin() {
  return {
    name: 'nl-search-api',
    configureServer(server) {
      server.middlewares.use('/api/nl-search', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        for await (const chunk of req) body += chunk;
        const { apiKey, query } = JSON.parse(body);

        if (!apiKey || !query) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing apiKey or query' }));
          return;
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

          const data = await response.json();
          res.setHeader('Content-Type', 'application/json');

          if (!response.ok) {
            res.statusCode = response.status === 401 ? 401 : 502;
            res.end(JSON.stringify({ error: data?.error?.message || `API error: ${response.status}` }));
            return;
          }

          const text = data?.content?.[0]?.text || '';
          try {
            const parsed = JSON.parse(text);
            res.end(JSON.stringify({
              searchTerms: parsed.searchTerms || [],
              explanation: parsed.explanation || '',
            }));
          } catch {
            res.end(JSON.stringify({
              searchTerms: [query],
              explanation: 'Could not interpret query — using original search terms.',
            }));
          }
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: `Failed: ${err.message}` }));
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), analyzeApiPlugin(), nlSearchApiPlugin()],
  server: {
    proxy: {
      '/api/fred': {
        target: 'https://api.stlouisfed.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/fred/, '/fred'),
      },
    },
  },
})
