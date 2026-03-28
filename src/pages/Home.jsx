import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCategoryChildren, getSeriesObservations, getSeries } from '../api/fred';
import { useFred } from '../hooks/useFred';
import Loading, { ErrorMessage } from '../components/Loading';
import { Landmark, Briefcase, BarChart3, Factory, TrendingUp, TrendingDown, Globe, MapPin, GraduationCap } from 'lucide-react';

const categoryIconMap = {
  32991: Landmark,       // Money, Banking, & Finance
  10:    Briefcase,      // Population, Employment, & Labor Markets
  32992: BarChart3,      // National Accounts
  33060: Factory,        // Production & Business Activity
  32455: TrendingUp,     // Prices
  32263: Globe,          // International Data
  3008:  MapPin,         // U.S. Regional Data
  33287: GraduationCap,  // Academic Data
};

function getCategoryIcon(id) {
  return categoryIconMap[id] || BarChart3;
}

const KEY_INDICATOR_IDS = ['GDP', 'UNRATE', 'SP500', 'FEDFUNDS'];
const INDICATORS_CACHE_KEY = 'fred_indicators_cache';
const INDICATORS_TTL = 5 * 60 * 1000;

function readIndicatorsCache() {
  try {
    const raw = localStorage.getItem(INDICATORS_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (Date.now() - cached.updatedAt > INDICATORS_TTL) return null;
    return cached.indicators;
  } catch {
    return null;
  }
}

function writeIndicatorsCache(indicators) {
  if (indicators.some(ind => ind.value == null)) return; // don't cache partial results
  try {
    localStorage.setItem(INDICATORS_CACHE_KEY, JSON.stringify({ indicators, updatedAt: Date.now() }));
  } catch {
    // quota exceeded — skip silently
  }
}

function useKeyIndicators() {
  const [indicators, setIndicators] = useState(() =>
    readIndicatorsCache() ||
    KEY_INDICATOR_IDS.map(id => ({ id, name: null, value: null, delta: null, date: null, loading: true }))
  );

  useEffect(() => {
    if (readIndicatorsCache()) return;

    let cancelled = false;

    async function fetchAll() {
      const results = await Promise.allSettled(
        KEY_INDICATOR_IDS.map(async (id) => {
          const [info, obs] = await Promise.all([
            getSeries(id),
            getSeriesObservations(id, { limit: 2, sort_order: 'desc' }),
          ]);
          const current = obs.length > 0 ? Number(obs[0].value) : null;
          const prior = obs.length > 1 ? Number(obs[1].value) : null;
          const delta = prior && prior !== 0 ? ((current - prior) / Math.abs(prior)) * 100 : null;
          return { id, name: info?.title || id, value: current, delta, date: obs.length > 0 ? obs[0].date : null, loading: false };
        })
      );

      if (cancelled) return;

      const next = results.map((result, i) =>
        result.status === 'fulfilled'
          ? result.value
          : { id: KEY_INDICATOR_IDS[i], name: KEY_INDICATOR_IDS[i], value: null, delta: null, date: null, loading: false }
      );

      setIndicators(next);
      writeIndicatorsCache(next);
    }

    fetchAll();
    return () => { cancelled = true; };
  }, []);

  return indicators;
}

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

export default function Home({ recentlyViewed, clearHistory }) {
  const navigate = useNavigate();
  const [showAllRecent, setShowAllRecent] = useState(false);
  const { data: categories, loading, error, refetch } = useFred(
    () => getCategoryChildren(0),
    []
  );
  const indicators = useKeyIndicators();

  return (
    <div className="page home-page">

      {/* Key Indicators */}
      <div className="key-indicators-label">Key Indicators</div>
      <div className="key-indicators-grid">
        {indicators.map(ind => (
          <div key={ind.id} className="key-indicator-card" onClick={() => navigate(`/series/${ind.id}`)}>
            <div className="ki-name">{ind.name || ind.id}</div>
            <div className="ki-value">
              {ind.loading ? '…' : ind.value != null ? Number(ind.value).toLocaleString() : '—'}
            </div>
            {ind.delta != null && (
              <span className={`delta-chip ${ind.delta >= 0 ? 'delta-positive' : 'delta-negative'}`}>
                {ind.delta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {ind.delta >= 0 ? '+' : ''}{ind.delta.toFixed(1)}%
              </span>
            )}
            {ind.date && <div className="ki-date">{ind.date}</div>}
          </div>
        ))}
      </div>

      {/* Two-column: Recently Viewed + Browse Categories */}
      <div className="home-two-col">

        {/* Recently Viewed */}
        <div>
          {recentlyViewed.length > 0 && (
            <section className="home-section">
              <div className="home-section-header">
                <h2>Recently Viewed</h2>
                <button className="recent-clear-btn" onClick={clearHistory}>Clear</button>
              </div>
              <div className="recent-mini-grid">
                {(showAllRecent ? recentlyViewed : recentlyViewed.slice(0, 6)).map(item => (
                  <div key={item.id} className="recent-mini-card" onClick={() => navigate(`/series/${item.id}`)}>
                    <div className="recent-card-top">
                      <span className="recent-card-id">{item.id}</span>
                      {item.viewedAt && <span className="recent-card-time">{timeAgo(item.viewedAt)}</span>}
                    </div>
                    <p className="recent-card-title">{item.title}</p>
                    {item.frequency && <span className="recent-card-freq">{item.frequency}</span>}
                  </div>
                ))}
              </div>
              {recentlyViewed.length > 6 && (
                <button className="recent-see-all" onClick={() => setShowAllRecent(v => !v)}>
                  {showAllRecent ? 'Show less' : `+${recentlyViewed.length - 6} more`}
                </button>
              )}
            </section>
          )}
        </div>

        {/* Browse Categories */}
        <section className="home-section">
          <h2>Browse Categories</h2>
          {loading && <Loading text="Loading categories..." />}
          {error && <ErrorMessage message={error} onRetry={refetch} />}
          {categories && (
            <div className="category-grid">
              {categories.map(cat => {
                const Icon = getCategoryIcon(cat.id);
                return (
                  <div key={cat.id} className="category-card" onClick={() => navigate(`/categories/${cat.id}`)}>
                    <Icon size={24} className="category-icon" />
                    <span className="category-name">{cat.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
