# Ollama Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all Anthropic Claude API calls with Ollama API calls using gemma4:31b-cloud.

**Architecture:** Swap the AI backend from Anthropic to Ollama by changing the fetch calls in 4 API handler locations (2 serverless + 2 Vite middleware) and ripping out client-side Anthropic key management. Ollama uses OpenAI-compatible chat format at `{OLLAMA_BASE_URL}/api/chat`.

**Tech Stack:** Node.js (Vercel serverless), Vite middleware, React 19

---

### Task 1: Update shared config and env files

**Files:**
- Modify: `api/shared/ai-config.js`
- Modify: `.env`
- Modify: `.env.example`

- [ ] **Step 1: Update ai-config.js**

Replace the contents of `api/shared/ai-config.js`:

```js
export const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL;
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL;

export const ANALYZE_SYSTEM_PROMPT = `You are an expert economic data analyst. You explain economic data series from the Federal Reserve Economic Data (FRED) database in clear, accessible language.

Given a statistical summary of a data series, provide a concise narrative (3-5 paragraphs) that covers:
1. What this indicator measures and why it matters
2. The overall trend over the available time period
3. Notable patterns, peaks, troughs, or inflection points
4. Recent behavior and what it suggests about current economic conditions
5. Brief context about how this indicator relates to the broader economy

Keep the tone professional but accessible — imagine explaining to someone with basic economic knowledge. Use specific numbers from the summary. Do not use markdown formatting — write in plain paragraphs.`;

export const NL_SEARCH_SYSTEM_PROMPT = `You are a FRED (Federal Reserve Economic Data) search assistant. Given a natural language question about economic data, extract 1-3 optimal search terms that would find the most relevant FRED data series.

Rules:
- Return FRED series IDs when you know them (e.g., "CPIAUCSL" for CPI, "UNRATE" for unemployment rate, "GDP" for GDP)
- Also include descriptive search terms as fallbacks (e.g., "consumer price index", "unemployment rate")
- Maximum 3 search terms, ordered by relevance
- Keep the explanation brief (one sentence)

You MUST respond with valid JSON only, no other text. Format:
{"searchTerms": ["TERM1", "TERM2"], "explanation": "Brief explanation of what you're searching for"}`;
```

- [ ] **Step 2: Update .env**

Replace the `ANTHROPIC_API_KEY` line:
```
FRED_API_KEY=311f23a1c836a93650d447f856d2d8b3
OLLAMA_BASE_URL=<your-ollama-url>
OLLAMA_MODEL=gemma4:31b-cloud
```

- [ ] **Step 3: Update .env.example**

Replace the Anthropic lines with Ollama:
```
FRED_API_KEY=your_fred_api_key_here
OLLAMA_BASE_URL=https://your-ollama-host.example.com
OLLAMA_MODEL=gemma4:31b-cloud
```

- [ ] **Step 4: Commit**

```bash
git add api/shared/ai-config.js .env .env.example
git commit -m "config: replace Anthropic config with Ollama"
```

---

### Task 2: Update serverless functions to use Ollama

**Files:**
- Modify: `api/analyze.js`
- Modify: `api/nl-search.js`

- [ ] **Step 1: Update api/analyze.js**

Replace the entire file:

```js
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
```

- [ ] **Step 2: Update api/nl-search.js**

Replace the entire file:

```js
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
      const msg = errData?.error || `Ollama API error: ${response.status}`;
      return res.status(response.status === 401 ? 401 : 502).json({ error: msg });
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
```

- [ ] **Step 3: Commit**

```bash
git add api/analyze.js api/nl-search.js
git commit -m "feat: replace Anthropic API calls with Ollama in serverless functions"
```

---

### Task 3: Update Vite dev middleware to use Ollama

**Files:**
- Modify: `vite.config.js`

- [ ] **Step 1: Replace imports and both middleware plugins**

Replace the import line at the top of `vite.config.js`:
```js
import { AI_MODEL, ANALYZE_SYSTEM_PROMPT, NL_SEARCH_SYSTEM_PROMPT } from './api/shared/ai-config.js'
```
with:
```js
import { OLLAMA_BASE_URL, OLLAMA_MODEL, ANALYZE_SYSTEM_PROMPT, NL_SEARCH_SYSTEM_PROMPT } from './api/shared/ai-config.js'
```

- [ ] **Step 2: Replace the `analyzeApiPlugin` function body**

Replace the try/catch block inside `analyzeApiPlugin` (lines 17-62). The full replacement for the plugin:

```js
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
        const { seriesId, seriesTitle, units, frequency, seasonalAdjustment, dataSummary } = JSON.parse(body);

        if (!OLLAMA_BASE_URL || !OLLAMA_MODEL) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Ollama is not configured on the server' }));
          return;
        }
        if (!dataSummary) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing dataSummary' }));
          return;
        }

        const userMessage = `Analyze this FRED economic data series:\n\nSeries: ${seriesTitle} (${seriesId})\nUnits: ${units}\nFrequency: ${frequency}\nSeasonal Adjustment: ${seasonalAdjustment}\n\nStatistical Summary:\n${dataSummary}`;

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

          const data = await response.json();
          res.setHeader('Content-Type', 'application/json');

          if (!response.ok) {
            res.statusCode = response.status === 401 ? 401 : 502;
            res.end(JSON.stringify({ error: data?.error || `API error: ${response.status}` }));
            return;
          }

          const narrative = data?.message?.content || 'No analysis generated.';
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
```

- [ ] **Step 3: Replace the `nlSearchApiPlugin` function body**

Replace the try/catch block inside `nlSearchApiPlugin` (lines 81-135). The full replacement for the plugin:

```js
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
        const { query } = JSON.parse(body);

        if (!OLLAMA_BASE_URL || !OLLAMA_MODEL) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Ollama is not configured on the server' }));
          return;
        }
        if (!query) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing query' }));
          return;
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

          const data = await response.json();
          res.setHeader('Content-Type', 'application/json');

          if (!response.ok) {
            res.statusCode = response.status === 401 ? 401 : 502;
            res.end(JSON.stringify({ error: data?.error || `API error: ${response.status}` }));
            return;
          }

          const text = data?.message?.content || '';
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
```

- [ ] **Step 4: Commit**

```bash
git add vite.config.js
git commit -m "feat: replace Anthropic API calls with Ollama in dev middleware"
```

---

### Task 4: Remove client-side Anthropic key management

**Files:**
- Modify: `src/api/fred.js`
- Modify: `src/api/__tests__/fred.test.js`
- Modify: `src/components/AiNarrator.jsx`
- Modify: `src/pages/Search.jsx`

- [ ] **Step 1: Remove Anthropic key functions from fred.js**

Remove lines 118-151 from `src/api/fred.js` — the four functions `getAnthropicKey`, `setAnthropicKey`, `hasAnthropicKey`, and `clearAnthropicKey` (including their doc comments and the `_recessionCache` line should stay, only remove the 4 Anthropic functions).

- [ ] **Step 2: Remove Anthropic key tests from fred.test.js**

Remove lines 72-96 from `src/api/__tests__/fred.test.js` — the entire `describe('Anthropic key localStorage error handling', ...)` block.

- [ ] **Step 3: Remove apiKey from AiNarrator.jsx**

In `src/components/AiNarrator.jsx`:
- Line 2: Change `import { getAnthropicKey } from '../api/fred';` to `import { Sparkles, AlertTriangle, X, ChevronUp, ChevronDown } from 'lucide-react';` (remove getAnthropicKey, fix the import)
- Actually, `Sparkles` is imported from lucide-react alongside getAnthropicKey on line 3. Let's be precise:

Change lines 2-3:
```js
import { getAnthropicKey } from '../api/fred';
import { Sparkles, AlertTriangle, X, ChevronUp, ChevronDown } from 'lucide-react';
```
to just:
```js
import { Sparkles, AlertTriangle, X, ChevronUp, ChevronDown } from 'lucide-react';
```

Then remove line 84 (`apiKey: getAnthropicKey(),`) from the fetch body.

- [ ] **Step 4: Remove apiKey from Search.jsx**

In `src/pages/Search.jsx`:
- Line 4: Change `import { searchSeries, getAnthropicKey } from '../api/fred';` to `import { searchSeries } from '../api/fred';`
- Line 22: Change `body: JSON.stringify({ apiKey: getAnthropicKey(), query }),` to `body: JSON.stringify({ query }),`

- [ ] **Step 5: Run tests**

```bash
npm test
```
Expected: all existing tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/api/fred.js src/api/__tests__/fred.test.js src/components/AiNarrator.jsx src/pages/Search.jsx
git commit -m "feat: remove client-side Anthropic key management"
```
