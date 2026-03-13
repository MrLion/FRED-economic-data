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
- **Paginated Results** -- Load more results incrementally with series count display

### History
- **Recently Viewed** -- Automatically tracks the last 20 series you've viewed, displayed on the home screen for quick access
- **Persistent Storage** -- History survives page refreshes via localStorage

### Settings
- **API Key Management** -- Enter, validate, and change your FRED API key
- **Anthropic API Key** -- Optional key for AI-powered chart analysis (get one at [console.anthropic.com](https://console.anthropic.com/))
- **Clear History** -- Remove all recently viewed entries

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Build Tool | Vite |
| Routing | React Router v6 |
| Charts | Recharts |
| AI Analysis | Claude API via Vercel serverless function |
| API | FRED REST API (api.stlouisfed.org) |
| Storage | localStorage (API key, history) |
| Styling | Plain CSS with CSS custom properties |

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
npm run dev
```

Open `http://localhost:5173` in your browser and enter your FRED API key when prompted. To enable AI chart analysis, add your Anthropic API key in the Settings page.

### Deploying to Vercel

This project is configured for Vercel deployment with a `vercel.json` that handles:
- FRED API proxying via rewrites (`/api/fred/*` to `api.stlouisfed.org`)
- AI analysis via a serverless function (`/api/analyze`)
- SPA routing (all routes fall back to `index.html`)

Select **Vite** as the framework preset when importing the project.

## Project Structure

```
src/
  api/
    fred.js              # FRED API client -- all endpoint wrappers
  components/
    AiNarrator.jsx       # AI-powered chart analysis with Claude
    ApiKeyPrompt.jsx     # First-run API key entry with validation
    BottomNav.jsx        # Mobile bottom tab bar / desktop sidebar
    Chart.jsx            # Recharts line chart with tooltips
    Header.jsx           # Top bar with search and settings
    Loading.jsx          # Loading spinner and error display
    SeriesCard.jsx       # Card component for series lists
  hooks/
    useFred.js           # Generic async data fetching hook
    useHistory.js        # Recently viewed localStorage hook
  pages/
    Home.jsx             # Category grid + recently viewed
    Categories.jsx       # Hierarchical category browser
    Search.jsx           # Search results with pagination
    SeriesDetail.jsx     # Chart, metadata, and notes for a series
    Sources.jsx          # Data sources with expandable releases
    Releases.jsx         # Release list and release detail
    Settings.jsx         # API key and history management
```

## Responsive Design

The layout adapts across three breakpoints:

- **Mobile** (< 640px) -- Bottom tab navigation, 2-column category grid, compact cards
- **Tablet** (640px -- 1023px) -- 3-column grids, larger typography
- **Desktop** (1024px+) -- Fixed sidebar navigation replaces bottom tabs, 4-column grids, wider chart area

## API Proxy

During development, the Vite dev server proxies `/api/fred/*` requests to `https://api.stlouisfed.org/fred/*` to avoid CORS restrictions. A custom Vite middleware also handles `/api/analyze` requests locally by proxying to the Anthropic API. In production on Vercel, both are handled by rewrites and a serverless function respectively.

## FRED API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `category/children` | Browse category hierarchy |
| `category/series` | List series in a category |
| `series` | Series metadata |
| `series/observations` | Data points for charts |
| `series/search` | Full-text keyword search |
| `sources` | List all data sources |
| `source/releases` | Releases for a source |
| `releases` | List all releases |
| `release/series` | Series within a release |

## License

MIT
