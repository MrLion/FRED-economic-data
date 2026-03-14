# Changelog

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
