import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { AI_MODEL, ANALYZE_SYSTEM_PROMPT, NL_SEARCH_SYSTEM_PROMPT } from './api/shared/ai-config.js'

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
        const { apiKey: clientKey, seriesId, seriesTitle, units, frequency, seasonalAdjustment, dataSummary } = JSON.parse(body);
        const apiKey = clientKey || process.env.ANTHROPIC_API_KEY;

        if (!apiKey || !dataSummary) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing apiKey or dataSummary' }));
          return;
        }

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
              model: AI_MODEL,
              max_tokens: 1024,
              system: ANALYZE_SYSTEM_PROMPT,
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
        const { apiKey: clientKey, query } = JSON.parse(body);
        const apiKey = clientKey || process.env.ANTHROPIC_API_KEY;

        if (!apiKey || !query) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing apiKey or query' }));
          return;
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

// Dev-only middleware to handle /api/fred-proxy (mirrors the Vercel serverless function)
function fredProxyApiPlugin() {
  return {
    name: 'fred-proxy-api',
    configureServer(server) {
      server.middlewares.use('/api/fred-proxy', async (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        const url = new URL(req.url, 'http://localhost');
        const endpoint = url.searchParams.get('endpoint');

        if (!endpoint) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'endpoint parameter required' }));
          return;
        }

        if (endpoint.includes('..') || endpoint.startsWith('/')) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Invalid endpoint' }));
          return;
        }

        const apiKey = process.env.FRED_API_KEY;
        if (!apiKey) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'FRED API key not configured on server' }));
          return;
        }

        const params = new URLSearchParams();
        params.set('api_key', apiKey);
        params.set('file_type', 'json');
        for (const [k, v] of url.searchParams.entries()) {
          if (k !== 'endpoint') params.set(k, v);
        }

        const fredUrl = `https://api.stlouisfed.org/fred/${endpoint}?${params.toString()}`;

        try {
          const response = await fetch(fredUrl);
          const data = await response.text();
          res.statusCode = response.status;
          res.setHeader('Content-Type', 'application/json');
          res.end(data);
        } catch (err) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Failed to reach FRED API' }));
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env so API keys are available in process.env for middleware
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
  plugins: [react(), analyzeApiPlugin(), nlSearchApiPlugin(), fredProxyApiPlugin()],
  };
})
