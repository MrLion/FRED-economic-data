# Changelog

## v2.0.0 - Architecture Pass (2026-03-26)

### Security
- **FRED API key moved server-side** -- API key is now injected by `api/fred-proxy.js` serverless function from `FRED_API_KEY` env var. Key never touches the browser (no URL params, no localStorage, no network tab exposure)
- **Login gate removed** -- App loads directly without API key entry or CAPTCHA. Server-side key serves all users.

### Fixed
- **Search race condition** -- Replaced `let cancelled` boolean with `AbortController`. Signal threads through `nlSearch()` → `searchSeries()` → `fredFetch()` → `fetch()`. Rapid typing no longer shows stale results.
- **NL detection heuristic** -- Now handles contractions (what's, how's) and raises word threshold from 5 to 6 to reduce false positives.
- **localStorage error handling** -- All `localStorage` calls wrapped in try-catch for Safari private browsing and quota exceeded. Graceful defaults instead of silent crashes.
- **AI prompt drift** -- Analyze prompt in vite.config.js was missing a clause present in the serverless version. Both now import from single source of truth.

### Changed
- **Shared AI config** -- `api/shared/ai-config.js` is the single source of truth for AI model, analyze prompt, and NL search prompt. Imported by both serverless functions and Vite middleware.
- **AI model configurable** -- Set `ANTHROPIC_MODEL` env var to override the default `claude-3-haiku-20240307`.
- **Observation limit** -- Reduced `getSeriesObservations()` limit from 100,000 to 10,000. Chart resamples to 500 points anyway.
- **DRY refactor** -- Extracted `extractSeries()` helper to replace 8 occurrences of `data.seriess || []` in fred.js.

### Removed
- `src/components/ApiKeyPrompt.jsx` -- No longer needed (no login gate)
- Client-side FRED key management functions (`getApiKey`, `setApiKey`, `hasApiKey`, `clearApiKey`, `isDemoKey`, `setDemoKey`)
- FRED API rewrite in `vercel.json` (replaced by `api/fred-proxy.js`)
- Vite proxy for `/api/fred` (replaced by `fredProxyApiPlugin` middleware)

### Added
- `api/fred-proxy.js` -- Vercel serverless function for FRED API proxying
- `api/shared/ai-config.js` -- Shared AI configuration
- `.env.example` -- Documents required environment variables
- Vitest test suite with full coverage

## v1.3.0 - Search UX Improvements (2026-03-13)

### Added
- **Search Clear Button** -- An × button appears in the search bar when text is entered, allowing users to quickly reset the search input with one tap
- Clears text, closes the suggestion dropdown, and returns focus to the input

### Fixed
- **Search dropdown z-index** -- The live search dropdown no longer falls behind the desktop sidebar navigation

## v1.2.0 - Natural Language Search (2026-03-13)

### Added
- **Natural Language Search** -- Users can now ask questions in plain English (e.g., "How has inflation changed since 2020?", "Compare housing prices vs income") and AI will interpret the query, extract optimal FRED search terms, and display relevant results with an explanation banner
- New serverless function `api/nl-search.js` for AI query interpretation
- NL detection heuristic that automatically identifies natural language queries vs keyword searches
- AI interpretation banner on search results showing extracted terms and explanation

### Technical
- Added Vite dev middleware for `/api/nl-search` endpoint
- Search page merges and deduplicates results across multiple AI-extracted search terms
- Graceful fallback to standard FRED keyword search when AI is unavailable

## v1.1.0 - AI Chart Analysis (2026-03-13)

### Added
- **"Explain this chart" AI narrator** -- Click a button on any series chart to get an AI-generated narrative explaining trends, patterns, and economic significance
- Anthropic API key management in Settings page
- New serverless function `api/analyze.js` for chart analysis
- Loading skeleton, error handling, and collapsible result card

### Technical
- Statistical data summary computed client-side to minimize API token usage
- Vercel serverless functions for secure Claude API proxying
- Vite dev middleware for local development

## v1.0.0 - Initial Release (2026-03-13)

### Features
- Browse FRED categories, sources, and releases
- Interactive line charts with time range selection (1Y, 5Y, 10Y, Max)
- Full-text search with real-time dropdown suggestions
- Recently viewed series history (last 20, persisted in localStorage)
- Responsive design: mobile bottom nav, tablet grids, desktop sidebar
- Light theme with FRED blue accent
- FRED API key management with validation
