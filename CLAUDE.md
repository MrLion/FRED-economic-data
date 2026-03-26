# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Vite dev server at localhost:5173
npm run build    # Production build to dist/
npm run lint     # ESLint
npm run preview  # Preview production build
npm test         # Run vitest test suite
```

## Architecture

React 19 SPA with Vercel serverless AI functions. No state management library — uses localStorage and custom hooks.

### Dual-Environment API Proxy

All FRED API calls go through `/api/fred-proxy`, a serverless function that injects `FRED_API_KEY` from server-side environment variables. The API key never touches the browser — not in URLs, not in localStorage, not in network requests.

- **Dev:** Custom Vite middleware plugin in `vite.config.js` intercepts GET requests to `/api/fred-proxy` and proxies to `api.stlouisfed.org`
- **Production:** Vercel serverless function `api/fred-proxy.js` does the same

AI endpoints (`/api/analyze`, `/api/nl-search`) follow the same dual-environment pattern:

- **Dev:** Custom Vite middleware plugins in `vite.config.js` intercept POST requests and proxy to Anthropic
- **Production:** Vercel serverless functions in `api/analyze.js` and `api/nl-search.js`

### Shared AI Config

All AI configuration lives in `api/shared/ai-config.js` — single source of truth for:
- `AI_MODEL` — reads `ANTHROPIC_MODEL` env var with fallback to `claude-3-haiku-20240307`
- `ANALYZE_SYSTEM_PROMPT` — chart analysis system prompt
- `NL_SEARCH_SYSTEM_PROMPT` — natural language search system prompt

Both serverless functions and Vite middleware import from this shared file. **Never duplicate prompts or model strings.**

### Key Management

- **FRED key:** Server-side only. `FRED_API_KEY` env var, injected by `api/fred-proxy.js`. No client-side key storage.
- **Anthropic key:** Server-side via `ANTHROPIC_API_KEY` env var. Client sends empty `apiKey` field; serverless functions fall back to env var.

### Data Flow Patterns

- **`useFred` hook** (`src/hooks/useFred.js`): Generic async fetcher returning `{ data, loading, error, refetch }`. Used by all pages.
- **`useHistory` hook** (`src/hooks/useHistory.js`): Tracks last 20 viewed series in localStorage with try-catch error handling.
- **AI chart analysis**: Client computes a statistical summary of the data points locally, then sends only the summary (not raw data) to Claude to minimize token usage.
- **Natural language search**: `isNaturalLanguage()` heuristic in `Search.jsx` detects questions (question marks, question words, contractions, 6+ words). Claude extracts 1-3 FRED search terms, which are queried in parallel and deduplicated.
- **Search race condition fix**: `Search.jsx` uses `AbortController` to cancel stale requests when the query changes. `signal` threads through `nlSearch()` → `searchSeries()` → `fredFetch()` → `fetch()`.

### AI Model

Configured via `AI_MODEL` in `api/shared/ai-config.js`. Reads `ANTHROPIC_MODEL` env var with fallback to `claude-3-haiku-20240307`.

## Deployment

Vercel with **Vite** framework preset. Required env vars in Vercel dashboard:
- `FRED_API_KEY` — FRED API key (required)
- `ANTHROPIC_API_KEY` — Anthropic API key (required for AI features)
- `ANTHROPIC_MODEL` — optional model override

## File Conventions

- Pages: `src/pages/`. Components: `src/components/`. Hooks: `src/hooks/`. API: `src/api/`.
- One CSS file: `src/App.css`. Three breakpoints: mobile (<640px), tablet (640-1023px), desktop (1024px+).
- Serverless functions: `api/` at project root. Shared config: `api/shared/`. Client API wrappers: `src/api/`.

## Testing

- Framework: Vitest
- Tests: colocated in `__tests__/` directories next to source files
- Run: `npm test`
