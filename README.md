# FRED Economic Data

A web application for browsing and visualizing economic data from the Federal Reserve Bank of St. Louis (FRED). Built as a web-based alternative to the official FRED mobile app, with full support for smartphones, tablets, and desktops.

## Features

### Data Browsing
- **Category Navigation** -- Browse the full FRED category hierarchy starting from top-level categories (Money & Banking, Employment, Prices, International Data, etc.) and drill down into subcategories
- **Data Sources** -- View all 58+ data sources (Bureau of Labor Statistics, Census Bureau, Federal Reserve, IMF, World Bank, etc.) with expandable release lists
- **Releases** -- Browse economic data releases and the series they contain

### Series Visualization
- **Interactive Charts** -- Line charts powered by Recharts with automatic data point reduction for large datasets
- **Time Range Selection** -- Toggle between 1-year, 5-year, 10-year, and full history views
- **Latest Value Display** -- Prominent display of the most recent observation
- **Metadata Panel** -- Units, frequency, seasonal adjustment, date range, and source notes
- **AI Chart Analysis** -- Click "Explain this chart" to get an AI-generated narrative explaining trends, patterns, and economic significance (powered by Claude)

### Search
- **Full-Text Search** -- Search across all FRED series by keyword (GDP, unemployment, inflation, etc.)
- **Natural Language Search** -- Ask questions like "How has inflation changed since COVID?" and AI extracts the optimal FRED search terms (powered by Claude)
- **Real-Time Suggestions** -- Live dropdown with top 6 matching series as you type, with keyboard navigation
- **Clear Button** -- One-tap button to reset the search input
- **Paginated Results** -- Load more results incrementally with series count display

### History
- **Recently Viewed** -- Automatically tracks the last 20 series you've viewed, displayed on the home screen for quick access
- **Persistent Storage** -- History survives page refreshes via localStorage

### Settings
- **Clear History** -- Remove all recently viewed entries

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Build Tool | Vite |
| Routing | React Router v7 |
| Charts | Recharts |
| AI Analysis | Claude API via Vercel serverless functions |
| API | FRED REST API via server-side proxy |
| Storage | localStorage (history only) |
| Styling | Plain CSS with CSS custom properties |
| Testing | Vitest |

## Getting Started

### Prerequisites

1. **Node.js** (v18 or later)
2. **FRED API Key** -- Register for a free key at [fred.stlouisfed.org/docs/api/api_key.html](https://fred.stlouisfed.org/docs/api/api_key.html)
3. **Anthropic API Key** (optional) -- For AI chart analysis, get a key at [console.anthropic.com](https://console.anthropic.com/)

### Installation

```bash
git clone https://github.com/MrLion/FRED-economic-data.git
cd FRED-economic-data
npm install
cp .env.example .env   # Then fill in your API keys
npm run dev
```

Open `http://localhost:5173` in your browser. The app loads directly -- no API key entry needed. AI features require `ANTHROPIC_API_KEY` in your `.env` file.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FRED_API_KEY` | Yes | FRED API key for data access |
| `ANTHROPIC_API_KEY` | For AI | Anthropic API key for chart analysis and NL search |
| `ANTHROPIC_MODEL` | No | Override AI model (default: `claude-3-haiku-20240307`) |

### Deploying to Vercel

1. Import the project and select **Vite** as the framework preset
2. Set `FRED_API_KEY` and `ANTHROPIC_API_KEY` in Vercel environment variables
3. Deploy

## Project Structure

```
api/
  shared/
    ai-config.js           # Shared AI prompts + model config
  analyze.js               # Vercel serverless -- chart analysis
  nl-search.js             # Vercel serverless -- NL search
  fred-proxy.js            # Vercel serverless -- FRED API proxy
src/
  api/
    fred.js                # FRED API client -- all endpoint wrappers
  components/
    AiNarrator.jsx         # AI-powered chart analysis with Claude
    BottomNav.jsx          # Mobile bottom tab bar / desktop sidebar
    Chart.jsx              # Recharts line chart with tooltips
    Header.jsx             # Top bar with search and settings
    Loading.jsx            # Loading spinner and error display
    SeriesCard.jsx         # Card component for series lists
  hooks/
    useFred.js             # Generic async data fetching hook
    useHistory.js          # Recently viewed localStorage hook
  pages/
    Home.jsx               # Category grid + recently viewed
    Categories.jsx         # Hierarchical category browser
    Search.jsx             # Search results with pagination + NL search
    SeriesDetail.jsx       # Chart, metadata, and notes for a series
    Sources.jsx            # Data sources with expandable releases
    Releases.jsx           # Release list and release detail
    Settings.jsx           # History management
```

## Responsive Design

The layout adapts across three breakpoints:

- **Mobile** (< 640px) -- Bottom tab navigation, 2-column category grid, compact cards
- **Tablet** (640px -- 1023px) -- 3-column grids, larger typography
- **Desktop** (1024px+) -- Fixed sidebar navigation replaces bottom tabs, 4-column grids, wider chart area

## License

MIT
