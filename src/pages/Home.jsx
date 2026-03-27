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

const HERO_SERIES = ['GDP', 'UNRATE', 'CPIAUCSL', 'SP500', 'FEDFUNDS'];
const HERO_CACHE_KEY = 'fred_hero_cache';
const HERO_TTL = 5 * 60 * 1000; // 5 minutes

function readHeroCache() {
  try {
    const raw = localStorage.getItem(HERO_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (Date.now() - cached.updatedAt > HERO_TTL) return null;
    return cached;
  } catch {
    return null;
  }
}

function writeHeroCache(data) {
  try {
    localStorage.setItem(HERO_CACHE_KEY, JSON.stringify({ ...data, updatedAt: Date.now() }));
  } catch {
    // quota exceeded — skip silently
  }
}

function useHeroIndicator() {
  const [hero, setHero] = useState(readHeroCache);
  const [heroLoading, setHeroLoading] = useState(!hero);

  useEffect(() => {
    if (hero) return;
    let cancelled = false;
    async function fetchHero() {
      const seriesId = HERO_SERIES[Math.floor(Math.random() * HERO_SERIES.length)];
      try {
        const [info, obs] = await Promise.all([
          getSeries(seriesId),
          getSeriesObservations(seriesId, { limit: 2 }),
        ]);
        if (cancelled) return;
        const current = obs.length > 0 ? Number(obs[obs.length - 1].value) : null;
        const prior = obs.length > 1 ? Number(obs[obs.length - 2].value) : null;
        const delta = prior && prior !== 0 ? ((current - prior) / Math.abs(prior)) * 100 : null;
        const data = {
          seriesId,
          name: info?.title || seriesId,
          value: current,
          delta,
          date: obs.length > 0 ? obs[obs.length - 1].date : null,
        };
        setHero(data);
        writeHeroCache(data);
      } catch {
        // fail silently — hero indicator is optional
      } finally {
        if (!cancelled) setHeroLoading(false);
      }
    }
    fetchHero();
    return () => { cancelled = true; };
  }, []);

  return { hero, heroLoading };
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
  const { hero, heroLoading } = useHeroIndicator();

  return (
    <div className="page home-page">
      <section className="home-hero">
        <h1>FRED Economic Data</h1>
        <p>Explore thousands of economic data series from the Federal Reserve Bank of St. Louis</p>

        {!heroLoading && hero && (
          <div
            className="hero-indicator"
            onClick={() => navigate(`/series/${hero.seriesId}`)}
          >
            <span className="hero-indicator-name">{hero.name}</span>
            <div className="hero-indicator-data">
              <span className="hero-indicator-value">
                {hero.value != null ? Number(hero.value).toLocaleString() : '—'}
              </span>
              {hero.delta != null && (
                <span className={`delta-chip ${hero.delta >= 0 ? 'delta-positive' : 'delta-negative'}`}>
                  {hero.delta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {hero.delta >= 0 ? '+' : ''}{hero.delta.toFixed(1)}%
                </span>
              )}
            </div>
            {hero.date && <span className="hero-indicator-date">{hero.date}</span>}
          </div>
        )}
      </section>

      {recentlyViewed.length > 0 && (
        <section className="home-section">
          <div className="home-section-header">
            <h2>Recently Viewed</h2>
            <button className="recent-clear-btn" onClick={clearHistory}>Clear</button>
          </div>
          <div className="recent-list-wrap">
            <div className="recent-list">
              {(showAllRecent ? recentlyViewed : recentlyViewed.slice(0, 6)).map(item => (
                <div
                  key={item.id}
                  className="recent-card"
                  onClick={() => navigate(`/series/${item.id}`)}
                >
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
          </div>
        </section>
      )}

      <section className="home-section">
        <h2>Browse Categories</h2>
        {loading && <Loading text="Loading categories..." />}
        {error && <ErrorMessage message={error} onRetry={refetch} />}
        {categories && (
          <div className="category-grid">
            {categories.map(cat => {
              const Icon = getCategoryIcon(cat.id);
              return (
                <div
                  key={cat.id}
                  className="category-card"
                  onClick={() => navigate(`/categories/${cat.id}`)}
                >
                  <Icon size={24} className="category-icon" />
                  <span className="category-name">{cat.name}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
