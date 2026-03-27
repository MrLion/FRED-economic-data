# Design System — FRED Economic Data

## Product Context
- **What this is:** A web-based economic data explorer that replicates and extends the FRED mobile app, with AI-powered chart analysis and natural language search.
- **Who it's for:** General audience — students, journalists, curious citizens, and analysts who want accessible economic data without the intimidation of Bloomberg or the staleness of government databases.
- **Space/industry:** Economic data visualization. Peers: fred.stlouisfed.org, Trading Economics, Our World in Data.
- **Project type:** Data dashboard / explorer (web app)

## Aesthetic Direction
- **Direction:** Industrial/Editorial — function-first like a data tool, with the typographic confidence of Our World in Data. Trustworthy and clear without being sterile.
- **Decoration level:** Intentional — subtle surface elevation and border treatments create hierarchy. Charts are the decoration.
- **Mood:** "A serious tool that respects your intelligence." Approachable enough for a student, precise enough for an analyst. The AI features feel like a smart companion, not a gimmick.
- **Reference sites:** fred.stlouisfed.org (institutional baseline), ourworldindata.org (editorial clarity), tradingeconomics.com (data density)

## Typography
- **Display/Hero:** Satoshi — modern geometric sans-serif with authoritative character. Makes "FRED Economic Data" feel like a product, not a government database. Weight 700/900.
- **Body:** Plus Jakarta Sans — warm, excellent readability at small sizes. Makes dense data feel approachable. Weight 400/500/600/700.
- **UI/Labels:** Plus Jakarta Sans 500/600
- **Data/Tables:** Geist Mono — designed by Vercel for data-heavy interfaces. Clean number alignment with tabular-nums. Weight 400/500/600.
- **Code:** Geist Mono
- **Loading:** Google Fonts for Plus Jakarta Sans and Geist Mono. Fontshare for Satoshi.
  - `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap`
  - `https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600&display=swap`
  - `https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap`
- **Scale:**
  - Hero: 48px / 3rem (Satoshi 900, -0.03em tracking)
  - H1: 42px / 2.625rem (Satoshi 700, -0.02em tracking)
  - H2: 28px / 1.75rem (Satoshi 700, -0.01em tracking)
  - H3: 20px / 1.25rem (Satoshi 700)
  - Body: 16px / 1rem (Plus Jakarta Sans 400, 1.65 line-height)
  - Body Small: 14px / 0.875rem
  - Caption: 13px / 0.8125rem
  - Label: 12px / 0.75rem (600 weight, 0.05em tracking)
  - Data: 11px / 0.6875rem (Geist Mono, uppercase labels)

## Color
- **Approach:** Restrained — navy for trust, teal exclusively for AI features, warm grays for approachability
- **Primary:** #1B3A5C — deep warm navy. Heritage trust color for financial/economic data. Used for header, primary actions, links.
- **Primary Light:** #2A5580 — hover states, secondary emphasis
- **Primary Background:** #EDF2F7 — light tint for active states, selected items
- **Accent (AI):** #0D9488 — teal. Exclusively marks AI-powered features (Explain Chart, Natural Language Search). When users see teal, they know it's AI. No other economic data site uses this.
- **Accent Light:** #14B8A6 — hover state for AI elements
- **Accent Background:** #F0FDFA — light tint for AI narrator background, AI search highlights
- **Neutrals:** Warm grays for approachability
  - Background: #F8F9FA
  - Surface: #FFFFFF
  - Text: #1A1D21
  - Text Secondary: #64748B
  - Text Muted: #94A3B8
  - Border: #E2E8F0
  - Border Light: #F1F5F9
- **Semantic:**
  - Success: #16A34A (positive data changes, confirmation)
  - Warning: #D97706 (stale data, slow loads)
  - Error: #DC2626 (failed requests, invalid input)
  - Info: #2563EB (tips, AI availability notices)
- **Dark mode:** Slate-based surfaces with reduced saturation
  - Background: #0F172A
  - Surface: #1E293B
  - Text: #F1F5F9
  - Primary flips to: #93C5FD (light blue for readability on dark)
  - Accent flips to: #2DD4BF (brighter teal for contrast)
  - Borders: #334155
  - Semantic colors brighten for contrast (Success #4ADE80, Warning #FBBF24, Error #F87171, Info #60A5FA)
- **Implementation status:** Deferred. Ship light mode first. Dark mode palette is pre-specified above for future implementation via `@media (prefers-color-scheme: dark)` or a manual toggle in Settings.

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable — generous enough for general audience, not wasteful on chart pages
- **Scale:** 2xs(2px) xs(4px) sm(8px) md(16px) lg(24px) xl(32px) 2xl(48px) 3xl(64px)
- **Page padding:** 16px (mobile), 24px (tablet), 32px (desktop)
- **Card padding:** 16px (compact cards), 24px (detail cards)

## Layout
- **Approach:** Grid-disciplined — strict columns, predictable alignment. Data apps need scanability.
- **Grid:** 1 column (mobile <640px), content + sidebar (tablet 640-1023px), sidebar + content (desktop 1024px+)
- **Max content width:** 1200px
- **Header height:** 56px (fixed)
- **Bottom nav height:** 64px (mobile only)
- **Border radius:**
  - sm: 6px (buttons, tags, inputs)
  - md: 10px (cards, dropdowns)
  - lg: 14px (modals, large containers)
  - full: 9999px (pills, search bar, avatar)

## Component States

### Loading
- **Skeleton:** Use for content areas (charts, series lists, AI narrator). Pulsing rectangles matching content shape, #E2E8F0 to #F1F5F9 animation, 1.5s ease-in-out infinite.
- **Spinner:** Use for discrete actions (search submit, load more button, AI request). 16px circle, 2px border, primary color on top arc, border-light on rest. 0.6s linear infinite rotation.
- **Never:** No full-page spinners. Content loads in zones — each zone gets its own skeleton independently.

### Empty
- Icon: 48px Lucide icon, text-muted (#94A3B8) color
- Headline: H3 (20px Satoshi 700)
- Body: Caption (13px), text-secondary, max 2 lines
- CTA: Primary button if actionable, or text link
- Layout: Centered in parent container, 48px top padding
- Examples:
  - **No search results:** Search icon + "No results for '{query}'" + "Try different keywords or browse categories" + clear search button
  - **No history:** Clock icon + "No recently viewed series" + "Search or browse categories to get started" + link to categories
  - **AI unavailable:** Sparkles icon + "AI analysis not available" + "Check your connection and try again"
  - **Empty category:** FolderOpen icon + "No series in this category" + back link

### Error
- Icon: 24px AlertTriangle (Lucide), Error color (#DC2626)
- Message: Body (16px), text color, human-readable — never raw error codes or technical messages
- Retry: "Try again" secondary button below message
- Layout: Same centered layout as empty states
- **Series not found:** special case — "Series '{id}' not found" + "It may have been discontinued or the ID may be incorrect" + "Browse categories" link

### Success
- Transient toast: bottom-center, 3s auto-dismiss, slide-up entrance (250ms ease-out)
- Style: #16A34A background, white text (Body Small 14px, 500 weight), 6px radius, md shadow
- Example: "History cleared" after clear history action

### Partial / Degraded
- **NL search fallback:** When AI fails to extract terms, fall back to keyword search silently + show info badge: "Showing keyword results" pill in Info blue (#2563EB bg, white text, 11px)
- **AI analysis failure:** Show error state inside the narrator card (teal border preserved), not a full-page error. "Unable to analyze this chart right now" + retry button
- **Stale data:** Warning badge (#D97706 bg, white text) next to the observation date when data hasn't updated in > 2x the series frequency

## Shadows
- **sm:** 0 1px 2px rgba(0,0,0,0.05) — subtle lift for cards
- **md:** 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04) — default card shadow
- **lg:** 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.04) — dropdowns, popovers
- **xl:** 0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.04) — modals, dashboard mockups

## Motion
- **Approach:** Minimal-functional — only transitions that aid comprehension
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(50-100ms) short(150-250ms) medium(250-400ms) long(400-700ms)
- **Use cases:**
  - Button hover: 150ms ease
  - Page transitions: none (instant)
  - Chart range change: 250ms ease-in-out
  - Dropdown open/close: 150ms ease-out / 100ms ease-in
  - Loading spinner: continuous rotation
- **Never animate:** chart data itself, search results appearing, card layouts

## Page Layouts

### SeriesDetail (most-visited page)
Reading order — tells the story: "what is this → where is it now → how did it get here → what does it mean"
1. **IDENTITY ZONE:** Series ID as Data label (11px Geist Mono, uppercase, text-muted) + title as H2 (28px Satoshi 700) + source attribution (Caption, text-secondary)
2. **HERO NUMBER ZONE:** Latest value at Hero size (48px Satoshi 900, text color). Units inline at H3 size (20px). Delta chip: green (#16A34A) up-arrow or red (#DC2626) down-arrow showing change from prior observation, in a pill with semantic background.
3. **CHART ZONE:** Range tab bar flush-left (1Y / 5Y / 10Y / Max as pill buttons, 6px radius). Chart full-width, height 240px mobile / 360px desktop. No chart border — chart bleeds to card edges.
4. **INSIGHT ZONE:** AI narrator card with teal left border (3px #0D9488), background #F0FDFA, 24px padding. "Explain this chart" button above card: teal background, white text, Sparkles icon.
5. **PROVENANCE ZONE:** Meta table (label/value pairs) in Caption size. Notes section collapsible if > 3 lines. Link to FRED source in Data label style.

### Home
1. **HERO:** "FRED Economic Data" as H1 (Satoshi 700). One live data point below (e.g., latest GDP or unemployment) as a concrete demo — not a description of what the app does. Subhead ≤ 20 words, Body size.
2. **RECENTLY VIEWED:** If history exists, horizontal scroll of up to 6 compact SeriesCards. Section title as Label (12px, uppercase, 0.05em tracking).
3. **EXPLORE:** Category grid — 2 columns mobile, 3 tablet, 4 desktop. Each cell: Lucide icon (24px, primary color) + category name (Body 16px, 600 weight) + series count (Caption, text-muted). 10px border-radius, surface background, sm shadow.

### List Pages (Categories, Sources, Releases)
1. **PAGE TITLE:** H2 + result count in text-muted Caption beside it
2. **LIST:** Structured rows, not cards — scannable density. Each row: primary text (Body 16px) + secondary info right-aligned (Caption, text-muted). Divider: 1px border-light. Row height: 48px minimum, vertically centered.
3. **PAGINATION:** "Load More" button (secondary style) + "Showing X of Y" in Caption above it.

### Search
1. **QUERY CONTEXT:** "Results for '{query}'" as H2 + total count in text-muted
2. **AI INDICATOR:** When NL search active, teal AI badge pill ("AI Search") + extracted search terms as teal tag pills below the header
3. **RESULTS:** Series rows — series ID (Data label, 11px Geist Mono) left-aligned, title (Body 14px) below, latest value + date right-aligned (Caption). Divider between rows.
4. **PAGINATION:** "Load More" button + "Showing X of Y" context

### Settings
Organized as a section list:
- **Section headers:** Label type (12px, 600 weight, uppercase, 0.05em tracking, text-muted)
- **Setting rows:** 56px height, icon (24px, text-secondary) + label (Body 16px) + optional description (Caption, text-muted below label) + right-aligned control (toggle, button, or chevron)
- **Sections:** Data (clear history), Display (future: dark mode toggle), About (version, FRED attribution link)

## AI Feature Visual Language
The teal accent creates a distinct visual lane for AI features:
- **AI badge:** Teal pill (#0D9488 bg, white text, 11px, 700 weight)
- **AI narrator:** Teal-tinted background (#F0FDFA), teal left border or badge, teal title
- **AI search input:** Teal border when in natural language mode
- **AI search tags:** Teal tag pills for extracted search terms
- This separation ensures users always know when they're interacting with AI vs. browsing raw data.

## Data Visualization

### Line Chart (primary)
- **Line:** #1B3A5C (primary), 2px stroke, no area fill
- **Grid:** Horizontal lines only, #E2E8F0 (border), 1px solid. No vertical grid lines — they add noise without aiding readability.
- **Axes:** X-axis dates in Data label style (11px Geist Mono, text-muted). Y-axis values in Data label, right-aligned. Tick color: text-muted (#94A3B8). No axis lines — grid lines serve this purpose.
- **Active point:** 4px circle, fill matches line color, 2px white border. Appears on hover/touch only.
- **Tooltip:** White surface (#FFFFFF), 10px border-radius, md shadow. Date in Caption (13px Geist Mono). Value in H3 (20px Satoshi 700). Padding: 8px 12px.
- **Height:** 240px mobile, 360px desktop
- **Chart container:** No border, surface background, 16px horizontal padding. Charts bleed to card edges horizontally for maximum data density.
- **Range selector:** Pill buttons, 6px radius, 28px height, 12px horizontal padding. Active state: primary bg (#1B3A5C) + white text. Inactive: transparent background + text-secondary color. Gap between pills: 4px. Transition: background 150ms ease.
- **Empty chart:** Centered message "No data available for this range" in Caption style, 120px minimum height.

## Icons
- **Library:** Lucide React — consistent with existing SVG icons in BottomNav and Header. `npm install lucide-react`.
- **Sizes:** 16px (inline text, labels), 20px (buttons, nav items), 24px (standalone, category grid, empty states)
- **Color:** Always `currentColor` — inherits from parent text color. Never hardcoded hex values on icons.
- **Stroke width:** 2px default, 1.5px for 16px icons
- **AI icon:** Sparkles, explicitly colored #0D9488 (teal accent) — the one exception to the currentColor rule
- **Category icons:** Replace all emoji with Lucide equivalents. One icon per category, primary color. Map: Money & Banking → Landmark, Prices → TrendingUp, Production & Business → Factory, Employment → Briefcase, International → Globe, Demographics → Users, Academic → GraduationCap, General → BarChart3.
- **Empty state icons:** 48px, text-muted (#94A3B8)
- **No emoji anywhere in the UI.** Emoji render inconsistently across platforms, aren't accessible by default, and clash with the Industrial/Editorial aesthetic.

## Content Direction

### Voice
- **Declarative, not descriptive.** Say what the data shows, not what the page contains. "US unemployment fell to 4.1%" not "View unemployment data."
- **Concise.** If it can be said in fewer words, do so.
- **Respectful of intelligence.** No "Welcome to...", "Explore the power of...", or "Your all-in-one solution for..." — these are AI slop patterns.
- **Data-first.** Numbers are more compelling than adjectives. Show a data point instead of describing what the app does.

### Home Hero
- **Featured indicator:** Rotate randomly on each page load from a curated list: GDP, UNRATE, CPIAUCSL, SP500, FEDFUNDS. Clicking navigates to that series.
- **Display:** Series name in Caption (13px, text-muted) above value in H1 (42px Satoshi 700) + delta from prior period as green/red semantic pill + 90-day sparkline (60px wide, 24px tall, primary color, no axis/labels).
- Subhead below: ≤ 20 words describing what FRED data covers. No generic CTAs ("Get Started") — the search bar in the header IS the call to action.
- Hero section: white background, 48px top padding, 32px bottom padding. No decorative background treatment.

### Chart Titles (AI Narrator)
- AI narrator's first sentence must be a declarative finding: "GDP grew 23% over this period" not "This chart shows GDP data from 2015 to 2025"
- Follow-up sentences provide context: comparison to historical norms, relevant events, or implications

### Source Attribution
- Every chart gets a source line below it: "Source: Federal Reserve Economic Data (FRED)" in Data label style (11px Geist Mono, text-muted, uppercase)
- Links to the original FRED series page

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-26 | Initial design system created | Created by /design-consultation based on competitive research (FRED, OWID, Trading Economics) and product positioning for general audience |
| 2026-03-26 | Teal accent for AI features | No competitor uses teal; creates instant "this is AI" signal without breaking navy trust palette |
| 2026-03-26 | Satoshi for display font | Geometric character differentiates from system fonts used by government data sites |
| 2026-03-26 | Comfortable spacing density | General audience prioritized over power-user density; breathing room reduces intimidation |
| 2026-03-26 | Page layouts added | Per-page reading order and content zones prevent ad-hoc implementer decisions |
| 2026-03-26 | Component states added | Loading/empty/error/success/partial specs ensure consistency across all features |
| 2026-03-26 | Content direction added | Editorial voice, declarative findings, source attribution — makes the OWID aesthetic claim concrete |
| 2026-03-26 | Lucide icons specified | Replace emoji with Lucide React for consistency, accessibility, and professional aesthetic |
| 2026-03-26 | Data visualization specs added | Chart is the core product — line, grid, tooltip, axis, height, range selector now fully specified |
| 2026-03-26 | Rotating hero indicator | Live data point on home page as proof of value — GDP, UNRATE, CPI, SP500, FEDFUNDS rotation |
| 2026-03-26 | Dark mode deferred | Light mode first; dark palette pre-specified for future implementation |
