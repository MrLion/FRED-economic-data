# Ollama Migration Design

**Date:** 2026-05-21
**Goal:** Replace Claude API with Ollama (gemma4:31b-cloud) for AI features.

## Overview

Replace all Anthropic API calls with Ollama API calls. Ollama runs in the cloud (not localhost) and replaces Claude entirely — no fallback. Configuration uses `.env` for local dev and Vercel env vars for production.

## Configuration

### New env vars
- `OLLAMA_BASE_URL` — cloud Ollama endpoint (e.g., `https://your-ollama-host`)
- `OLLAMA_MODEL` — model identifier (e.g., `gemma4:31b-cloud`)

### Removed env vars
- `ANTHROPIC_API_KEY` — no longer needed
- `ANTHROPIC_MODEL` — no longer needed

## Changes

### 1. `api/shared/ai-config.js`
- Add: `OLLAMA_BASE_URL` and `OLLAMA_MODEL` exports (from `process.env`, no defaults)
- Remove: `AI_MODEL` export
- Keep: `ANALYZE_SYSTEM_PROMPT`, `NL_SEARCH_SYSTEM_PROMPT` (model-agnostic, no changes needed)

### 2. `api/analyze.js` (Vercel serverless)
- Replace fetch target: `{OLLAMA_BASE_URL}/api/chat`
- Request body format: `{ model: OLLAMA_MODEL, messages: [{role: "system", content: ANALYZE_SYSTEM_PROMPT}, {role: "user", content: userMessage}], stream: false }`
- Response parsing: `data.message.content` instead of `data.content[0].text`
- Remove `apiKey` parameter from request body handling
- Remove Anthropic-specific headers (`x-api-key`, `anthropic-version`)
- Error messages: replace "Anthropic API" references with "Ollama"

### 3. `api/nl-search.js` (Vercel serverless)
- Same transformations as analyze.js
- Response parsing: extract JSON from `data.message.content`, same JSON.parse logic

### 4. `vite.config.js` (dev middleware)
- Replace Anthropic calls in `analyzeApiPlugin` and `nlSearchApiPlugin` with Ollama calls
- Same request/response format changes as above
- Import `OLLAMA_BASE_URL` and `OLLAMA_MODEL` from `api/shared/ai-config.js`
- Remove `apiKey` handling

### 5. `src/api/fred.js`
- Remove functions: `getAnthropicKey`, `setAnthropicKey`, `hasAnthropicKey`, `clearAnthropicKey`

### 6. `src/components/AiNarrator.jsx`
- Line 2: Remove `getAnthropicKey` import
- Line 84: Remove `apiKey: getAnthropicKey(),` from POST body

### 7. `src/pages/Search.jsx`
- Line 4: Remove `getAnthropicKey` import
- Line 22: Remove `apiKey: getAnthropicKey(),` from POST body

### 8. Settings page (if present)
- Remove any UI for managing Anthropic API key
- (Keys are now entirely server-side)

## Ollama API Format (Chat)

**Request:**
```json
POST {OLLAMA_BASE_URL}/api/chat
{
  "model": "gemma4:31b-cloud",
  "messages": [
    {"role": "system", "content": "<system prompt>"},
    {"role": "user", "content": "<user query>"}
  ],
  "stream": false
}
```

**Response:**
```json
{
  "model": "gemma4:31b-cloud",
  "message": {
    "role": "assistant",
    "content": "<response text>"
  }
}
```

## What doesn't change
- System prompts — model-agnostic, work for any capable LLM
- `computeDataSummary()` — client-side data summary stays the same
- All UI components — only request bodies lose the `apiKey` field
- FRED proxy (`api/fred-proxy`, `src/api/fred.js` data fetching)
- Error handling structure (status codes, try/catch)
